# Changelog — 2.0 rewrite

Everything upgraded, migrated, or replaced since **v1.0** — the last state
deployed to the VPS before the rewrite began. The 2.0 work starts with the
2026-03-28 commit burst (`b7b7eb6`, "move dev setup to make scripts") and is
explicitly marked by `c1a10a0` — *"fix: hold deployment to VPS while working
on 2.0"* (2026-03-29). v1.0 stays frozen in deployment until 2.0 ships.

Format: newest phase first. PR numbers link the work; unreleased items are
flagged.

---

## [Unreleased / in flight]

- **Frontend redesign** (docs/rework/04): chat-first app shell modeled on
  the claude.ai/design MRAG project — in progress.
- Remaining: doc 01 Tier 3 majors, docker-image rebuild verification on
  3.14, otel-collector handshake check, doc 05 schema decisions.

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
