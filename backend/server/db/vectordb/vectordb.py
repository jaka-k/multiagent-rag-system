from langchain_community.vectorstores import ApertureDB

from tools.env import get_environment_variable

Environment = get_environment_variable("ENVIRONMENT")
isProd = not Environment == "dev"

def get_vector_db_client(descriptor: str) -> ApertureDB:
    return ApertureDB(
        host="localhost",
        port=6767,
        descriptor_set=descriptor
    )