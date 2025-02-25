from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langgraph.constants import START, END
from langgraph.graph import StateGraph

from statemachine.agents.analysis.knowledge_identification_agent import KnowledgeIdentificationAgent
from statemachine.agents.analysis.summarizer_agent import SummarizerAgent
from statemachine.agents.flashcards.flashcard_agent import FlashcardAgent
from statemachine.agents.supervisor.supervisor_state import SupervisorAgentState
from statemachine.agents.web_search.web_search_agent import WebSearchAgent


class SupervisorAgent:
    def __init__(self):
        self.state = SupervisorAgentState
        self.knowledge_agent = KnowledgeIdentificationAgent()
        self.flashcard_agent = FlashcardAgent()
        self.web_search_agent = WebSearchAgent()
        self.summarizer_agent = SummarizerAgent()

        self.supervisor_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
        self.knowledge_gaps_prompt = PromptTemplate.from_template(template="""
            Examine the transcript of the user's exchange with the system (and any relevant documents) to identify the **key technical concepts** the user has not fully mastered. This information will be used later by a separate flashcard-creation process which follows strict guidelines. Therefore:
            
            1. **Reference Points**:
               - We have “Strict Flashcard Creation Rules” in the next step. They demand that flashcards use:
                 - **Specific technical terms** (no vague titles like “Performance”).
                 - **Exact syntax examples** for code or commands.
                 - **Quantifiable or measurable details** about outcomes.
                 - **Comparisons** between related concepts or approaches.
                 - **Documented anti-patterns** with specific consequences.
               - Your job: **Do not** create flashcards now. Instead, pinpoint the user’s knowledge gaps so the next step can build flashcards properly.
            
            2. **Incorporate Both ### QUESTION and ### LLM RESPONSE**:
               - **### QUESTION**: The user’s direct inquiry, which may reveal confusion about certain topics.
               - **### LLM RESPONSE**: The large language model’s answer, often containing details or subtopics that might indicate areas the user doesn’t fully grasp.
            
            3. **Output Requirements**:
               - For each distinct knowledge gap, produce:
                 - A **short, explicit concept name** (e.g., “Mutex Contention”).
                 - A brief note on **relevance** to the user’s question or context.
                 - Any **sub-topics** or related terms the user should investigate.
                 - If you cite a performance or usage outcome, be **quantifiable** (e.g., “Causes a 30% increase in memory usage”).
                 - If referencing syntax, provide a **minimal snippet** or an **accurate command** (without placeholders).
            
            4. **Banned Phrases**:
               - "Consider...", "Think about...", "It's important to..."
               - "Various scenarios", "Different situations", "Many cases"
               - "Guide choices", "Affect performance", "Impact results"
            
            5. **Precision**:
               - Write in **clear, direct** sentences, avoiding any vague or hand-waving language.
               - Provide specific reasons or details for each knowledge gap rather than generic statements.
            
            Your response should be a **concise summary** of the user’s knowledge gaps, referencing insights from ### QUESTION and ### LLM RESPONSE but **without** generating flashcards. Retain clarity and detail so the next agent can produce flashcards aligned with the Strict Flashcard Creation Rules.
            
            ### QUESTION
            {question}
            
            ### LLM RESPONSE
            {llm_response}
            """
                                                                  )
        self.knowledge_gaps_chain = self.knowledge_gaps_prompt | self.supervisor_llm | StrOutputParser()

        # TODO: add logging
        # logging.getLogger(self.name)

        builder = StateGraph(self.state)

        builder.add_edge(START, "supervisor")
        builder.add_node("supervisor", self.supervisor_node)
        builder.add_node("knowledge_analysis", self.knowledge_agent.analyze)
        builder.add_node("flashcard", self.flashcard_agent.invoke)
        builder.add_node("web_search", self.web_search_agent.invoke)
        builder.add_node("summarizer", self.summarizer_agent.invoke)

        builder.add_edge("supervisor", "knowledge_analysis")

        builder.add_conditional_edges(
            "knowledge_analysis",
            lambda state: determine_next_nodes(state),
            then="summarizer"
        )

        builder.add_edge("summarizer", END)

        self.graph = builder.compile()

    async def invoke(self, load: dict) -> SupervisorAgentState:
        self.state = SupervisorAgentState(
            question=load.get("question", ""),
            llm_response=load.get("llm_response", ""),
            knowledge_gaps="",
            flashcard_agent=False,
            web_search_agent=False,
            documents=load.get("documents", [])
        )

        return await self.graph.ainvoke(self.state)

    def supervisor_node(self, state: SupervisorAgentState) -> dict:
        question = state.get("question", "")
        llm_response = state.get("llm_response", "")
        documents = state.get("documents", [])

        state["knowledge_gaps"] = self.knowledge_gaps_chain.invoke({
            "question": question,
            "llm_response": llm_response,
            "documents": documents
        })

        return state


def determine_next_nodes(state: SupervisorAgentState):
    next_nodes = []
    if state.get("flashcard_agent", False):
        next_nodes.append("flashcard")
    if state.get("web_search_agent", False):
        next_nodes.append("web_search")
    return next_nodes if next_nodes else []
