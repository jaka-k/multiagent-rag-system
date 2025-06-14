import uuid

from langchain.prompts import ChatPromptTemplate
from langchain_core.beta.runnables.context import Context
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser
from langchain_core.prompts import MessagesPlaceholder
from langchain_core.runnables import RunnableParallel, RunnablePassthrough, RunnableLambda
from langchain_openai import ChatOpenAI

from statemachine.agents.rag.rag_agent_history import get_chat_history
from statemachine.agents.rag.retriever import get_retriever_tool
from statemachine.agents.rag.templates import (
    SYSTEM_PROMPT,
    CONTEXTUALIZE_Q_SYSTEM_PROMPT_V2,
)


class RagAgent:
    def __init__(self, chat_id: uuid.UUID, area: str):
        self.chat_id = chat_id
        self.area = area
        self.llm = ChatOpenAI(
            model_name="gpt-4.1",
            temperature=0,
            stream_usage=True,
        )
        self.llm_mini = ChatOpenAI(model_name="gpt-4.1", temperature=0)
        self.retriever_tool = get_retriever_tool

        self.history_aware_prompt = ChatPromptTemplate.from_messages(
            [
                MessagesPlaceholder("chat_history"),
                ("user", "{input}"),
                ("system", CONTEXTUALIZE_Q_SYSTEM_PROMPT_V2),
            ]
        )
        self.rag_prompt = ChatPromptTemplate.from_messages(
            [
                ("system", SYSTEM_PROMPT),
                ("user", "{modified_input}"),
            ]
        )

        self.history_aware_retriever = (self.history_aware_prompt | self.llm_mini | JsonOutputParser()
                                        )
        self.rewrite_chain = RunnableLambda(self.resolve_query)
        self.retrieval_chain = RunnableLambda(self.retrieve)
        self.qa_chain = (
                RunnableParallel(
                    modified_input=lambda x: x["query"],
                    context=self.retrieval_chain,
                ) | Context.setter("retriever_context")
                | self.rag_prompt
                | self.llm | StrOutputParser() | {
                    "result": RunnablePassthrough(),
                    "context": Context.getter("retriever_context")
                }
        )

        self.agent_chain = (
                self.rewrite_chain | self.qa_chain
        )

    def resolve_query(self, inp):
        result = self.history_aware_retriever.invoke({
            "chat_history": inp["chat_history"][-3:],   # list of messages
            "input":        inp["input"]
        })


        if result["needs_more_history"]:
            result = self.history_aware_retriever.invoke({
                "chat_history": inp["chat_history"][-6:],
                "input":        inp["input"]
            })
        return result

    def retrieve(self, payload):
        tag = payload["retrieval_tag"]

        full_query = payload["query"]
        if payload["expansion_terms"]:
            full_query += " " + " ".join(payload["expansion_terms"])

        if tag == "shallow":
            k = 3
        elif tag == "deep":
            k = 8
        else:
            k = 5

        retriever = self.retriever_tool(self.area, k)
        docs = retriever.invoke(full_query)
        return docs

    async def process_chain_input(self, user_input: str, thread_id: uuid.UUID):
        chat_history = await get_chat_history(self.chat_id)

        return self.agent_chain.astream(
            {"input": user_input,
             "chat_history": chat_history.messages},
            config={"configurable": {"session_id": thread_id}},
        )

    def inspect(state):
        """Print the state passed between Runnables -- for debugging"""
        print(state)
        return state
