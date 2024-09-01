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

            # Step 2: Create a ChatInputDTO object
            chat_input = ChatInputDTO(user_input=data, thread_id=chat_id)

            # Step 3: Process the input through the ChatService
            responses = chat_service.handle_chat(chat_input)

            # Step 4: Stream the responses back to the WebSocket client
            for response in responses:
                # Directly send each response in the stream
                await websocket.send_text(
                    str(response.response)
                )  # Assuming response is a simple data structure
                # Use ChatoutputDTO
                await websocket.send_text(
                    "----"
                )  # Optional separator, as used in the console

    except WebSocketDisconnect:
        print("Client disconnected")
