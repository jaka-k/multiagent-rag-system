from langchain_postgres import PGVector

from server.db.database import engine
from server.db.vectordb.embeddings import get_embedding_function


def get_vector_store(collection: str) -> PGVector:
    return PGVector(
        embeddings=get_embedding_function(),
        connection=engine,
        collection_name=collection,
        use_jsonb=True,
        async_mode=True,
        create_extension=False,
    )
