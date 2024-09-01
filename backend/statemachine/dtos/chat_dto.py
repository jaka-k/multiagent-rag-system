from typing import Dict, Any
from pydantic import BaseModel

class ChatInputDTO(BaseModel):
    user_input: str
    thread_id: str

class ChatOutputDTO(BaseModel):
    response: Dict[str, Any]