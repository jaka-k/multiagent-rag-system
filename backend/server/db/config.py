from server.core.config import settings

DATABASE_URL = (
    f"{settings.postgres_user}:{settings.postgres_password}"
    f"@{settings.postgres_host}:{settings.postgres_port}"
    f"/{settings.postgres_db}"
)
