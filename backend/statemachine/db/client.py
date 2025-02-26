import chromadb
from chromadb.config import Settings

from tools.env import get_environment_variable

Environment = get_environment_variable("ENVIRONMENT")
isProd = not Environment == "dev"


def get_chroma_db_client():
    client = chromadb.HttpClient(
        host="localhost",
        port=8000,
        ssl=False,
        settings=Settings(allow_reset=True),
    )
    return client
