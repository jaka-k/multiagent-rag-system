from typing import List

from statemachine.agents.flashcards.flashcard_agents import (
    FlashcardCreationAgent,
    Flashcard,
)
from statemachine.agents.supervisor.knowledge_gap_agent import (
    KnowledgeGaps,
    KnowledgeIdentificationAgent,
)
from langchain_openai import ChatOpenAI


def flashcards_subgraph(knowledge_gaps: KnowledgeGaps) -> List[Flashcard]:
    # Initialize agents with specified models
    knowledge_identification_agent = KnowledgeIdentificationAgent(
        model=ChatOpenAI(
            model="gpt-4o",
            temperature=0,
            stream_usage=True,
        )
    )
    flashcard_creation_agent = FlashcardCreationAgent(
        model=ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0,
            stream_usage=True,
        )
    )

    # Step 1: Identify key concepts
    key_concepts = knowledge_identification_agent.identify_key_concepts(
        knowledge_gaps.get_content()
    )

    # Step 2: Create flashcards
    flashcards = flashcard_creation_agent.create_flashcards(key_concepts)

    return flashcards
