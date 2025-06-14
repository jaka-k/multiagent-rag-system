import logging

import chromadb
from chromadb.config import Settings as ChromaSettings

from server.core.config import settings

# TODO: SETUP ChromDB otel https://cookbook.chromadb.dev/running/health-checks/#docker-compose

def get_vector_db_client():
    client = chromadb.HttpClient(
        host=settings.chroma_host,
        port=settings.chroma_port,
        ssl=False,
        settings=ChromaSettings(allow_reset=False)
    )

    return client


def delete_all_collections():
    client = get_vector_db_client()
    for name in  client.list_collections():
        try:
            client.delete_collection(name)
            logging.info(f"ChromaDB collection deleted {name} 👾")
        except Exception as e:
            logging.info(f"ChromaDB error while deleting collection {name} ❌\nError: {e}")
            pass