import json

## TODO: Should use DocChunk not langchain types
from langchain_core.documents import Document
from sqlalchemy import text
from sqlmodel.ext.asyncio.session import AsyncSession

from server.db.pubsub import SSE_NOTIFY_CHANNEL
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
        self.supervisor_agent = SupervisorAgent()

        pass

    async def handle_supervisor_flow(self, question: str, response: str, retriever_context: list):

        if len(retriever_context.get('context', [])) > 0:
            await self.notify_doc_chunk_queue(retriever_context['context'])

        result = await self.supervisor_agent.invoke({
            "question": question,
            "llm_response": response,
            "documents": retriever_context.get('context', [])
        })

        if len(result.get('flashcards', [])) > 0:
            new_flashcard_ids = await self.process_flashcards(result['flashcards'])
            await self.notify_flashcards_queue(new_flashcard_ids)

        pass

    async def process_flashcards(self, flashcards: list[FlashcardDTO]) -> list[str]:
        flashcard_ids = []
        for flashcard in flashcards:
            new_flashcard = Flashcard(anki_id=None, deck_id=None, front=flashcard.front, back=flashcard.back,
                                      queue_id=self.fqueue)
            self.db_session.add(new_flashcard)
            flashcard_ids.append(str(new_flashcard.id))
        await self.db_session.commit()
        return flashcard_ids

    async def notify_doc_chunk_queue(self, documents: list[Document]):
        doc_chunks_ids = list(map(lambda x: str(x.metadata["id"]), documents))
        print("Documents", documents)
        print("doc_chunks_ids = list(map(lambda x: str(x.metadata.id), documents))", doc_chunks_ids)

        payload = {
            "session_id": str(self.session_id),
            "event_type": "documents",
            "data": doc_chunks_ids
        }
        data = json.dumps(payload)

        stmt = text("SELECT pg_notify(:channel, :payload)")
        await self.db_session.execute(stmt, {"channel": SSE_NOTIFY_CHANNEL, "payload": data})
        await self.db_session.commit()

    async def notify_flashcards_queue(self, flashcard_ids: list[str]):
        payload = {
            "session_id": str(self.session_id),
            "event_type": "flashcard",
            "data": flashcard_ids
        }
        data = json.dumps(payload)

        stmt = text("SELECT pg_notify(:channel, :payload)")
        await self.db_session.execute(stmt, {"channel": SSE_NOTIFY_CHANNEL, "payload": data})
        await self.db_session.commit()
