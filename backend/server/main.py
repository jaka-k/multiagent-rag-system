from fastapi import FastAPI
from pydantic import BaseModel
from server.routers.v1 import chat, endpoints

app = FastAPI()

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