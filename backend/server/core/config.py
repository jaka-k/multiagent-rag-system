from pathlib import Path
from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

# Local development reads the repo-root .env if it exists. In Kubernetes there is
# no .env: everything comes from real environment variables (ConfigMap + Secrets).
_ENV_FILE = Path(__file__).resolve().parents[3] / ".env"


class Settings(BaseSettings):
    """Backend configuration.

    Fields without a default are required: the app refuses to start without them.
    Defaults target local development; deployments override them via env vars.
    """

    model_config = SettingsConfigDict(env_file=_ENV_FILE, extra="ignore")

    # ── Database ────────────────────────────────────────────────────────────
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_user: str
    postgres_password: str
    postgres_db: str
    # Log every SQL statement (very noisy; for local debugging only).
    db_echo: bool = False

    # ── Auth ────────────────────────────────────────────────────────────────
    # Signs session JWTs (HS512 -> use 64 random bytes).
    jwt_secret_key: str
    jwt_algorithm: str = "HS512"
    access_token_expire_minutes: int = 30
    refresh_token_expire_minutes: int = 30 * 24 * 60
    # Browser origins allowed for CORS and the chat WebSocket. Comma-separated in env.
    cors_origins: Annotated[list[str], NoDecode] = [
        "http://localhost:3000",
        "http://localhost:3001",
    ]

    # ── LLMs (OpenRouter) ───────────────────────────────────────────────────
    # LangSmith tracing is configured by LangChain itself from LANGSMITH_* /
    # LANGCHAIN_* env vars; it is not part of these settings.
    openrouter_api_key: str
    llm_model: str = "deepseek/deepseek-v4-pro"
    llm_fast_model: str = "qwen/qwen3-30b-a3b-instruct-2507"
    embedding_model: str = "qwen/qwen3-embedding-8b"

    # ── Anki ────────────────────────────────────────────────────────────────
    anki_url: str = "http://localhost:8765"
    anki_pull_interval_seconds: int = 0  # 0 disables the pull-sync loop

    # ── Firebase ────────────────────────────────────────────────────────────
    # Credentials come from Google Application Default Credentials, i.e. the
    # standard GOOGLE_APPLICATION_CREDENTIALS env var pointing at the key file.
    firebase_storage_bucket: str

    # ── Telemetry ───────────────────────────────────────────────────────────
    otel_enabled: bool = False
    otel_endpoint: str = "localhost:4317"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


settings = Settings()

ALLOWED_ORIGINS = settings.cors_origins

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
# Chat: auto-routed, but only to providers honouring our params (structured
# output) and not retaining prompts. StreamLake is the cheapest fp8 host.
CHAT_PROVIDER_PREFS = {
    "order": ["StreamLake"],
    "require_parameters": True,
    "data_collection": "deny",
}
# Embeddings: one pinned host, no fallback — mixed providers/quantizations
# would mix vector spaces inside one index.
EMBEDDING_PROVIDER_PREFS = {
    "only": ["DeepInfra"],
    "allow_fallbacks": False,
    "data_collection": "deny",
}
LLM_MODEL = settings.llm_model
LLM_FAST_MODEL = settings.llm_fast_model
