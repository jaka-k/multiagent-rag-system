from typing import List, Dict, Any, Union

from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field, ValidationError

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
            input_variables=["key_concepts", "knowledge_gaps"],
            template="""Based on the following identified key concepts, create flashcards that serve a student on an advanced level:
    
                    {key_concepts}
    
                    For each concept, provide a flashcard with 'front' and 'back' text. Format the flashcards in HTML markup, 
                    whereby you you use the <h3> tag fro the front, and always use appropriate tags on the back, like <code> for code examples.
                    
                    If applicable consolidate the summarized text with sub-topics from the identified knowledge gaps:
                    
                    {knowledge_gaps}""",
        )
        # Chain the prompt template with the llm
        self.chain = self.prompt_template | self.llm

    def invoke(self, state: dict) -> dict:
        """
        Process logic specific to the flashcard agent.
        """
        print("FlashcardAgent is processing...")
        key_concepts = state.get("identified_concepts", "")
        knowledge_gaps = state.get("knowledge_gaps", "")

        state["flashcards"] = self.create_flashcards(key_concepts, knowledge_gaps)
        return state

    def create_flashcards(self, key_concepts: List[str], knowledge_gaps: str) -> List[FlashcardDTO]:
        # Join the key concepts into a single string
        key_concepts_str = ", ".join(key_concepts)

        # Invoke the chain and get the response
        response: Union[Dict[str, Any], FlashcardsOutput] = self.chain.invoke(
            {
                "key_concepts": key_concepts_str,
                "knowledge_gaps": knowledge_gaps,
            }
        )

        # Check if the response is a dictionary
        if isinstance(response, dict):
            # Parse dictionary response into the Pydantic model
            try:
                response = FlashcardsOutput.model_validate(response)
            except ValidationError as e:
                raise ValueError(f"Invalid response format: {e}")

        # The response is now guaranteed to be a FlashcardsOutput model
        return response.flashcards
