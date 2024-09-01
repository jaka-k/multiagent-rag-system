# https://python.langchain.com/v0.2/docs/tutorials/qa_chat_history/#agent-constructor
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from statemachine.db.pg_config import get_db_checkpoint
from statemachine.embeddings.retriever import get_retriever_tool
from langchain_core.messages import HumanMessage


class LangChainChat:
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4o-mini")
        self.memory = get_db_checkpoint()
        self.retriever_tool = get_retriever_tool()
        self.tools = [self.retriever_tool]
        self.agent_executor = create_react_agent(
            self.llm, self.tools, checkpointer=self.memory
        )

    def process_input(self, user_input: str, thread_id: str):
        human_message = HumanMessage(content=user_input)
        return self.agent_executor.stream(
            {"messages": [human_message]},
            config={"configurable": {"thread_id": thread_id}},
        )
