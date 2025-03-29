import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from server.core.otel import init_telemetry
from server.core.setup import lifespan_factory
from server.routers import auth, flashcards, chat, sse_router, documents, areas

## app = FastAPI(dependencies=[Depends(get_query_token)])
## figure out how to protect all data based on the user access

app = FastAPI(lifespan=lifespan_factory(create_tables_on_start=True))

init_telemetry(app)


# CORS settings
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:8080",
    "http://localhost:4317",
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