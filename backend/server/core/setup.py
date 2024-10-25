from contextlib import _AsyncGeneratorContextManager, asynccontextmanager
from typing import Any, AsyncGenerator, Callable
import anyio.to_thread
from fastapi import FastAPI

from server.db.database import init_db


async def set_threadpool_tokens(number_of_tokens: int = 100) -> None:
    """Adjust the threadpool tokens if needed."""
    limiter = anyio.to_thread.current_default_thread_limiter()
    limiter.total_tokens = number_of_tokens


def lifespan_factory(
    create_tables_on_start: bool = True,
) -> Callable[[FastAPI], _AsyncGeneratorContextManager[Any]]:
    """Factory to create a lifespan async context manager for the FastAPI app."""

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncGenerator:
        """Lifespan manager to initialize resources on startup and cleanup on shutdown."""
        await set_threadpool_tokens()

        if create_tables_on_start:
            try:
                await init_db()
                print("Database tables created successfully.")
            except Exception as e:
                print(f"Error during database initialization: {e}")
                raise e

        yield

    return lifespan
