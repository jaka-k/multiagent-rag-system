# https://python.langchain.com/v0.2/docs/tutorials/qa_chat_history/#agent-constructor
import uuid

from langchain.prompts import ChatPromptTemplate
from langchain_core.beta.runnables.context import Context
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import MessagesPlaceholder
from langchain_core.runnables import RunnableParallel, RunnablePassthrough
from langchain_openai import ChatOpenAI

from statemachine.agents.rag.rag_agent_history import get_chat_history
from statemachine.agents.rag.retriever import get_retriever_tool
from statemachine.agents.rag.templates import (
    SYSTEM_PROMPT,
    CONTEXTUALIZE_Q_SYSTEM_PROMPT,
)



class LangChainChat:
    def __init__(self, chat_id: uuid.UUID, area: str):
        self.chat_id = chat_id
        self.llm = ChatOpenAI(
            model_name="gpt-4o-mini",
            temperature=0,
            stream_usage=True,
        )
        self.llm_mini = ChatOpenAI(model_name="gpt-4o-mini", temperature=0)
        self.retriever_tool = get_retriever_tool(area)

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
        ## https://github.com/langchain-ai/langchain/discussions/22146#discussioncomment-9551077
        ## https://python.langchain.com/api_reference/core/beta/langchain_core.beta.runnables.context.Context.html#langchain_core.beta.runnables.context.Context

        self.history_aware_retriever = (self.history_aware_prompt | self.llm_mini | StrOutputParser()
                                        )

        self.qa_chain = (
                RunnableParallel(
                    modified_input=lambda x: x,
                    context=lambda x: self.retriever_tool.invoke(x),
                ) | Context.setter("retriever_context")
                | self.rag_prompt
                | self.llm | StrOutputParser() | {
                    "result": RunnablePassthrough(),
                    "context": Context.getter("retriever_context")
                }
        )

        self.agent_chain = (
                self.history_aware_retriever | self.qa_chain
        )

    async def process_chain_input(self, user_input: str, thread_id: uuid.UUID):
        chat_history = await get_chat_history(self.chat_id)

        return self.agent_chain.astream(
            {"input": user_input,
             "chat_history": chat_history.messages[-3:]},
            config={"configurable": {"session_id": thread_id}},
        )

    def inspect(state):
        """Print the state passed between Runnables in a langchain and pass it on"""
        print(state)
        return state
