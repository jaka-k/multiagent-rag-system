"""Deck-scoped operations. Deck creation is explicit (ensure_deck), adds are
batched with a single AnkiWeb sync per batch."""
import logging
from typing import List, Optional, Tuple

from server.service.anki.client import AnkiConnectClient
from server.service.anki.errors import AnkiNoteAdditionError, AnkiSyncError, AnkiServiceError

logger = logging.getLogger(__name__)


class AnkiService:
    def __init__(self, deck_name: str, client: Optional[AnkiConnectClient] = None):
        self.deck_name = f"RAG::{deck_name}"
        self.client = client or AnkiConnectClient()

    async def ensure_deck(self) -> str:
        """Create the deck if missing (createDeck is idempotent) and return its id."""
        try:
            return await self.client.create_deck(self.deck_name)
        except AnkiServiceError:
            raise
        except Exception as exc:
            raise AnkiServiceError(f"Failed to ensure deck '{self.deck_name}': {exc}") from exc

    async def add_flashcards(self, cards: List[Tuple[str, str]]) -> List[Optional[str]]:
        """Batch-add (front, back) pairs, then one AnkiWeb sync.

        Returns note ids aligned with the input; None marks a rejected duplicate.
        """
        if not cards:
            return []
        try:
            note_ids = await self.client.add_notes(
                self.deck_name, [{"front": f, "back": b} for f, b in cards]
            )
        except AnkiServiceError as exc:
            raise AnkiNoteAdditionError(
                f"Failed to add {len(cards)} note(s) to '{self.deck_name}': {exc}",
                error=exc.error,
            ) from exc

        # mrag-minimal's template deck-override sends cards to Default; move them.
        added = [nid for nid in note_ids if nid is not None]
        if added:
            card_ids = await self.client.find_cards("nid:" + ",".join(added))
            await self.client.change_deck(card_ids, self.deck_name)

        try:
            await self.client.sync()
        except AnkiServiceError as exc:
            logger.warning(
                "AnkiWeb sync failed after adding %d note(s) to %s; "
                "notes are in the local collection and will sync later: %s",
                len(cards), self.deck_name, exc,
            )
        return note_ids

    async def sync(self) -> bool:
        try:
            await self.client.sync()
            return True
        except AnkiServiceError as exc:
            raise AnkiSyncError(f"Failed to sync collection: {exc}", error=exc.error) from exc
