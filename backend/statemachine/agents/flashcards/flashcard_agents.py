from typing import List, Optional, Dict, Any, Union
import uuid
from langchain.prompts import PromptTemplate
from langchain_core.pydantic_v1 import BaseModel, Field
from langchain_openai import ChatOpenAI
from pydantic import ValidationError


class Flashcard(BaseModel):
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()), description="Unique identifier"
    )
    front: str = Field(description="The front text of the flashcard")
    back: str = Field(description="The back text of the flashcard")


class FlashcardsOutput(BaseModel):
    flashcards: List[Flashcard] = Field(description="List of flashcards")


class FlashcardCreationAgent:
    def __init__(self, model: Optional[ChatOpenAI] = None):
        if model is None:
            model = ChatOpenAI(
                model="gpt-4",
                temperature=0,
                stream_usage=True,
            )
        self.model = model
        self.llm = self.model.with_structured_output(FlashcardsOutput)
        self.prompt_template = PromptTemplate(
            input_variables=["key_concepts"],
            template="""Create flashcards for the following key concepts:

                    {key_concepts}

                    For each concept, provide a flashcard with 'front' and 'back' text.""",
        )
        # Chain the prompt template with the llm
        self.chain = self.prompt_template | self.llm

    def create_flashcards(self, key_concepts: List[str]) -> List[Flashcard]:
        # Join the key concepts into a single string
        key_concepts_str = ", ".join(key_concepts)

        # Invoke the chain and get the response
        response: Union[Dict[str, Any], FlashcardsOutput] = self.chain.invoke(
            {"key_concepts": key_concepts_str}
        )

        # Check if the response is a dictionary
        if isinstance(response, dict):
            # Parse dictionary response into the Pydantic model
            try:
                response = FlashcardsOutput.parse_obj(response)
            except ValidationError as e:
                raise ValueError(f"Invalid response format: {e}")

        # The response is now guaranteed to be a FlashcardsOutput model
        return response.flashcards
