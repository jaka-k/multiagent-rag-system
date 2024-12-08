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
        Examine the transcript of the user’s exchange with the system, along with any additional context from retrieved documents. 
        Identify the key concepts, ideas, or topics that the user has not fully mastered or finds confusing. For each concept, 
        provide details about it's relevance, how it connects to the user’s question, and what sub-topics the user should review.
        
        ###
        
        {question}
        
        ###
        
        {llm_response}
        
        """)
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
        documents = "\n".join(state.get("documents", []))

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
