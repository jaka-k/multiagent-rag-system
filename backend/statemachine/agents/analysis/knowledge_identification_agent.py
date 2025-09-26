from typing import List, Optional, Union

from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import ValidationError, BaseModel, Field

from statemachine.agents.analysis.templates import KNOWLEDGE_TO_CARDS_PROMPT_V2
from statemachine.agents.supervisor.supervisor_state import SupervisorAgentState, NuggetList


class Concept(BaseModel):
    concept: str = Field(..., description="Short technical term")
    category: str = Field(..., description="Category from predefined list")
    definition: str = Field(..., description="Concise; underline key terms with <u>")
    example: Optional[str] = Field(None, description="Minimal code or config snippet")
    anti_pattern: Optional[str] = Field(None, description="Specific mistake + consequence")
    performance: Optional[str] = Field(None, description="Quantifiable metric, e.g. O(n) or 30 % latency")
    contrast_pair: Optional[str] = Field(None, description="Concept it is often confused with")
    source: Optional[str] = Field(None, description="Source reference from the retrieved document")


class ConceptList(BaseModel):
    key_concepts: List[Concept] = Field(
        description="List of key concepts to understand and memorize"
    )

class KnowledgeIdentificationAgent:
    """
    The KnowledgeAnalysisAgent identifies conceptual gaps in the user's understanding
    based on the question, LLM response, and retrieved documents.

    It produces a list of key concepts the user should learn, updates the state to indicate
    whether flashcards should be created, and whether additional web searches might be needed.
    """

    def __init__(self):
        self.model = ChatOpenAI(
            model="gpt-5",
            temperature=0,
        )
        self.llm = self.model.with_structured_output(ConceptList)

        self.knowledge_identification_prompt = PromptTemplate(
            input_variables=["knowledge_nuggets"],
            template=KNOWLEDGE_TO_CARDS_PROMPT_V2,
        )
        self.chain = self.knowledge_identification_prompt | self.llm

    def analyze(self, state: SupervisorAgentState) -> SupervisorAgentState:
        knowledge_nuggets = state.get("knowledge_nuggets", NuggetList(nuggets=[]))
        if not knowledge_nuggets.nuggets:
            state["flashcard_agent"] = False
            state["web_search_agent"] = False
            return state

        response = self.chain.invoke({"knowledge_nuggets": [n.model_dump() for n in knowledge_nuggets.nuggets]})
        concepts = parse_concepts(response)
        state["flashcard_agent"] = len(concepts) > 0
        state["web_search_agent"] = should_trigger_web_search(concepts)
        state["identified_concepts"] = [c.model_dump() for c in concepts]
        return state


def parse_concepts(response: Union[dict, ConceptList]) -> List[Concept]:
    if isinstance(response, ConceptList):
        return response.key_concepts
    try:
        return ConceptList.model_validate(response).key_concepts
    except ValidationError as e:
        raise ValueError(f"Invalid response format: {e}")

    return parsed_response


def should_trigger_web_search(concepts: List[Concept]) -> bool:
    return False
