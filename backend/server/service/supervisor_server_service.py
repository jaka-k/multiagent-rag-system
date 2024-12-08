from sqlmodel.ext.asyncio.session import AsyncSession

from server.models.flashcard import Flashcard
from statemachine.agents.supervisor.supervisor import SupervisorAgent
from statemachine.dtos.flashcard_dto import FlashcardDTO


class SupervisorServerService:
    def __init__(self, db_session: AsyncSession, fqueue_id: str):
        self.db_session = db_session
        self.fqueue = fqueue_id
        self._initialize_supervisor_agent()

    def _initialize_supervisor_agent(self):
        # Initialize your supervisor agent here using langgraph's StateGraph
        # You might need to set up the agents, tools, and state transitions
        # also retrieve all info from the DB
        # I might use this db session here to pass the summary reports
        self.supervisor_agent = SupervisorAgent()
        pass

    async def handle_supervisor_flow(self, question: str, response: str, context: list):
        # Pass the response and context to the supervisor agent
        # and execute the state graph
        result = await self.supervisor_agent.invoke({
            "question": question,
            "llm_response": response,
            "documents": context
        })

        print(result)

        if len(result['flashcards']) > 0:
            process_flashcards(result['flashcards'])

        pass


def process_flashcards(self, flashcards: list[FlashcardDTO]):
    for flashcard in flashcards:
        new_flashcard = Flashcard(front=flashcard.front, back=flashcard.back, queue_id=self.fqueue)
        self.db_session.add(new_flashcard)
        print(flashcard)
    self.db_session.commit()