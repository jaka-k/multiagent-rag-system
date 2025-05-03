import json
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from sqlalchemy.orm import selectinload
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from server.controller.chat_controller import ChatController
from server.core.logger import app_logger
from server.core.security import get_current_active_user
from server.db.database import get_session
from server.db.dtos.session_dto import SessionDTO
from server.models.session import Session, FlashcardQueue, ChapterQueue
from server.models.user import User
from server.service.supervisor_server_service import SupervisorServerService
from statemachine.dtos.chat_dto import ChatInputDTO, MetaDataDTO
from statemachine.services.chat_service import ChatService

router = APIRouter()


class SessionCreate(BaseModel):
    title: str
    area_id: uuid.UUID


@router.get("/me/chats", response_model=List[Session])
async def get_all_chats(
        db: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_active_user),
):
    stmt = select(Session).where(Session.user_id == current_user.id).order_by(Session.updated_at.desc())
    result = await db.execute(stmt)
    chats = result.scalars().all()

    return chats


@router.get("/chat/{chat_id}", response_model=SessionDTO)
async def chat_endpoint(
        chat_id: uuid.UUID,
        db: AsyncSession = Depends(get_session),
):
    result = await db.execute(
        select(Session)
        .options(selectinload(Session.messages))  # type: ignore
        .where(Session.id == chat_id)

    )
    chat_session = result.scalar_one_or_none()
    if not chat_session:
        raise HTTPException(status_code=404, detail="Chat history not found")

    return chat_session


@router.post("/create-chat", response_model=Session)
async def create_chat(
        request: SessionCreate,
        db: AsyncSession = Depends(get_session),
        current_user: User = Depends(get_current_active_user),
):
    body = request.model_dump()
    new_session = Session(
        user_id=current_user.id,
        title=body["title"],
        area_id=body["area_id"]
    )
    db.add(new_session)
    await db.flush()

    flashcard_queue = FlashcardQueue(session_id=new_session.id)
    chapter_queue = ChapterQueue(session_id=new_session.id)

    db.add_all([flashcard_queue, chapter_queue])

    await db.commit()
    await db.refresh(new_session)
    return new_session


@router.websocket("/ws/{chat_id}")
async def websocket_endpoint(
        websocket: WebSocket,
        chat_id: uuid.UUID,
        db: AsyncSession = Depends(get_session),
):
    stmt = select(Session).options(selectinload(Session.area)).where(Session.id == chat_id)
    result = await db.execute(stmt)
    chat = result.scalars().first()

    print("CHAT AREA LABEL", chat.area.label)

    # TODO: Error handling is non-existent, The service should be integrated inside the controller
    chat_service = ChatService(chat_id, chat.area.label, db)
    chat_controller = ChatController(chat_id, db)

    flashcard_queue = await chat_service.get_flashcard_queue()
    supervisor_service = SupervisorServerService(db, chat_id, flashcard_queue.id)

    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            chat_input = ChatInputDTO(user_input=data, thread_id=chat_id)

            await chat_controller.save_user_message(chat_input)

            response_generator = chat_service.handle_chat(chat_input)
            response_content_collector = ""

            context = []

            async for chat_output_dto in response_generator:
                async for content in chat_output_dto.stream_messages():
                    if isinstance(content, MetaDataDTO):
                        metadata_collector = content
                        await websocket.send_text(
                            json.dumps({"metadata": content.model_dump()})
                        )
                    elif isinstance(content, dict) and "result" in content:
                        message_text = content["result"]
                        response_content_collector += message_text
                        await websocket.send_text(json.dumps({"content": message_text}))
                    elif isinstance(content, dict) and "context" in content:
                        context = content["context"]
                        print(context)
                        ## TODO: SEND Context to document console

            await chat_controller.save_agent_message(response_content_collector)
            await chat_controller.update_session_metadata(metadata_collector)
            await supervisor_service.handle_supervisor_flow(chat_input, response_content_collector, context)

    except WebSocketDisconnect:
        app_logger.info("WebSocket connection was closed")
