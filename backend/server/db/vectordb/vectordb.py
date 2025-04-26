import chromadb
from chromadb.config import Settings


def get_vector_db_client():
    client = chromadb.HttpClient(
        host="localhost",
        port=8000,
        ssl=False,
        settings=Settings(allow_reset=True),
    )

    return client

def delete_all_collections():
    client = get_vector_db_client()
    for name in  client.list_collections():
        client.delete_collection(name)
        print(f"ChromaDB collection deleted {name} 👾")
