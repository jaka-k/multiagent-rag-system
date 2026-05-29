import uuid

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from server.core.exceptions import AppError
from server.core.logger import app_logger
from server.core.otel import init_telemetry
from server.core.setup import lifespan_factory
from server.routers import auth, flashcards, chat, sse_router, documents, areas

app = FastAPI(lifespan=lifespan_factory(create_tables_on_start=True))

init_telemetry(app)


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    """Surface typed pipeline errors as 500s with a correlatable error_id and step."""
    error_id = str(uuid.uuid4())
    app_logger.error(
        f"{exc.step} failed",
        exc_info=exc,
        extra={
            "error_id": error_id,
            "step": exc.step,
            "error_type": type(exc).__name__,
            "path": request.url.path,
            "method": request.method,
        },
    )
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc) or "Internal server error", "error_id": error_id, "step": exc.step},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Last-resort handler: anything that escaped a typed AppError still produces
    one structured log line and a 500 with a correlatable error_id."""
    error_id = str(uuid.uuid4())
    app_logger.error(
        "Unhandled exception",
        exc_info=exc,
        extra={
            "error_id": error_id,
            "step": "unhandled",
            "error_type": type(exc).__name__,
            "path": request.url.path,
            "method": request.method,
        },
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error_id": error_id},
    )

# CORS settings
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:3001",
    "https://mrag.krajnc.cc",
    "https://api.mrag.krajnc.cc",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api")
app.include_router(flashcards.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(areas.router, prefix="/api")
app.include_router(sse_router.router, prefix="/api")

app.include_router(auth.router, prefix="/auth")


class HealthCheck(BaseModel):
    status: str = "200"


@app.get("/ready")
def get_health() -> HealthCheck:
    """Perform a health check."""
    return HealthCheck(status="200")

if __name__ == "__main__":
    uvicorn.run("main:app", reload=True)