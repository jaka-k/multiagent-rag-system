"""Alembic migration environment.

URL is read from pydantic Settings (server.core.config) — the same .env that
drives the application.  All SQLModel table models are imported here so that
`--autogenerate` can diff the current schema against the live database.
"""

from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from sqlmodel import SQLModel

from alembic import context

# ---------------------------------------------------------------------------
# Bring all ORM models into scope so SQLModel.metadata is fully populated.
# Import order follows the dependency graph (leaves first).
# ---------------------------------------------------------------------------
import server.models.links  # noqa: F401 — ChapterQueueLink
import server.models.document  # noqa: F401 — Document, Chapter
import server.models.flashcard  # noqa: F401 — Deck, Flashcard
import server.models.session  # noqa: F401 — Session, Message, *Queue
import server.models.area  # noqa: F401 — Area, Instruction
import server.models.user  # noqa: F401 — User, Token

# ---------------------------------------------------------------------------
# Alembic Config object — gives access to values in alembic.ini.
# ---------------------------------------------------------------------------
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# The metadata object that Alembic diffs against when autogenerating.
target_metadata = SQLModel.metadata


# ---------------------------------------------------------------------------
# Build the database URL from pydantic Settings so that the same .env file
# is the single source of truth for both the app and the migration tooling.
# ---------------------------------------------------------------------------
def get_url() -> str:
    # Imported here (not at module level) so that a missing .env only fails
    # when a migration command is actually executed, not on every import.
    from server.core.config import settings

    return (
        f"postgresql+psycopg://{settings.postgres_user}:{settings.postgres_password}"
        f"@{settings.postgres_host}:{settings.postgres_port}"
        f"/{settings.postgres_db}"
    )


# ---------------------------------------------------------------------------
# Offline mode: emit SQL to stdout without a live DB connection.
# Useful for reviewing or applying migrations in environments without direct
# DB access (e.g. production deploy pipelines).
# ---------------------------------------------------------------------------
def run_migrations_offline() -> None:
    context.configure(
        url=get_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


# ---------------------------------------------------------------------------
# Online mode: connect to the DB and apply migrations directly.
# Uses NullPool so that the connection is fully closed after the migration
# run — important when the same process might fork afterwards.
# ---------------------------------------------------------------------------
def run_migrations_online() -> None:
    cfg = config.get_section(config.config_ini_section, {})
    cfg["sqlalchemy.url"] = get_url()

    connectable = engine_from_config(
        cfg,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
