from statemachine.embeddings.model import CHROMA_PATH
from statemachine.embeddings.utils import get_embedding_function
from langchain_core.messages import HumanMessage
from langchain_chroma import Chroma
from langchain.tools.retriever import create_retriever_tool
from langchain_openai import ChatOpenAI


def get_retriever_tool():
    db = Chroma(
        persist_directory=CHROMA_PATH, embedding_function=get_embedding_function()
    )

    retriever = db.as_retriever()

    retriever_tool = create_retriever_tool(
        retriever,
        "book_chapter_retriever",
        "Searches and returns excerpts from the Autonomous Agents blog post.",
    )

    return retriever_tool