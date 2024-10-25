from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from server.core.setup import lifespan_factory
from server.routers.v1 import chat, endpoints
from server.routers import auth

app = FastAPI(lifespan=lifespan_factory(create_tables_on_start=True))

# CORS settings
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/v1")
app.include_router(endpoints.router, prefix="/api/v1")

app.include_router(auth.router, prefix="/auth")


class HealthCheck(BaseModel):
    status: str = "200"


@app.get("/")
def get_health() -> HealthCheck:
    """Perform a health check."""
    return HealthCheck(status="200")
