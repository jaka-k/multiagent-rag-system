from typing import Dict, Any, Optional
from .errors import (
    AnkiDeckCreationError,
    AnkiNoteAdditionError,
    AnkiServiceError,
    AnkiSyncError,
)
from pydantic import BaseModel
from .config import invoke
import logging

logger = logging.getLogger(__name__)


class AnkiResponse(BaseModel):
    result: Any
    error: Optional[str]


class AnkiService:
    def __init__(self, deck_name: str):
        self.deck_name = f"Testing::{deck_name}"
        self.deck_id = self.create_deck()

    def create_deck(self) -> str:
        response_data = invoke("createDeck", deck=self.deck_name)
        response = AnkiResponse(**response_data)
        if response.error:
            raise AnkiDeckCreationError(
                f"Failed to create deck '{self.deck_name}': {response.error}",
                error=response.error,
            )
        return str(response.result)

    def sync(self) -> bool:
        response_data = invoke("sync")
        response = AnkiResponse(**response_data)
        if response.error:
            raise AnkiSyncError(
                f"Failed to sync collection: {response.error}",
                error=response.error,
            )
        return True

    def get_deck_names_and_ids(self) -> Dict[str, str]:
        response_data = invoke("deckNamesAndIds")
        response = AnkiResponse(**response_data)
        if response.error:
            raise AnkiServiceError(
                f"Failed to retrieve deck names and IDs: {response.error}",
                error=response.error,
            )
        return response.result

    def add_flashcard(self, front: str, back: str) -> str:
        note = {
            "deckName": self.deck_name,
            ## can it be done with "deck_id"
            "modelName": "prettify-nord-basic",
            "fields": {"Front": front, "Back": back},
            "options": {"allowDuplicate": False},
            "tags": [],
        }
        response_data = invoke("addNote", note=note)
        response = AnkiResponse(**response_data)
        if response.error:
            raise AnkiNoteAdditionError(
                f"Failed to add flashcard to deck '{self.deck_name}': {response.error}",
                error=response.error,
            )
        return str(response.result)
