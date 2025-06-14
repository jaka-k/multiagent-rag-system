from typing import List, TypedDict, Optional

from pydantic import BaseModel, Field

from statemachine.dtos.flashcard_dto import FlashcardDTO


class Nugget(BaseModel):
    concept: str = Field(..., description="Short technical term")
    justification: str = Field(..., description="≤120 words why user cares")
    source_quote: str = Field(..., description="≤240 excerpt from retrieved document")
    example_code: Optional[str] = None


class NuggetList(BaseModel):
    nuggets: List[Nugget] = Field(..., description="List of memorizable nuggets")


class SupervisorAgentState(TypedDict):
    question: str
    llm_response: str

    knowledge_nuggets: NuggetList
    identified_concepts: List[dict]

    flashcard_agent: bool
    web_search_agent: bool

    flashcards: List[FlashcardDTO]

    documents: List[str]
