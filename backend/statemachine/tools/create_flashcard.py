from langchain_core.tools import tool
from statemachine.dtos.flashcard_dto import FlashcardDTO


@tool
def create_flashcard() -> FlashcardDTO:
    """Create html flashcards for Anki."""

    return FlashcardDTO("1", "2", "3")
