from langgraph.constants import START, END
from langgraph.graph import StateGraph

from statemachine.agents.flashcards.flashcard_agents import FlashcardAgent
from statemachine.agents.summarizer.summarizer_agent import SummarizerAgent
from statemachine.agents.supervisor.supervisor_state import SupervisorAgentState
from statemachine.agents.web_search.web_search_agent import WebSearchAgent


class SupervisorAgent:
    def __init__(self):
        """
        Initialize the SupervisorAgent and set up the state graph with conditional branching.
        """
        self.state = SupervisorAgentState
        self.flashcard_agent = FlashcardAgent()
        self.web_search_agent = WebSearchAgent()
        self.summarizer_agent = SummarizerAgent()

        # TODO: add logging
        # logging.getLogger(self.name)

        builder = StateGraph(self.state)

        builder.add_edge(START, "supervisor")
        builder.add_node("supervisor", self.supervisor_node)
        builder.add_node("flashcard", self.flashcard_agent.invoke)
        builder.add_node("web_search", self.web_search_agent.invoke)
        builder.add_node("summarizer", self.summarizer_agent.invoke)

        ## https://langchain-ai.github.io/langgraph/how-tos/branching/

        builder.add_conditional_edges(
            "supervisor",
            lambda state: self.determine_next_nodes(),
            then="summarizer"  # after these branches, go to summarizer
        )

        builder.add_edge("summarizer", END)

        self.graph = builder.compile()

    def supervisor_node(self) -> dict:
        """
        The supervisor node. This is where you run your supervisor prompt logic.
        You might run a prompt here that determines what to do:

        For example, after running a prompt with a language model:
        state["web_search"] = True/False
        state["flashcard"] = True/False

        Additionally, you might store the chosen next step in state["next"] if desired,
        but here we rely on `determine_next_nodes`.
        """
        # Pseudocode for running your supervisor prompt:
        # response = run_supervisor_prompt(state)
        # state["web_search"] = response.get("use_web_search", False)
        # state["flashcard"] = response.get("create_flashcards", False)

        # Ensure defaults if not set:

        self.state.setdefault("web_search_agent", False)
        self.state.setdefault("flashcard_agent", False)

        return self.state


    def determine_next_nodes(self):
        """
        Determine which nodes to run next based on state booleans.
        If both are True, return ["flashcard", "web_search"] or ["web_search", "flashcard"]
        depending on desired order. If one is True, return that single node.
        If none is True, return an empty list which will send us directly to summarizer.

        According to the docs for branching, we can return:
        - A single node name (string)
        - A list of node names in the order we want them to run
        - An empty list or None if we want to skip directly to the `then` node (summarizer)
        """
        next_nodes = []
        if self.state.get("flashcard", False):
            next_nodes.append("flashcard")
        if self.state.get("web_search", False):
            next_nodes.append("web_search")

        # If no nodes selected, return empty to skip to summarizer
        return next_nodes if next_nodes else []


    async def invoke(self, load: dict):
        """
        Invoke the state graph with the given load.

        :param load: A dictionary representing the state to be processed.
        """
        return await self.graph.invoke(load)
