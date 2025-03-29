import json

## TODO: Should use DocChunk not langchain types
from langchain_core.documents import Document
from sqlalchemy import text

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from server.core.logger import app_logger
from server.db.pubsub import SSE_NOTIFY_CHANNEL
from server.models.flashcard import Flashcard
from server.models.document import Chapter
from server.models.session import ChapterQueue
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
        documents = retriever_context.get('context', [])
        print("handle_supervisor_flow -> retriever_context: list", retriever_context)

        ## TODO: Catch all exceptions
        try:
            if len(documents) > 0:
                await self.notify_doc_chunk_queue(documents)
                await self.process_doc_chunks(documents)
        except Exception as e:
            app_logger.error(f"The thing broke: {e}")


        result = await self.supervisor_agent.invoke({
            "question": question,
            "llm_response": response,
            "documents": documents
        })

        if len(result.get('flashcards', [])) > 0:
            new_flashcard_ids = await self.process_flashcards(result['flashcards'])
            await self.notify_flashcards_queue(new_flashcard_ids)

        pass

    async def process_doc_chunks(self, documents: list[str]) -> None:
        stmt = select(ChapterQueue).where(ChapterQueue.session_id == self.session_id)
        result = await self.db_session.execute(stmt)
        queue = result.scalar_one_or_none()
        if not queue:
            app_logger.error("Cannot retrieve ChapterQueue for session %s", self.session_id)
            raise Exception("Cannot retrieve ChapterQueue")

        for doc_chunk in documents:
            stmt_ch = select(Chapter).where(Chapter.chapter_tag == doc_chunk.id)
            ch_result = await self.db_session.execute(stmt_ch)
            retrieved_chapter = ch_result.scalar_one_or_none()
            if not retrieved_chapter:
                app_logger.warning("Cannot retrieve Chapter for session %s", self.session_id)

            queue.chapters.append(retrieved_chapter)

        self.db_session.add(queue)
        await self.db_session.commit()


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
        doc_chunks_ids = list(map(lambda x: str(x.id), documents))
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
