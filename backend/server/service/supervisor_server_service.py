import json

from sqlalchemy import text
from sqlmodel.ext.asyncio.session import AsyncSession

from server.db.pubsub import FLASHCARDS_CHANNEL
from server.models.flashcard import Flashcard
from statemachine.agents.supervisor.supervisor import SupervisorAgent
from statemachine.dtos.flashcard_dto import FlashcardDTO


class SupervisorServerService:
    def __init__(self, db_session: AsyncSession, session_id: str, fqueue_id: str):
        self.db_session = db_session
        self.session_id = session_id
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
            await self.process_flashcards(result['flashcards'])
            await self.notify_flashcards_queue(result['flashcards'])

        pass

    async def process_flashcards(self, flashcards: list[FlashcardDTO]):
        for flashcard in flashcards:
            new_flashcard = Flashcard(anki_id=None, deck_id=None, front=flashcard.front, back=flashcard.back,
                                      queue_id=self.fqueue)
            self.db_session.add(new_flashcard)
            print(flashcard)
        await self.db_session.commit()

    async def notify_flashcards_queue(self, flashcards: list[FlashcardDTO]):
        flashcard_ids = list(map(lambda x: str(x.id), flashcards))

        payload = {
            "session_id": str(self.session_id),
            "event_type": "flashcard",
            "data": flashcard_ids
        }
        data = json.dumps(payload)

        stmt = text("SELECT pg_notify(:channel, :payload)")
        await self.db_session.execute(stmt, {"channel": FLASHCARDS_CHANNEL, "payload": data})
        await self.db_session.commit()
