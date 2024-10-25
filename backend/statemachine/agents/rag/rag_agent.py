# https://python.langchain.com/v0.2/docs/tutorials/qa_chat_history/#agent-constructor
from langchain_openai import ChatOpenAI
from statemachine.agents.rag.templates import SYSTEM_PROMPT
from statemachine.db.pg_config import get_chat_history, get_db_checkpoint
from statemachine.embeddings.retriever import get_retriever_tool
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import HumanMessage
from langchain.prompts import PromptTemplate


class LangChainChat:
    def __init__(self, chat_id: str):
        self.chat_history = get_chat_history(chat_id)
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0,
            stream_usage=True,
        )
        self.rag_prompt = PromptTemplate(
            template=SYSTEM_PROMPT, input_variables=["question", "context"]
        )
        # TODO ADD PERSISTENCE -> FROM LANGGRAPH SETUP
        self.memory = get_db_checkpoint()
        self.retriever_tool = get_retriever_tool()
        self.agent_chain = self.rag_prompt | self.llm | StrOutputParser()

    def process_chain_input(self, user_input: str, thread_id: str):
        CONTEXT = self.retriever_tool.invoke(user_input)

        self.chat_history.add_message([HumanMessage(content="bark")])

        return self.agent_chain.stream(
            {"question": user_input, "context": CONTEXT},
            config={"configurable": {"thread_id": thread_id}},
        )
