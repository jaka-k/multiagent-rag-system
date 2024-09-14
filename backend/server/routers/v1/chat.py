import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from statemachine.dtos.chat_dto import ChatInputDTO, ChatOutputDTO
from statemachine.services.chat_service import ChatService


router = APIRouter()
chat_service = ChatService()


@router.websocket("/ws/{chat_id}")
async def websocket_endpoint(websocket: WebSocket, chat_id: str):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            chat_input = ChatInputDTO(user_input=data, thread_id=chat_id)

            response_generator = chat_service.handle_chat(chat_input)

            for chat_output_dto in response_generator:

                for content in chat_output_dto.stream_messages():
                    if isinstance(content, dict):
                        # This is the metadata
                        await websocket.send_text(json.dumps({"metadata": content}))
                    else:
                        # This is a message content
                        await websocket.send_text(json.dumps({"content": content}))

    except WebSocketDisconnect:
        print("Client disconnected")
