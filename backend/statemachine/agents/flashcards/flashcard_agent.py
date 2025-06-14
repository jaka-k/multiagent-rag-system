import json
from typing import List

from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field, ValidationError

from server.core.logger import app_logger
from statemachine.agents.analysis.knowledge_identification_agent import Concept
from statemachine.agents.flashcards.templates import CARDS_TO_HTML_PROMPT_V2
from statemachine.dtos.flashcard_dto import FlashcardDTO


class FlashcardsOutput(BaseModel):
    flashcards: List[FlashcardDTO] = Field(description="List of flashcards")


class FlashcardAgent:
    def __init__(self):
        self.model = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0
        )

        self.llm = self.model.with_structured_output(FlashcardsOutput)
        self.prompt_template = PromptTemplate(
            input_variables=["key_concepts"],
            template=CARDS_TO_HTML_PROMPT_V2,
        )
        self.chain = self.prompt_template | self.llm

    def invoke(self, state: dict) -> dict:
        """
        Process logic specific to the flashcard agent.
        """
        app_logger.info("\033[94m🤖 FlashcardAgent is processing...\033[0m")
        key_concepts = state.get("identified_concepts", [])

        state["flashcards"] = self.create_flashcards(key_concepts)
        return state

    def create_flashcards(self, key_concepts: List[Concept | dict]) -> List[FlashcardDTO]:
        if not key_concepts:
            return []

        # Ensure we have Concept objects
        concepts = [c if isinstance(c, Concept) else Concept.model_validate(c)
                    for c in key_concepts]

        concepts_dict = [c.model_dump() for c in concepts]

        cards_out: FlashcardsOutput = self.chain.invoke({"key_concepts": concepts_dict})
        return cards_out.flashcards
