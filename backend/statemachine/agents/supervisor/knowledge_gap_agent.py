from typing import List, Optional
from langchain.prompts import PromptTemplate
from langchain_core.pydantic_v1 import BaseModel, Field
from langchain_openai import ChatOpenAI
from pydantic import ValidationError


class KeyConceptsOutput(BaseModel):
    key_concepts: List[str] = Field(
        description="List of key concepts to understand and memorize"
    )


class KnowledgeGaps:
    def __init__(self, content: str):
        self.content = content

    def get_content(self) -> str:
        return self.content


class KnowledgeIdentificationAgent:
    def __init__(self, model: Optional[ChatOpenAI] = None):
        if model is None:
            model = ChatOpenAI(
                model="gpt-3.5-turbo",
                temperature=0,
                stream_usage=True,
            )
        self.model = model
        self.llm = self.model.with_structured_output(KeyConceptsOutput)

        self.prompt_template = PromptTemplate(
            input_variables=["knowledge_gaps"],
            template="""Given the following user knowledge level:

            {knowledge_gaps}

            List the key concepts and ideas that are important to understand and memorize. Provide the list as a JSON array of strings.""",
        )
        self.chain = self.prompt_template | self.llm

    def identify_key_concepts(self, knowledge_gaps: str) -> List[str]:
        # Invoke the chain and expect it to return a KeyConceptsOutput model
        response = self.chain.invoke({"knowledge_gaps": knowledge_gaps})

        # Explicitly cast or parse the response into the KeyConceptsOutput model
        if isinstance(response, dict):
            # Parse dictionary response into the Pydantic model
            try:
                response = KeyConceptsOutput.parse_obj(response)
            except ValidationError as e:
                raise ValueError(f"Invalid response format: {e}")

        # The response is now guaranteed to be a KeyConceptsOutput model
        return response.key_concepts
