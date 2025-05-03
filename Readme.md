This tool was originally created to explore AI-driven learning workflows.  
Read the full story and motivations in my [blog post](https://…).

Architecture:
Detailed architecture section with package/module breakdown and dependency graph.

The wish to make it modular... etc
Using Poetry with packages in order to decouple the llm code from the api endpoints as much as possible. So it would be
potentially easier to replace the framework or even language. The decoupling is one of the main arch guidelines and
challenges of this project.
Working with multiple packages in the backend is also a great sand box for my tinkering when learning about systems
design in general. The modern stack is often laveraged with so many standalone pieces it’s a marvel of enginnering and i
want to delve into that as well so this was kind of the entry point.
The tech stack choice:

## Architecture & Tech Stack

- **LangGraph**: Multi-agent state machine orchestrator
- **Server**: Python 3.10+, FastAPI, Pydantic for validation
- **Frontend**: Next.js with Server Actions & SSE
- **Database**: PostgreSQL + Chroma vector DB + Firebase Bucket
- **Deployment**: Docker Compose, Poetry

## Installation guide

As of now the app is only available in local development mode. Deployment to a VPS is one of the next items on the
roadmap.
The easiest way to get it running is to use the compose file at the root.

### Local development

While the services from the compose file are running (postgres, chroma, observability tools)

navigate to backend folder and run

```bash
poetry run fastapi dev server/main.py --port 8080
```

navigate to frontend folder and run

```bash
pnpm dev
```

.env.example

## Epub Parser

In-depth: EpubProcessingService, BeautifulSoup usage, TOC parsing, DB model creation.

### Overview

A dedicated `EpubProcessingService` decouples parsing from API logic. It:

1. Finds the EPUB’s TOC file
2. Breaks content into sub-chapters
3. Persists chapters in Postgres (`Chapter` model)
4. Queues each chapter for embedding

**Libraries used**:

- `beautifulsoup4` for HTML traversal
- Python’s built-in `zipfile` to extract EPUB contents

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

