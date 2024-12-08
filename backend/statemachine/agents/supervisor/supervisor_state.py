from typing import List, TypedDict

from statemachine.dtos.flashcard_dto import FlashcardDTO


class SupervisorAgentState(TypedDict):
    question: str
    llm_response: str

    knowledge_gaps: str
    identified_concepts: List[str]

    flashcard_agent: bool
    web_search_agent: bool

    flashcards: List[FlashcardDTO]

    documents: List[str]
