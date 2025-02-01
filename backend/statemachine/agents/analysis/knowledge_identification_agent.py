from typing import List, Optional, Union

from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import ValidationError, BaseModel, Field

from statemachine.agents.supervisor.supervisor_state import SupervisorAgentState


class ConceptSchema(BaseModel):
    concept: str = Field(..., description="Short technical name of the concept")
    category: str = Field(..., description="Category from predefined list")
    definition: str = Field(..., description="Explanation with HTML underlined terms")
    example: Optional[str] = Field(None, description="Code snippet or scenario")
    anti_pattern: Optional[str] = Field(None, description="Common mistake to avoid")
    contrast_pair: Optional[str] = Field(None, description="Similar concept to contrast")


class KeyConceptsOutput(BaseModel):
    key_concepts: List[ConceptSchema] = Field(
        description="List of key concepts to understand and memorize"
    )

class KnowledgeGaps(BaseModel):
    def __init__(self, content: str):
        self.content = content

    def get_content(self) -> str:
        return self.content


class KnowledgeIdentificationAgent:
    """
    The KnowledgeAnalysisAgent identifies conceptual gaps in the user's understanding
    based on the question, LLM response, and retrieved documents.

    It produces a list of key concepts the user should learn, updates the state to indicate
    whether flashcards should be created, and whether additional web searches might be needed.
    """

    def __init__(self):
        self.model = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0,
        )
        self.llm = self.model.with_structured_output(KeyConceptsOutput)

        self.knowledge_identification_prompt = PromptTemplate(
            input_variables=["knowledge_gaps"],
            template="""Given the user's knowledge gaps below:
                {knowledge_gaps}
                
                Generate a JSON array of key concepts for flashcard creation. Follow these **Strict Flashcard Creation Rules**:
                
                1. **Card Content Requirements**:
                   - **Front**: Must contain a **specific technical term** (e.g., "Mutex Contention" rather than "Performance").
                   - **Back**: Must include:
                     - Exact syntax or semantic differences.
                     - Code snippets showing _specific_ usage.
                     - Clear comparisons between alternatives.
                     - Documented consequences for anti-patterns.
                
                2. **Anti-Vagueness Rules**:
                   BANNED PHRASES:
                   - "Consider...", "Think about...", "It's important to..."
                   - "Various scenarios", "Different situations", "Many cases"
                   - "Guide choices", "Affect performance", "Impact results"
                
                   Good example:
                   - "When <condition>, use <pattern> because <reason>"
                
                   Bad example:
                   - "Pattern used in various scenarios"
                
                3. **Mandatory Elements** (each flashcard must include all):
                   - Technical term in **bold** as the first line in the definition.
                   - A code example showing a minimum working pattern.
                   - An anti-pattern with a specific error example.
                   - A performance characteristic (e.g., O(n) complexity, or "40% latency increase in benchmark").
                
                4. **General Rules**:
                   - **Structure**: Each concept must be an object with:
                     - `"concept"`: Short name (e.g., "Multi-stage Builds")
                     - `"category"`: One of [Syntax/APIs, Architectural Components, Patterns/Anti-Patterns, Ecosystem Tools, Security/Debugging]
                     - `"definition"`: Concise explanation with <u>key terms</u> underlined using HTML. Expand only when necessary for clarity.
                     - `"example"`: Code/config snippet or scenario demonstrating usage.
                     - `"anti_pattern"`: Common mistake to avoid (if applicable).
                
                   - **Prioritization**:
                     - Focus on concepts addressing the user’s knowledge gaps first.
                     - Include foundational concepts before advanced topics (e.g., “Containers vs. Images” before “Orchestration”).
                
                   - **Memorization Hooks**:
                     - Highlight syntax differences (e.g., CLI flags `-v` vs `--volume`).
                     - Provide contrast pairs (e.g., "Bind Mounts ↔ Volumes").
                     - Offer pattern recognition cues (e.g., "All Docker Compose services share network by default").
                
                   - **Cognitive Optimization**:
                     - **Chunking**: Split complex concepts into separate atomic flashcards.
                     - **Dual Coding**: Combine technical terms with concrete analogies (e.g., “Namespaces – Process isolation 'sandboxes'”).
                     - **Interleaving**: Mix categories to avoid monotony.
                     - **Von Restorff Effect**: Highlight unusual or special syntax (e.g., `--security-opt seccomp=unconfined`).
                
                5. **Validation Rules**:
                   - Every tool-related concept must reference its primary category or component.
                   - Security concepts require explicit anti-pattern consequences.
                   - Syntax cards must show one correct and one incorrect variation.
                   - Architectural components should include a real-world analogy and mention “diagram” or “diagram keywords”.
                
                6. **Example Output** (Ensure your output follows EXACTLY this JSON structure — an array of objects):
                ```json
                [
                  {{
                    "concept": "Mutex Contention",
                    "category": "Patterns/Anti-Patterns",
                    "definition": "<u>Lock competition</u> occurs when multiple goroutines <u>simultaneously request</u> a mutex lock, creating bottlenecks",
                    "example": "var mu sync.Mutex;\ngo func() {{\n  mu.Lock()\n  defer mu.Unlock()\n  // Critical section\n}}()",
                    "anti_pattern": "Using mutex for high-frequency atomic ops:\nmu.Lock()\ncounter++\nmu.Unlock() → Use atomic.AddInt64() instead"
                  }},
                  {{
                    "concept": "Multi-stage Builds",
                    "category": "Patterns/Anti-Patterns",
                    "definition": "Reduces image size by separating <u>build environment</u> from <u>runtime environment</u>",
                    "example": "Dockerfile stages: FROM node:14 AS builder → FROM nginx:alpine COPY --from=builder ...",
                    "anti_pattern": "Including build tools in final production images"
                  }},
                  {{
                    "concept": "Volumes",
                    "category": "Architectural Components",
                    "definition": "<u>Persistent storage</u> that survives container lifecycle, unlike ephemeral <u>writable layer</u>",
                    "example": "docker run -v my_volume:/app/data",
                    "anti_pattern": "Storing database files in container writable layer"
                  }}
                ]
                Remember:
                    Reject any card missing:
                        At least one language-specific keyword (e.g., sync.Mutex).
                        A quantifiable consequence (e.g., “40% latency increase in benchmark”).
                        A concrete comparison (e.g., “Channels vs. mutexes for 1000+ goroutines”).
                    Avoid all banned phrases and remain specific in your explanations.
                    """,
        )
        self.chain = self.knowledge_identification_prompt | self.llm

    def analyze(self, state: SupervisorAgentState) -> SupervisorAgentState:
        knowledge_gaps = state.get("knowledge_gaps", "")
        if not knowledge_gaps:
            state["flashcard_agent"] = False
            state["web_search_agent"] = False
            return state

        response = self.chain.invoke({"knowledge_gaps": knowledge_gaps})
        concepts = parse_concepts(response)
        state["flashcard_agent"] = len(concepts) > 0
        state["web_search_agent"] = should_trigger_web_search(concepts)
        state["identified_concepts"] = [c.model_dump() for c in concepts]
        return state


def parse_concepts(response: Union[dict, KeyConceptsOutput]) -> List[ConceptSchema]:
    if isinstance(response, KeyConceptsOutput):
        return response.key_concepts
    try:
        return KeyConceptsOutput.model_validate(response).key_concepts
    except ValidationError as e:
        raise ValueError(f"Invalid response format: {e}")

    return parsed_response.key_concepts


def should_trigger_web_search(concepts: List[str]) -> bool:
    return False
