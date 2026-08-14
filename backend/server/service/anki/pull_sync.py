"""Pull Anki review state into AnkiCardState (docs/rework/06).

Order matters: AnkiWeb sync() first — reviews happen on phone/desktop, not
in the container — then read, then upsert. A per-deck watermark skips
unchanged decks."""
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import select

from server.core.logger import app_logger
from server.models.anki_sync import AnkiCardState, AnkiSyncRun
from server.models.flashcard import Deck, Flashcard
from server.service.anki.client import AnkiConnectClient
from server.service.anki.errors import AnkiServiceError

# Anki queue ints → readable states
_QUEUE = {-3: "buried", -2: "buried", -1: "suspended", 0: "new", 1: "learning", 2: "review", 3: "learning"}


async def sync_deck(db_session, deck: Deck, force: bool = False) -> AnkiSyncRun:
    """One pull for one deck. Commits the run row and card states."""
    client = AnkiConnectClient()
    deck_name = f"RAG::{deck.name}"
    run = AnkiSyncRun(deck_id=deck.id)

    # AnkiWeb -> container first; on failure read whatever local state exists.
    try:
        await client.sync()
    except AnkiServiceError as exc:
        app_logger.warning(f"AnkiWeb sync failed before pull of {deck_name}: {exc}")
        run.status = "partial"
        run.error = f"ankiweb sync: {exc}"

    prev = (await db_session.execute(
        select(AnkiSyncRun.latest_review_id)
        .where(AnkiSyncRun.deck_id == deck.id, AnkiSyncRun.status.in_(["ok", "partial"]))
        .order_by(AnkiSyncRun.started_at.desc()).limit(1)
    )).scalar_one_or_none()

    watermark = await client.get_latest_review_id(deck_name)
    run.latest_review_id = watermark
    if not force and prev is not None and watermark == prev:
        run.status = "skipped"
        run.completed_at = datetime.now(timezone.utc)
        db_session.add(run)
        await db_session.commit()
        return run

    card_ids = await client.find_cards(f'deck:"{deck_name}"')
    infos = await client.cards_info(card_ids)
    by_note = {str(i["note"]): i for i in infos}

    flashcards = (await db_session.execute(
        select(Flashcard).where(Flashcard.deck_id == deck.id, Flashcard.anki_id.is_not(None))
    )).scalars().all()

    now = datetime.now(timezone.utc)
    updated = 0
    for fc in flashcards:
        info = by_note.get(fc.anki_id)
        state = await db_session.get(AnkiCardState, fc.id)
        if info is None:
            if state and not state.is_deleted_in_anki:
                state.is_deleted_in_anki = True
                state.synced_at = now
                db_session.add(state)
                updated += 1
            continue
        if state is None:
            state = AnkiCardState(flashcard_id=fc.id, anki_card_id=str(info["cardId"]))
        state.anki_card_id = str(info["cardId"])
        state.reps = info.get("reps", 0)
        state.lapses = info.get("lapses", 0)
        state.interval_days = max(info.get("interval", 0), 0)  # negative = seconds for learning cards
        state.ease_factor = info.get("factor", 0)
        state.queue = _QUEUE.get(info.get("queue", 0), "new")
        state.is_deleted_in_anki = False
        state.synced_at = now
        db_session.add(state)
        updated += 1

    run.cards_updated = updated
    run.completed_at = now
    db_session.add(run)
    await db_session.commit()
    app_logger.info(
        "Anki pull-sync completed",
        extra={"step": "anki.pull", "deck": deck_name, "cards_updated": updated,
               "watermark": watermark, "status": run.status},
    )
    return run


async def sync_area(db_session, area_id) -> Optional[AnkiSyncRun]:
    """Sync the deck belonging to an area; None if the area has no deck."""
    deck = (await db_session.execute(
        select(Deck).where(Deck.area_id == area_id)
    )).scalars().first()
    if deck is None:
        return None
    return await sync_deck(db_session, deck)
