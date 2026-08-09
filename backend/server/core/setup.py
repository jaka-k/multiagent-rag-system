import asyncio
from contextlib import _AsyncGeneratorContextManager, asynccontextmanager
from typing import Any, AsyncGenerator, Callable

import anyio.to_thread
from fastapi import FastAPI
from sqlmodel import select

from server.core.config import settings
from server.core.firebase import init_firebase
from server.core.logger import app_logger
from server.db.database import init_db
from server.db.pubsub import start_all_listeners


async def _anki_pull_loop(interval: int) -> None:
    """Periodic pull of Anki review state for every deck (docs/rework/06).

    The watermark check inside sync_deck makes idle iterations one HTTP
    call per deck, so a small interval stays cheap.
    """
    from server.db.database import get_single_session
    from server.models.flashcard import Deck
    from server.service.anki.pull_sync import sync_deck

    while True:
        await asyncio.sleep(interval)
        try:
            async with get_single_session() as session:
                decks = (await session.execute(select(Deck))).scalars().all()
                for deck in decks:
                    await sync_deck(session, deck)
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            app_logger.error(f"Anki pull loop iteration failed: {exc}", exc_info=exc)


async def set_threadpool_tokens(number_of_tokens: int = 100) -> None:
    limiter = anyio.to_thread.current_default_thread_limiter()
    limiter.total_tokens = number_of_tokens


def lifespan_factory(
        create_tables_on_start: bool = True,
) -> Callable[[FastAPI], _AsyncGeneratorContextManager[Any]]:
    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncGenerator:
        await set_threadpool_tokens()

        init_firebase()
        app_logger.info("🔥 Firebase initialized successfully.")

        if create_tables_on_start:
            try:
                await init_db()
                app_logger.info("🗄 Database tables created successfully.")
                await start_all_listeners()
                app_logger.info("👂 Database listeners initiated successfully.")
            except Exception as e:
                app_logger.warn(f"Error during database initialization: {e}")
                raise e

        pull_task = None
        if settings.anki_pull_interval_seconds > 0:
            pull_task = asyncio.create_task(
                _anki_pull_loop(settings.anki_pull_interval_seconds)
            )
            app_logger.info(
                f"🔁 Anki pull-sync loop started (every {settings.anki_pull_interval_seconds}s)."
            )

        yield

        if pull_task:
            pull_task.cancel()

    return lifespan
