from typing import List, TypedDict


class SupervisorAgentState(TypedDict):
    question: str
    knowledge_gaps: str

    flashcard_agent: bool
    web_search_agent: bool

    documents: List[str]
