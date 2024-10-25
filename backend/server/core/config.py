from pathlib import Path
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    environment: Optional[str] = Field(default="development")
    learning_area: Optional[str] = Field(default="general")

    postgres_host: Optional[str] = None
    postgres_user: Optional[str] = None
    postgres_password: Optional[str] = None
    postgres_db: Optional[str] = None

    hashing_secret_key: Optional[str] = None
    hashing_algorithm: str = "HS512"

    access_token_expire_minutes: int = 30
    refresh_token_expire_minutes: int = 30 * 24 * 60

    openai_api_key: Optional[str] = None
    langchain_api_key: Optional[str] = None
    langchain_project: Optional[str] = None
    langchain_endpoint: Optional[str] = None
    langchain_tracing_v2: Optional[str] = None

    @property
    def database_url(self) -> Optional[str]:
        if all(
            [
                self.postgres_user,
                self.postgres_password,
                self.postgres_host,
                self.postgres_db,
            ]
        ):
            # TODO: NOT USED, CONSDIER asyncpg
            return f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}/{self.postgres_db}"
        return None

    class Config:
        env_file = str(Path(__file__).resolve().parent.parent.parent.parent / ".env")
        fields = {
            "environment": {"env": "ENVIRONMENT"},
            "learning_area": {"env": "LEARNING_AREA"},
            "postgres_host": {"env": "POSTGRES_HOST"},
            "postgres_user": {"env": "POSTGRES_USER"},
            "postgres_password": {"env": "POSTGRES_PASSWORD"},
            "postgres_db": {"env": "POSTGRES_DB"},
            "hashing_secret_key": {"env": "HASHING_SECRET_KEY"},
            "hashing_algorithm": {"env": "HASHING_ALGORITHM"},
        }


settings = Settings()
