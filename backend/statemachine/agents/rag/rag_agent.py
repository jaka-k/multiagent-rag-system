import uuid
from typing import AsyncIterator, Literal

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnableLambda
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field

from server.core.config import LLM_MODEL, LLM_FAST_MODEL, settings
from server.core.exceptions import QueryRewriteError
from statemachine.agents.rag.rag_agent_history import get_chat_history
from statemachine.agents.rag.retriever import retrieve_chapters
from statemachine.agents.rag.templates import (
    SYSTEM_PROMPT,
    CONTEXTUALIZE_Q_SYSTEM_PROMPT,
)


class RewrittenQuery(BaseModel):
    query: str = Field(description="Self-contained reformulation of the user input.")
    expansion_terms: list[str] = Field(
        default_factory=list,
        description="Extra search-helpful tokens not already present in the query.",
    )
    retrieval_tag: Literal["shallow", "normal", "deep"] = Field(
        default="normal",
        description="shallow=trivial lookup, deep=synthesis, normal=otherwise.",
    )
    needs_more_history: bool = Field(
        default=False,
        description="True if pronoun resolution required older history than was provided.",
    )


class RagAgent:
    def __init__(self, chat_id: uuid.UUID, area: str):
        self.chat_id = chat_id
        self.area = area
        self.llm = ChatGoogleGenerativeAI(
            model=LLM_MODEL,
            temperature=0,
            google_api_key=settings.google_api_key,
        )
        self.llm_flash = ChatGoogleGenerativeAI(
            model=LLM_FAST_MODEL,
            temperature=0,
            google_api_key=settings.google_api_key,
        )
        self.history_aware_prompt = ChatPromptTemplate.from_messages(
            [
                MessagesPlaceholder("chat_history"),
                ("user", "{input}"),
                ("system", CONTEXTUALIZE_Q_SYSTEM_PROMPT),
            ]
        )
        self.rag_prompt = ChatPromptTemplate.from_messages(
            [
                ("system", SYSTEM_PROMPT),
                ("user", "{modified_input}"),
            ]
        )

        self.history_aware_retriever = (
            self.history_aware_prompt
            | self.llm_flash.with_structured_output(RewrittenQuery)
        )
        self.agent_chain = RunnableLambda(self._run_agent)

    async def resolve_query(self, inp) -> RewrittenQuery:
        try:
            result: RewrittenQuery = await self.history_aware_retriever.ainvoke({
                "chat_history": inp["chat_history"][-3:],
                "input":        inp["input"],
            })

            if result.needs_more_history:
                result = await self.history_aware_retriever.ainvoke({
                    "chat_history": inp["chat_history"][-6:],
                    "input":        inp["input"],
                })
            return result
        except Exception as exc:
            raise QueryRewriteError(
                f"Query rewriter failed for chat {self.chat_id}: {exc}"
            ) from exc

    async def retrieve(self, rewritten: RewrittenQuery):
        full_query = rewritten.query
        if rewritten.expansion_terms:
            full_query += " " + " ".join(rewritten.expansion_terms)

        k = {"shallow": 3, "deep": 8}.get(rewritten.retrieval_tag, 5)

        return await retrieve_chapters(query=full_query, area=self.area, k_chapters=k)

    async def _run_agent(self, inp) -> AsyncIterator[dict]:
        """
        Async generator: yields {"result": token} for each LLM token,
        then yields {"context": docs} once at the end.
        """
        rewritten = await self.resolve_query(inp)
        docs = await self.retrieve(rewritten)

        qa_chain = self.rag_prompt | self.llm | StrOutputParser()
        async for token in qa_chain.astream({
            "modified_input": rewritten.query,
            "context": docs,
        }):
            yield {"result": token}

        yield {"context": docs}

    async def process_chain_input(self, user_input: str, thread_id: uuid.UUID):
        chat_history = await get_chat_history(self.chat_id)

        return self.agent_chain.astream(
            {"input": user_input,
             "chat_history": chat_history.messages},
            config={"configurable": {"session_id": thread_id}},
        )
