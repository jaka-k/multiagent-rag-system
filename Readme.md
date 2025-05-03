This tool was originally created to explore AI-driven learning workflows.  
Read the full story and motivations in my [blog post](https://…).

The project has a modular structure with a Next.js frontend and a Python backend split across multiple packages using
Poetry. LLM logic is decoupled from the API layer to potentially make it easier to swap out frameworks or languages.
This
decoupling is one of the core architectural goals—and challenges. The setup also serves as a sandbox for experimenting
with systems design and working with a modern, service-oriented stack.

## Architecture & Tech Stack

- **LangGraph** – Multi-agent state machine orchestrator for LLM workflows
- **Server** – Python 3.10+, FastAPI, Pydantic, structured as multiple Poetry-managed packages
- **Frontend** – Next.js App Router with Server Actions and Server-Sent Events
- **Databases** – PostgreSQL for structured data, Chroma for embeddings, Firebase for blob storage
- **Deployment** – Docker Compose for local orchestration

---

## Installation

As of now, the app is intended for local development. VPS deployment is on the roadmap.

### Local Setup with Docker

To get everything running, make sure your `.env` files are correctly configured (see `.env.example`), then simply run:

```bash
docker-compose up
```

### Local Development

To run the frontend and backend manually (e.g., with hot reload during development), use the following:

**Backend:**

```bash
cd backend
poetry run fastapi dev server/main.py --port 8080
```

**Frontend:**

```bash
cd frontend
pnpm dev
```

*Make sure the Docker services (Postgres, Chroma, etc.) are still running in the background via Compose.*

---

## Epub Parser

The parser is tested with books from the 3 main publishers in the tech publishing space. O'Reilly media,
Manning shelter Island and Packt Publishing (Conditionally also tested with No Starch Press)

A dedicated [`EpubProcessingService`](backend/server/service/embedding/epub_processing_service.py) decouples parsing
from API logic. Located in the [tools Poetry package](backend/tools), the parser traverses the epub file and extracts
the raw html data, then it parses  the html to plain text in order to prepare them for the vector embedding.

1. Finds the EPUB’s TOC file
2. Breaks content into sub-chapters
3. Persists chapters in Postgres ([`Chapter`](backend/server/models/document.py) model)
4. Queues each chapter for embedding

**Libraries used**:

- `beautifulsoup4` for HTML traversal
- Python’s built-in `zipfile` to extract EPUB contents

a
a
a
a
a
a
a

## Embedding Pipeline (RAG Preprocessing)

1. **Why EPUB?** PDFs proved too inconsistent; EPUB is HTML under the hood.
2. **EmbeddingService**:
    - Sanitizes chapter text
    - Generates vectors in Chroma DB
    - Experiments with metadata weighting (e.g. title tokens boosted for better retrieval)
3. **Scope**: Initially for Go resources, now supports any tech-book publisher (No Starch, O’Reilly, etc.)

---
Step-by-step: EmbeddingService, vector DB details, metadata weighting experiment.

## Server

Authorization
Using the OAuth 2 setup from the official fastapi docs.
The auth routes [security.py](backend/server/core/security.py)

## Statemachine Package

A self-contained Poetry package `statemachine` that implements multi-agent workflows as a state machine using LangGraph.

### Design Principles

- **Graph as State Machine**  
  Each agent node = a state; connections = transitions.
- **Separation of Concerns**  
  Keeps decision logic (agent orchestration, flashcard creation, knowledge gap analysis) isolated from external
  services (DB, HTTP, SSE).

### Key Modules

- **GraphBuilder**  
  Constructs the directed graph from a config of agents and transitions.
- **StateExecutor**  
  Traverses the graph, invoking agent logic and handling transition conditions.
- **Agent Interfaces**  
  Abstract base classes for custom agents (e.g. `GapAnalyzerAgent`, `FlashcardAgent`).

---

## Chat & Streaming

Handles real-time interaction between LangGraph and the Next.js frontend via WebSockets.

1. **ChatService**
    - Wraps LLM calls with `get_openai_callback()` for telemetry and usage monitoring.
    - Converts agent outputs into `ChatOutputStreamDTO`, including token usage and timing.

2. **WebSocket Endpoint** (`/ws/{chat_id}`)
    - Streams LLM response chunks as they arrive.
    - Emits JSON messages containing `{ text: string, metadata: { tokens: number, time_ms: number } }`.

3. **Frontend Integration**
    - Next.js listens on the WebSocket, appends chunks to the chat window, and displays a live token counter.

---

### Observability

