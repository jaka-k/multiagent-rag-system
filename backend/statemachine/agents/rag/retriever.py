from server.db.vectordb.vectordb import get_vector_store


def get_retriever_tool(collection: str, k: int):
    db = get_vector_store(collection)
    return db.as_retriever(search_kwargs={"k": k})
