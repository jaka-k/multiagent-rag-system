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

- **Vector store API: legacy `PGVector` → `PGVectorStore` v2** (PR #12,
  open). One explicit `book_embeddings` table (alembic-owned schema, HNSW
  cosine index) replaces the library-hardcoded `langchain_pg_*` pair; `area`
  and `chapter_id` become real filterable columns; deterministic TEXT chunk
  ids upsert on re-embed. Retrieval scopes by `filter={"area": ...}` instead
  of per-area collections.
- **RAG hardening: structured outputs + typed failures** (PR #10, open).
  Rerank and query rewriter moved to `with_structured_output` + Pydantic;
  typed exception hierarchy (`QueryRewriteError`, `RetrievalError`,
  `EmbeddingModelError`, `EmbeddingStoreError`, …); global HTTP exception
  handlers with `error_id` + `step`; structured WebSocket error frames;
  loud-but-graceful rerank fallback.
- **Embedding model: `text-embedding-004` (768-dim, retired upstream) →
  `gemini-embedding-001` (1536-dim)** with asymmetric task_type
  (`RETRIEVAL_DOCUMENT` / `RETRIEVAL_QUERY`) and a table-reset migration
  (part of PR #10).
- **Dependency repairs** (2026-08-07, `19e073e`): declared previously
  missing `opentelemetry-sdk` + `opentelemetry-exporter-otlp-proto-grpc`
  1.29.0, `bcrypt` 5, `tiktoken` 0.13. Forced side-bumps: protobuf 3.20 →
  5.29, google-api-core 1.34 → 2.30.
- Planned next (see [rework/](rework/)): Python 3.12/3.13 → **3.14**
  everywhere (verified feasible; drags otel → 1.44 and protobuf → 7),
  tiered dependency bumps, embedding export/import scripts.

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
  dead deps fixed (PR #8). Known gap: the stale-volume `webBindAddress`
  fix (`e31bad6`) is still unmerged on `fix/anki-image-multiarch`.
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
