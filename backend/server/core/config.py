from pathlib import Path
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = str(Path(__file__).resolve().parent.parent.parent.parent / ".env")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_ENV_FILE, extra="ignore")

    environment: Optional[str] = Field(default="development")
    learning_area: Optional[str] = Field(default="general")

    postgres_host: Optional[str] = None
    postgres_user: Optional[str] = None
    postgres_password: Optional[str] = None
    postgres_db: Optional[str] = None
    postgres_port: int = 5432

    hashing_secret_key: Optional[str] = None
    hashing_algorithm: str = "HS512"

    access_token_expire_minutes: int = 30
    refresh_token_expire_minutes: int = 30 * 24 * 60

    openrouter_api_key: Optional[str] = None
    llm_model: str = "deepseek/deepseek-v4-pro"
    llm_fast_model: str = "qwen/qwen3-30b-a3b-instruct-2507"
    embedding_model: str = "qwen/qwen3-embedding-8b"
    langchain_api_key: Optional[str] = None
    langchain_project: Optional[str] = None
    langchain_endpoint: Optional[str] = None
    langchain_tracing_v2: Optional[str] = None

    anki_url: Optional[str] = None
    anki_pull_interval_seconds: int = 0  # 0 disables the pull-sync loop

    next_public_firebase_api_key: Optional[str] = None
    next_public_firebase_project_id: Optional[str] = None
    next_public_firebase_bucket: Optional[str] = None
    next_public_backend_domain: Optional[str] = None
    next_public_backend_url: Optional[str] = None

    firebase_cred_path: Optional[str] = None

    grafana_domain: Optional[str] = None
    grafana_admin_password: Optional[str] = None
    grafana_admin_user: Optional[str] = None

    grafana_api_key: Optional[str] = None

    otel_enabled: bool = False
    otel_endpoint: str = "otelcol:4317"


settings = Settings()

ALLOWED_ORIGINS = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:3001",
    "https://mrag.krajnc.cc",
    "https://api.mrag.krajnc.cc",
]

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
