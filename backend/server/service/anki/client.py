"""Stateless async AnkiConnect client. Construction has no side effects;
`invoke` enforces the {result, error} envelope and raises AnkiServiceError."""
from typing import Any, Dict, List, Optional

import httpx

from server.core.config import settings
from server.service.anki.errors import AnkiServiceError

_client: Optional[httpx.AsyncClient] = None


def _http() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(timeout=30.0)
    return _client


class AnkiConnectClient:
    def __init__(self, url: Optional[str] = None):
        self.url = url or settings.anki_url
        if not self.url:
            raise RuntimeError("ANKI_URL is not configured. Set it in your .env file.")

    async def invoke(self, action: str, **params) -> Any:
        payload: Dict[str, Any] = {"action": action, "params": params, "version": 6}
        try:
            response = await _http().post(self.url, json=payload)
            response.raise_for_status()
            data = response.json()
        except AnkiServiceError:
            raise
        except Exception as exc:
            raise AnkiServiceError(f"AnkiConnect unreachable ({action}): {exc}") from exc

        if not isinstance(data, dict) or "error" not in data or "result" not in data:
            raise AnkiServiceError(f"Invalid AnkiConnect response for {action!r}")
        if data["error"]:
            raise AnkiServiceError(f"AnkiConnect {action} failed: {data['error']}", error=data["error"])
        return data["result"]

    # ── typed actions ────────────────────────────────────────────────────

    async def version(self) -> int:
        return await self.invoke("version")

    async def create_deck(self, name: str) -> str:
        return str(await self.invoke("createDeck", deck=name))

    async def deck_names_and_ids(self) -> Dict[str, str]:
        return await self.invoke("deckNamesAndIds")

    async def add_notes(self, deck: str, cards: List[Dict[str, str]]) -> List[Optional[str]]:
        """Batch-add Front/Back notes. Returns one note id per card, None where
        AnkiConnect rejected the note (e.g. duplicate)."""
        notes = [
            {
                "deckName": deck,
                "modelName": "mrag-minimal",
                "fields": {"Front": c["front"], "Back": c["back"]},
                "options": {"allowDuplicate": False},
                "tags": [],
            }
            for c in cards
        ]
        result = await self.invoke("addNotes", notes=notes)
        return [str(nid) if nid is not None else None for nid in result]

    async def sync(self) -> None:
        """One AnkiWeb round-trip. Call once per batch, not per note."""
        await self.invoke("sync")

    async def change_deck(self, card_ids: List[int], deck: str) -> None:
        """Move cards into `deck` (a note type's deck-override can ignore addNote's deckName)."""
        if card_ids:
            await self.invoke("changeDeck", cards=card_ids, deck=deck)

    # ── read actions (pull-sync, docs/rework/06) ─────────────────────────

    async def find_cards(self, query: str) -> List[int]:
        return await self.invoke("findCards", query=query)

    async def cards_info(self, card_ids: List[int]) -> List[Dict[str, Any]]:
        """Scheduling fields per card, incl. `note` (maps note ids to card ids)."""
        if not card_ids:
            return []
        return await self.invoke("cardsInfo", cards=card_ids)

    async def get_latest_review_id(self, deck: str) -> int:
        """Watermark: monotonic id of the deck's newest review, 0 if none."""
        return await self.invoke("getLatestReviewID", deck=deck)
