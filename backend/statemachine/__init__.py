# from statemachine.db.pg_config import get_db_checkpoint
from tools.env import set_key_if_undefined


set_key_if_undefined("ENVIRONMENT")

set_key_if_undefined("OPENAI_API_KEY")
set_key_if_undefined("LANGCHAIN_API_KEY")
set_key_if_undefined("LANGCHAIN_ENDPOINT")
set_key_if_undefined("LANGCHAIN_PROJECT")
set_key_if_undefined("LANGCHAIN_TRACING_V2")

# set_key_if_undefined("POSTGRES_USER")
# set_key_if_undefined("POSTGRES_PASSWORD")
# set_key_if_undefined("POSTGRES_HOST")
# set_key_if_undefined("POSTGRES_DB")

# get_db_checkpoint()
