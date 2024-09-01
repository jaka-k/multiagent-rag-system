from fastapi import APIRouter

router = APIRouter()


@router.post("/endpoint")
async def chat():
    return {"message": "Welcome to the LangChain Chat API"}


@router.get("/flashcard/{flashcard_id}")
async def flashcard(flashcard_id: int):
    return {"message": "This will create a flashcard in your deck", "id": flashcard_id}
