from tools.env import set_key_if_undefined

set_key_if_undefined("ENVIRONMENT")

set_key_if_undefined("OPENAI_API_KEY")

set_key_if_undefined("POSTGRES_HOST")
set_key_if_undefined("POSTGRES_USER")
set_key_if_undefined("POSTGRES_PASSWORD")
set_key_if_undefined("POSTGRES_DB")