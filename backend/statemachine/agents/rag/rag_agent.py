# https://python.langchain.com/v0.2/docs/tutorials/qa_chat_history/#agent-constructor
import uuid


from langchain_openai import ChatOpenAI
from statemachine.agents.rag.rag_agent_history import get_chat_history
from statemachine.agents.rag.templates import (
    SYSTEM_PROMPT,
    CONTEXTUALIZE_Q_SYSTEM_PROMPT,
)
from langchain_core.prompts import MessagesPlaceholder
from langchain.chains import create_retrieval_chain, create_history_aware_retriever
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain.chains.combine_documents import create_stuff_documents_chain
from statemachine.embeddings.retriever import get_retriever_tool
from langchain.prompts import ChatPromptTemplate


class LangChainChat:
    def __init__(self, chat_id: uuid.UUID):
        self.chat_id = chat_id
        self.llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0,
            stream_usage=True,
        )
        self.llm_mini = ChatOpenAI(model="gpt-4o-mini", temperature=0)
        self.retriever_tool = get_retriever_tool()

        self.history_aware_prompt = ChatPromptTemplate.from_messages(
            [
                ("system", CONTEXTUALIZE_Q_SYSTEM_PROMPT),
                MessagesPlaceholder("chat_history"),
                ("human", "{input}"),
            ]
        )
        self.rag_prompt = ChatPromptTemplate.from_messages(
            [
                ("system", SYSTEM_PROMPT),
                ("human", "{input}"),
            ]
        )

        self.history_aware_retriever = create_history_aware_retriever(
            self.llm_mini, self.retriever_tool, self.history_aware_prompt
        )

        self.qa_chain = create_stuff_documents_chain(self.llm, self.rag_prompt)

        self.agent_chain = create_retrieval_chain(
            self.history_aware_retriever, self.qa_chain
        )

    async def process_chain_input(self, user_input: str, thread_id: uuid.UUID):
        chat_history = await get_chat_history(self.chat_id)

        return RunnableWithMessageHistory(
            self.agent_chain,
            get_session_history=lambda: chat_history,
            input_messages_key="input",
            history_messages_key="chat_history",
            output_messages_key="answer",
        ).stream(
            {"input": user_input},
            config={"configurable": {"session_id": thread_id}},
        )
