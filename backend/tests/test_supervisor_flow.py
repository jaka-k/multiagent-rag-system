import json
from unittest.mock import AsyncMock, MagicMock

import pytest
from langchain_core.documents import Document

from server.service.supervisor_server_service import SupervisorServerService
from statemachine.dtos.flashcard_dto import FlashcardDTO

pytestmark = pytest.mark.anyio


@pytest.fixture
def anyio_backend():
    return "asyncio"


def _retrieved_doc():
    # Shape produced by retriever.retrieve_chapters: chapter-level, no `id`.
    return Document(
        page_content="chapter text",
        metadata={"chapter_id": "c-1", "chapter_tag": "book//1:1.1"},
    )


def _service(supervisor_result):
    svc = SupervisorServerService(MagicMock(), "sid", "qid")
    svc.supervisor_agent = MagicMock()
    svc.supervisor_agent.invoke = AsyncMock(return_value=supervisor_result)
    svc.process_doc_chunks = AsyncMock()
    svc.notify_doc_chunk_queue = AsyncMock()
    svc.process_flashcards = AsyncMock(return_value=["f-1"])
    svc.notify_flashcards_queue = AsyncMock()
    return svc


async def test_flashcards_created_from_retrieved_documents():
    cards = [FlashcardDTO(front="f", back="b", category="go")]
    svc = _service({"flashcards": cards})

    await svc.handle_supervisor_flow("question", "answer", [_retrieved_doc()])

    svc.supervisor_agent.invoke.assert_awaited_once()
    payload = svc.supervisor_agent.invoke.await_args.args[0]
    assert payload["question"] == "question"
    assert len(payload["documents"]) == 1
    svc.process_flashcards.assert_awaited_once_with(cards)
    svc.notify_flashcards_queue.assert_awaited_once_with(["f-1"])


async def test_documents_event_carries_chapter_ids():
    svc = SupervisorServerService(MagicMock(), "sid", "qid")
    svc.db_session = MagicMock(execute=AsyncMock(), commit=AsyncMock())

    await svc.notify_doc_chunk_queue([_retrieved_doc()])

    sent = svc.db_session.execute.await_args.args[1]["payload"]
    assert json.loads(sent)["data"] == ["c-1"]


async def test_supervisor_failure_does_not_propagate():
    svc = _service({})
    svc.supervisor_agent.invoke = AsyncMock(side_effect=RuntimeError("llm down"))

    await svc.handle_supervisor_flow("question", "answer", [_retrieved_doc()])

    svc.process_flashcards.assert_not_awaited()


async def test_supervisor_failure_does_not_propagate():
    svc = _service({})
    svc.supervisor_agent.invoke = AsyncMock(side_effect=RuntimeError("llm down"))

    await svc.handle_supervisor_flow("question", "answer", [_retrieved_doc()])

    svc.process_flashcards.assert_not_awaited()


async def test_doc_queue_failure_does_not_block_flashcards():
    cards = [FlashcardDTO(front="f", back="b", category="go")]
    svc = _service({"flashcards": cards})
    svc.process_doc_chunks = AsyncMock(side_effect=RuntimeError("db down"))

    await svc.handle_supervisor_flow("question", "answer", [_retrieved_doc()])

    svc.process_flashcards.assert_awaited_once_with(cards)
