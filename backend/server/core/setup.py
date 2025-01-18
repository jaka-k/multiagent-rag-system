from contextlib import _AsyncGeneratorContextManager, asynccontextmanager
from typing import Any, AsyncGenerator, Callable

import anyio.to_thread
from fastapi import FastAPI

from server.core.logger import logger
from server.db.database import init_db
from server.db.pubsub import start_all_listeners


async def set_threadpool_tokens(number_of_tokens: int = 100) -> None:
    limiter = anyio.to_thread.current_default_thread_limiter()
    limiter.total_tokens = number_of_tokens


def lifespan_factory(
        create_tables_on_start: bool = True,
) -> Callable[[FastAPI], _AsyncGeneratorContextManager[Any]]:
    @asynccontextmanager
    async def lifespan() -> AsyncGenerator:
        await set_threadpool_tokens()

        if create_tables_on_start:
            try:
                await init_db()
                logger.info("Database tables created successfully.")
                await start_all_listeners()
                logger.info("Database listeners initiated successfully.")
            except Exception as e:
                logger.warn(f"Error during database initialization: {e}")
                raise e

        yield

    return lifespan
