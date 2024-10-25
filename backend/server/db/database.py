from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel

from sqlalchemy.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import async_sessionmaker

from server.db.config import DATABASE_URL

engine = create_async_engine(DATABASE_URL, echo=True, future=True)

async_session = async_sessionmaker(bind=engine, expire_on_commit=False)


async def init_db():
    """Initialize the database with all the tables defined in SQLModel models."""
    print("Starting DB Initialization...")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    print("DB Initialization Completed.")


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide a new SQLModel session for each request."""
    async with async_session() as session:
        yield session


async def drop_all_tables():
    """Drop all the tables defined in SQLModel models."""
    print("Starting DB deletation...")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
    print("DB deleted.")


# TODO: If needed https://github.com/jod35/lib-api/blob/main/src/db/main.py
