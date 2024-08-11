# https://python.langchain.com/v0.2/docs/tutorials/qa_chat_history/#agent-constructor
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.sqlite import SqliteSaver
from statemachine.embeddings.retriever import get_retriever_tool
from langchain_core.messages import HumanMessage

llm = ChatOpenAI(model="gpt-4o-mini")
memory = SqliteSaver.from_conn_string(":memory:")

retriever_tool = get_retriever_tool()
tools = [retriever_tool]


agent_executor = create_react_agent(llm, tools, checkpointer=memory)

while True:
    print(memory)
    humaninput = input(">> ")
    for s in agent_executor.stream(
        {"messages": [HumanMessage(content=humaninput)]}, config={"configurable": {"thread_id": "abc123"}}
         ):
        print(s)
        print("----")
