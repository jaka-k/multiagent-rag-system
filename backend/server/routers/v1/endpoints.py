from fastapi import APIRouter

router = APIRouter()


@router.post("/endpoint")
async def chat():
    return {"message": "Welcome to the LangChain Chat API"}


