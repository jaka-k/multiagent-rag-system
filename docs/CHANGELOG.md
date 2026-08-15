# Changelog — 2.0 rewrite

Everything upgraded, migrated, or replaced since **v1.0** — the last state
deployed to the VPS before the rewrite began. The 2.0 work starts with the
2026-03-28 commit burst (`b7b7eb6`, "move dev setup to make scripts") and is
explicitly marked by `c1a10a0` — *"fix: hold deployment to VPS while working
on 2.0"* (2026-03-29). v1.0 stays frozen in deployment until 2.0 ships.

Format: newest phase first. PR numbers link the work; unreleased items are
flagged.

---

## [Unreleased / in flight] — Redesign phase 2

- Planned (docs/rework/08): auth screens from the new design (login,
  PIN-gated beta registration — needs backend invite codes, terms),
  citations, GenBot, agents wired into generation, doc-05 leftover
  schema (structured card fields, clipper provenance), reader (doc 07).
- Gated on a working GOOGLE_API_KEY (last rotation rejected by Google).

## Phase 7 — Redesign wave (merged 2026-08-14, PRs #21–#28)

- **Chat-first app shell** (PR #21): mrag.css design system ported from the
  claude.ai/design MRAG project (Iris accent, charcoal shell); dark-frame
  shell with Rail (area switcher, book library, EPUB upload) + TopNav;
  ChatHome (hero launcher + day-grouped sessions) replaces the chat table;
  Flashcards tab (loose-cards band + per-session queues via new
  GET /api/area/{id}/flashcards); Agent Instructions tab backed by a new
  **per-area Agent model** + CRUD (replaces the per-session instruction
  string concept).
- **Conversation + sidebar redesign** (PR #22): thread/composer in design
  tokens; ChatSidebar (Chapters/Flashcards/Creator) replaces Console; new
  **MessageRetrieval** table persists per-answer retrieval results (backs
  the Chapters tab and future citations); WS error frames now render in
  the thread instead of hanging on "Thinking…".
- **Typed realtime protocols** (PR #22): WS frames are {type, payload}
  envelopes with a WsEvent enum mirrored Python/TS; SSE events get the
  same treatment (SseEvent enum); client logic consolidated in
  frontend/src/lib/sockets/; **SessionConnectionManager broadcasts every
  frame to all clients on a session** (multi-tab/device).
- **Review-state UI** (PR #22, doc 06 step 5): queue progress bars,
  mastered badges, live In-progress/Mastered filters fed by the
  AnkiCardState mirror. Verified with AnkiConnect answerCards-simulated
  reviews.
- **Fixes**: exporting a card to Anki no longer removes it from its
  session queue (export = sync, not move); ankisyncrun.latest_review_id
  widened to BIGINT (review ids are epoch-ms — first real review would
  have crashed the pull-sync); SSE connection regression from the Console
  replacement caught and fixed.
- Decisions locked 2026-08-14: queues stay 1:1 with sessions; agents are
  per-area; Iris accent + charcoal shell.
- **websockets 13 → 16.1** (doc 01 Tier 3): 17 capped by google-genai
  (<17); verified with a two-client broadcast roundtrip through uvicorn's
  websockets transport.
- **markdownify 0.14 → 1.2.3** (doc 01 Tier 3): verified on two real
  EPUBs — heading/code-fence chunk separators byte-identical; <dl> now
  renders as Markdown definition lists (improvement).
- **pgvector client bump: blocked upstream** — all langchain-postgres
  releases cap pgvector <0.4; 0.3.6 already maximal. Recheck with future
  langchain-postgres versions.
- **google-genai 1.75 → 2.18.1** (Gemini SDK major, transitive via
  langchain-google-genai): request path verified to the auth boundary
  (dead key 401s round-trip cleanly); happy-path re-smoke pending key
  rotation. Note: 2.18.1 still caps websockets <17, so #23's 16.1
  ceiling stands.
- **Review hardening (Copilot on #21)**: auth + area-ownership checks on
  the area-flashcards and all agent endpoints (401/404 verified live);
  agent.variables NOT NULL with [] default; DST-safe session day-grouping;
  stale-error reset on area switch; Space-key activation on agent cards.
- **Endpoint authorization sweep** (per the new CLAUDE.md rule): every
  data endpoint now derives identity from the token and verifies resource
  ownership (404 on foreign ids) — areas, chats, retrievals, flashcards,
  queues, documents, chapters, chapter-queues, anki sync. WebSocket and
  SSE authenticate via the httpOnly token cookie (WS closes 1008
  unauthenticated; SSE 401/404). Shared server/core/authz.py helpers.
  Also fixed a latent missing-raise on the area-documents ownership check.
- **Frontend composition refactor** (review feedback): views compose
  instead of implement — API access moved to lib/fetchers (fetch-agents,
  getAreaFlashcards), shared types to types.d.ts, time helpers to
  lib/utils; new reusable components (agents/agent-card+editor,
  chat-home/launcher+session-list, flashcards/area-flashcard-card+
  queue-card). View files roughly halved. Rule added to CLAUDE.md.
- Planned (doc 07, 2026-08-14): chapter HTML stored as a lazy 1:1 blob
  (base64-inlined images) for a real book reader; design requested from
  the MRAG design project.
- **Error handling centralized** (review feedback): new typed client
  errors (UnauthorizedError 40101, ResourceNotFoundError 40402,
  ConflictError 40901); all routers raise through the AppError hierarchy
  instead of ad-hoc HTTPExceptions — every error response now carries
  error_id/step/code. Rule added to CLAUDE.md.
- **WS Origin allowlist** (Copilot on #27): cross-site WebSocket
  hijacking defense — non-allowlisted Origins rejected at the handshake;
  also fixed a 500 on unknown area ids in the area-documents endpoint.
- Carried forward to phase 2: citations, GenBot, agents into generation,
  doc 01 leftovers (firebase-admin 7, tooling, docker-3.14 rebuild check,
  otel-collector handshake), dependabot triage (117 → 69 during this wave).

## Phase 6 — Platform wave (2026-08-08 → 08-09, PRs #14–#19)

- **Python 3.12/3.13 → 3.14.5 everywhere** (PR #14): pyproject `^3.14`,
  `.python-version`, both Dockerfiles; otel 1.29/0.50b0 → **1.44/0.65b0**;
  **protobuf 5 → 7**; grpcio 1.83, greenlet 3.5, numpy 2.5; httpcore
  1.0.9 (1.0.7 crashes on import under 3.14); yanked aiohttp → 3.14.3.
  Live-smoked: Gemini embedding + chat + Firebase Admin on protobuf 7.
- **Tier-1 minors + model aliases** (PR #15): fastapi 0.141, langchain 1.3,
  langgraph 1.2; `LLM_MODEL`/`LLM_FAST_MODEL` → `gemini-flash-latest` /
  `gemini-flash-lite-latest` (gemini-2.5-* retired for new keys; pro-class
  free-tier quota 0).
- **Anki layer rebuilt** (PR #16): stateless async httpx client, explicit
  deck creation, batched addNotes + one AnkiWeb sync per batch, non-fatal
  deck creation on area create (no more 500-after-commit), duplicate → 409.
- **Embedding export/import scripts** (PR #17): gzipped JSONL with
  model/dim manifest guard, idempotent upsert by deterministic chunk ids,
  chapter/document flag restoration, --remap-area.
- **Frontend lint integrity** (PR #18): duplicate eslint plugin
  registration had been crashing the linter during builds (zero
  enforcement); dedupe + autofix wave + minor bumps.
- **Anki pull-sync** (PR #19): AnkiCardState review-state mirror +
  AnkiSyncRun watermark bookkeeping; AnkiWeb-sync-then-read pull path;
  manual trigger endpoint + optional background loop. Bonus fix: the
  mrag-minimal template deck-override sent every pushed card to Anki's
  Default deck — cards now moved to the intended deck explicitly.

## Phase 5 — Vector store v2 + RAG hardening (merged 2026-08-08, PRs #10, #12)

- **Vector store API: legacy `PGVector` → `PGVectorStore` v2** (PR #12):
  one explicit `book_embeddings` table (alembic-owned schema, HNSW cosine
  index) replaces the library-hardcoded `langchain_pg_*` pair; `area` and
  `chapter_id` are real filterable columns; deterministic TEXT chunk ids
  upsert on re-embed.
- **RAG hardening** (PR #10): `with_structured_output` + Pydantic for
  rerank and query rewriter; typed exception hierarchy with five-digit
  error codes (400xx/404xx/500xx, HTTP status derived from code); global
  exception handlers with `error_id` + `step`; structured WS error frames.
- **Embedding model: `text-embedding-004` (768-dim, retired) →
  `gemini-embedding-001` (1536-dim)** with asymmetric task_type and a
  table-reset migration.
- Dependency repairs (`19e073e`): missing otel-sdk/exporter, bcrypt,
  tiktoken declared; forced protobuf 3.20 → 5.29.

## Phase 4 — Retrieval quality (2026-05-15 → 05-29, PR #7)

- **Chapter embedding: whole-chapter (silently truncated at 2048 tokens) →
  token-aware chunking** (1000 tokens, 150 overlap, Markdown-structure
  separators via tiktoken).
- **Retrieval: chunk hits → LLM rerank (Gemini Flash, 0–10 scoring) →
  parent-chapter fetch** ("embed at chunk, retrieve at chapter").
- **EPUB parsing: raw chapter HTML → Markdown** via markdownify, so chunk
  boundaries follow real document structure.
- Added `docs/rag-and-embeddings-primer.md`.

## Phase 3 — Vector store migration (2026-05-15, PR #6)

- **ChromaDB (standalone HTTP container) → pgvector inside the existing
  Postgres** (`pgvector/pgvector:pg16` image). One datastore instead of two;
  `langchain-chroma` → `langchain-postgres`. Extension enabled via alembic.

## Phase 2 — LLM provider migration (2026-05-13, PR #5)

- **OpenAI → Google Gemini** as the LLM provider; **langchain 0.x → 1.x**
  (LCEL/langgraph API updates). Model names centralized into config
  constants (`LLM_MODEL`, `LLM_FAST_MODEL`).
- Rode along: register endpoint, SQL session consolidation, Firebase init
  moved to lifespan handler, WebSocket connection-handling fixes.

## Infra fixes on the side (2026-05-29, PRs #8, #9)

- **Anki image rebuilt multi-arch (amd64 + arm64)**; broken sources, race,
  dead deps fixed; entrypoint seeds AnkiConnect, registers the profile, and
  repairs `webBindAddress` on stale volumes; compose healthcheck added
  (PR #8, merged into the pgvector branch and landed on master via PR #6).
- **Frontend fetchers: symmetric case conversion + typed responses** (PR #9).

## Phase 1 — Foundation (2026-03-28 → 03-29, PRs #1–#4, marker `c1a10a0`)

- **Dev workflow: ad-hoc scripts → Makefile targets** (infra containers in
  Docker, app processes local).
- **Config: scattered `os.getenv` → single pydantic `Settings`** (PR #3).
- **Firebase Storage secured with a Custom Token auth bridge** (PR #2);
  lazy Firebase Auth init to survive SSR prerender.
- **EPUB upload/embedding pipeline repaired end-to-end** (PR #1).
- **Schema management: none → Alembic** with a baseline migration (PR #4).
- Deployment to VPS frozen (`c1a10a0`) — **the 2.0 marker commit**.

---

## v1.0 (baseline, ≤ 2025-12)

For reference, the frozen state: OpenAI + langchain 0.x, ChromaDB vector
store, whole-chapter embeddings, no alembic, env vars via `os.getenv`,
Stalwart mail server + Caddy + GitHub-Actions VPS deploy.
