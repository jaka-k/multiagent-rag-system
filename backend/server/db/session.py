from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import async_sessionmaker
from server.db.config import DATABASE_URL

engine = create_async_engine(DATABASE_URL, echo=True, future=True)

async_session = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)


async def init_db():
    """Initialize the database with all the tables defined in SQLModel models."""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide a new SQLAlchemy session for each request."""
    async with async_session() as session:
        yield session
