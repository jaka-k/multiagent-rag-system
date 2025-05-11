from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from sqlmodel import SQLModel


from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession

from server.core.logger import app_logger
from server.db.config import DATABASE_URL

engine = create_async_engine(f"postgresql+psycopg://{DATABASE_URL}", echo=True, future=True)
SQLAlchemyInstrumentor().instrument(engine=engine.sync_engine)

async_session = async_sessionmaker(bind=engine, expire_on_commit=False)


async def init_db():
    """Initialize the database with all the tables defined in SQLModel models."""
    app_logger.info("🚀 Starting DB Initialization...")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    app_logger.info("✅  DB Initialization Completed!")


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide a new SQLModel session for each request."""
    async with async_session() as session:
        yield session


@asynccontextmanager
async def get_single_session():
    async for session in get_session():
        yield session
        break


async def drop_all_tables():
    """Drop all the tables defined in SQLModel models."""
    app_logger.info("Starting DB deletion...")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
    app_logger.info("DB deleted.")


# TODO: If needed https://github.com/jod35/lib-api/blob/main/src/db/main.py
