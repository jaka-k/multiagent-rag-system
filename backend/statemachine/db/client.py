import chromadb
from chromadb.config import Settings


def get_db_client():
    client = chromadb.HttpClient(
        host="localhost", port=8000, ssl=False, settings=Settings(allow_reset=True)
    )
    return client
