from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from server.anki.sse_connection import (
    flashcard_event_generator,
    get_queue_by_name,
)
from statemachine.embeddings.model import populate

router = APIRouter()


@router.get("/flashcards-sse/{chat_id}")
async def sse_endpoint(chat_id: str):
    print("/flashcards-sse/{chat_id} ESTABLISHED")
    queue = get_queue_by_name(chat_id)
    return StreamingResponse(
        flashcard_event_generator(queue),
        media_type="text/event-stream",
        headers={
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@router.post("/create-flashcard/{chat_id}")
async def create_flashcard(chat_id: str):
    queue = get_queue_by_name(chat_id)
    flashcard = {
        "id": "12345",
        "front": "What is FastAPI?",
        "back": "FastAPI is a modern web framework for building APIs with Python.",
    }
    await queue.put(flashcard)
    return {"message": "Flashcard created and sent to client."}


@router.get("/flashcard/{flashcard_id}")
async def flashcard(flashcard_id: int):
    return {"message": "This will create a flashcard in your deck", "id": flashcard_id}


@router.get("/epub/1")
async def populate1():
    placeholderPath = "/app/tools/epub_parser/data/mastering-go.epub"
    populate(placeholderPath)
    return {"message": "This will create a flashcard in your deck", "id": 1}


@router.get("/epub/2")
async def populate2():
    placeholderPath = "/app/tools/epub_parser/data/go-cookbook.epub"
    populate(placeholderPath)
    return {"message": "This will create a flashcard in your deck", "id": 1}
