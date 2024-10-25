import os

from psycopg_pool import ConnectionPool
from psycopg.rows import dict_row

from langgraph.checkpoint.postgres import PostgresSaver
from langchain_postgres import PostgresChatMessageHistory
from tools.env import get_environment_variable

POSTGRES_USER = get_environment_variable("POSTGRES_USER")
POSTGRES_PASSWORD = get_environment_variable("POSTGRES_PASSWORD")
POSTGRES_HOST = get_environment_variable("POSTGRES_HOST")
POSTGRES_DB = get_environment_variable("POSTGRES_DB")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")

# Construct the DATABASE_URL
DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
TABLE_NAME = "rag_chat_history"

connection_kwargs = {
    "autocommit": True,
    "prepare_threshold": 0,
    "row_factory": dict_row,
}

pool = ConnectionPool(
    conninfo=DATABASE_URL,
    max_size=20,
    kwargs=connection_kwargs,
)


def get_db_checkpoint():
    with pool.connection() as conn:
        checkpointer = PostgresSaver(conn)
        checkpointer.setup()
        return checkpointer


def get_chat_history(session_id):
    with pool.connection() as conn:
        PostgresChatMessageHistory.create_tables(conn, TABLE_NAME)
        return PostgresChatMessageHistory(TABLE_NAME, session_id, sync_connection=conn)
