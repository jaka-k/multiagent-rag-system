from typing import Annotated, Dict, List, Sequence, TypedDict

from langchain_core.messages import BaseMessage

from langgraph.graph.message import add_messages


class FlashcardTeamState(TypedDict):
    # The add_messages function defines how an update should be processed
    # Default is to replace. add_messages says "append"
    messages: Annotated[Sequence[BaseMessage], add_messages]

    # The knowledge gaps identified
    knowledge_gaps: str
    # Key concepts identified by Agent 1
    key_concepts: List[str]
    # Flashcards created by Agent 2
    flashcards: List[Dict[str, str]]
    team_members: List[str]
    documents: Annotated
