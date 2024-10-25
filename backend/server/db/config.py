import os
from tools.env import get_environment_variable

ENVIRONMENT = os.getenv("ENVIRONMENT", "production")

POSTGRES_USER = get_environment_variable("POSTGRES_USER")
POSTGRES_PASSWORD = get_environment_variable("POSTGRES_PASSWORD")
POSTGRES_HOST = get_environment_variable("POSTGRES_HOST")
POSTGRES_DB = get_environment_variable("POSTGRES_DB")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")

# Construct the DATABASE_URL
DATABASE_URL = f"postgresql+psycopg://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
