import json
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from sqlalchemy.orm import selectinload
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from server.controller.chat_controller import ChatController
from server.core.exceptions import AppError
from server.core.logger import app_logger
from server.core.security import get_current_active_user
from server.core.ws_protocol import WsEvent, ws_frame
from server.service.ws_manager import ws_manager
from server.db.database import get_session
from server.db.dtos.session_dto import SessionDTO
from server.models.session import Session, FlashcardQueue, ChapterQueue, Message
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
    await websocket.accept()

    stmt = select(Session).options(selectinload(Session.area)).where(Session.id == chat_id)
    result = await db.execute(stmt)
    chat = result.scalars().first()

    if not chat:
        await websocket.close(code=1008, reason="Chat session not found")
        return

    chat_service = ChatService(chat_id, chat.area.label, db)
    chat_controller = ChatController(chat_id, db)

    flashcard_queue = await chat_service.get_flashcard_queue()
    supervisor_service = SupervisorServerService(db, chat_id, flashcard_queue.id)
    await ws_manager.register(chat_id, websocket)
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
                        await ws_manager.broadcast(
                            chat_id, ws_frame(WsEvent.METADATA, content.model_dump())
                        )
                    elif isinstance(content, dict) and "result" in content:
                        message_text = content["result"]
                        response_content_collector += message_text
                        await ws_manager.broadcast(
                            chat_id, ws_frame(WsEvent.CONTENT, message_text)
                        )
                    elif isinstance(content, dict) and "context" in content:
                        context = content["context"]
                        await ws_manager.broadcast(chat_id, ws_frame(WsEvent.CONTEXT, [
                            {k: doc.metadata.get(k) for k in
                             ("chapter_id", "chapter_tag", "chapter", "subchapter", "title", "rerank_score")}
                            for doc in context
                        ]))

            agent_message = await chat_controller.save_agent_message(response_content_collector)
            await chat_controller.save_retrievals(agent_message.id, context)
            await chat_controller.update_session_metadata(metadata_collector)
            await supervisor_service.handle_supervisor_flow(chat_input, response_content_collector, context)

    except WebSocketDisconnect:
        app_logger.info(
            "WebSocket connection was closed",
            extra={"chat_id": str(chat_id)},
        )
        await ws_manager.unregister(chat_id, websocket)
    except AppError as exc:
        error_id = str(uuid.uuid4())
        app_logger.error(
            f"{exc.step} failed in chat WebSocket",
            exc_info=exc,
            extra={
                "error_id": error_id,
                "step": exc.step,
                "code": exc.code,
                "error_type": type(exc).__name__,
                "chat_id": str(chat_id),
            },
        )
        await _send_ws_error(
            chat_id, websocket, error_id, exc.step, str(exc) or "Pipeline error", code=exc.code
        )
    except Exception as exc:
        error_id = str(uuid.uuid4())
        app_logger.error(
            "Unhandled exception in chat WebSocket",
            exc_info=exc,
            extra={
                "error_id": error_id,
                "step": "chat.websocket",
                "error_type": type(exc).__name__,
                "chat_id": str(chat_id),
            },
        )
        await _send_ws_error(chat_id, websocket, error_id, "chat.websocket", "Internal server error")


async def _send_ws_error(
    chat_id: uuid.UUID, websocket: WebSocket, error_id: str, step: str, detail: str, code: int = 50000
) -> None:
    """Broadcast a structured error frame to every session listener, then close
    the socket whose turn failed (1011), tolerating an already-closed socket."""
    try:
        await ws_manager.broadcast(
            chat_id,
            ws_frame(WsEvent.ERROR, {"detail": detail, "error_id": error_id, "step": step, "code": code}),
        )
    except Exception:
        pass
    await ws_manager.unregister(chat_id, websocket)
    try:
        await websocket.close(code=1011, reason="Internal error")
    except Exception:
        pass


@router.get("/chat/{chat_id}/retrievals")
async def get_chat_retrievals(
        chat_id: str,
        db: AsyncSession = Depends(get_session),
):
    """Retrieved chapters per agent message, newest message first."""
    from server.models.document import Chapter
    from server.models.retrieval import MessageRetrieval

    rows = (await db.execute(
        select(Message, MessageRetrieval, Chapter)
        .join(MessageRetrieval, MessageRetrieval.message_id == Message.id)
        .join(Chapter, Chapter.id == MessageRetrieval.chapter_id)
        .where(Message.session_id == chat_id)
        .order_by(Message.created_at.desc(), MessageRetrieval.rank.asc())
    )).all()

    grouped: dict = {}
    for message, retrieval, chapter in rows:
        entry = grouped.setdefault(str(message.id), {
            "message_id": str(message.id),
            "created_at": message.created_at,
            "chapters": [],
        })
        entry["chapters"].append({
            "chapter_id": str(chapter.id),
            "chapter_tag": chapter.chapter_tag,
            "chapter": chapter.parent_label,
            "subchapter": chapter.label,
            "relevance_score": retrieval.relevance_score,
            "rank": retrieval.rank,
        })
    return list(grouped.values())
