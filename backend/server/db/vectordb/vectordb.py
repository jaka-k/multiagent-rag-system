import logging

import chromadb
from chromadb.config import Settings

from tools.env import get_environment_variable

CHROMA_HOST = get_environment_variable("CHROMA_HOST")

def get_vector_db_client():
    client = chromadb.HttpClient(
        host=CHROMA_HOST,
        port=8000,
        ssl=False,
        settings=Settings(allow_reset=True),
    )

    return client

def delete_all_collections():
    client = get_vector_db_client()
    for name in  client.list_collections():
        client.delete_collection(name)
        logging.info(f"ChromaDB collection deleted {name} 👾")
