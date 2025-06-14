from langchain_chroma import Chroma

from server.db.vectordb.embdeddings import get_embedding_function
from server.db.vectordb.vectordb import get_vector_db_client


def get_retriever_tool(collection: str, k: int):
    db = Chroma(
        client=get_vector_db_client(),
        embedding_function=get_embedding_function(),
        collection_name=collection
    )

    retriever = db.as_retriever(search_kwargs={'k': k})

    return retriever
