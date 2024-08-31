from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI
from pydantic import BaseModel

from server.db.session import init_db
from server.routers.v1 import chat, endpoints


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Initialize the database on startup."""

    await init_db()
    yield


app = FastAPI(lifespan=lifespan)

# Registering the routers
app.include_router(chat.router, prefix="/api/v1")
app.include_router(endpoints.router, prefix="/api/v1")


class HealthCheck(BaseModel):
    """Model for health check response."""

    status: str = "200"


@app.get("/")
def get_health() -> HealthCheck:
    """
    Perform a health check.
    Returns:
        HealthCheck: JSON response with the status.
    """

    return HealthCheck(status="200")
