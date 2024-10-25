from statemachine.db.client import get_chroma_db_client
from statemachine.embeddings.model import CHROMA_PATH
from statemachine.embeddings.utils import get_embedding_function
from langchain_chroma import Chroma


def get_retriever_tool():
    db = Chroma(
        client=get_chroma_db_client(),
        persist_directory=CHROMA_PATH,
        embedding_function=get_embedding_function(),
    )

    retriever = db.as_retriever()

    return retriever
