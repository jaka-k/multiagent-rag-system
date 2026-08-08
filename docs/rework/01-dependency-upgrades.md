# Dependency upgrades & repo hygiene

Findings from the 2026-08-07 verification run (backend boot, full alembic
chain on fresh DB, `next build`, full-UI screenshot sweep). The frontend is
essentially current (Next 15.5, React 19.2, TS 5.9); the backend carries the
real drift.

## Context already handled

- `opentelemetry-sdk` + `opentelemetry-exporter-otlp-proto-grpc` 1.29.0,
  `bcrypt`, and `tiktoken` were added on 2026-08-07 — they were imported but
  never declared. Installing the exporter forced **protobuf 3.20 → 5.29** and
  **google-api-core 1.34 → 2.30**. Imports are clean but no live Gemini call
  has exercised the new protobuf yet. **Watch the first embedding run.**

## Tier 1 — cheap batch (one PR)

- [ ] `poetry update aiohttp` — locked 3.11.13 is **yanked** upstream
      (regression, aio-libs/aiohttp#10617).
- [ ] Backend minors: fastapi 0.135→0.141, alembic, anyio, sqlalchemy,
      sqlmodel, psycopg/psycopg-pool, orjson, pydantic-settings, pyjwt,
      langchain-community, langchain-google-genai 4.2→4.3, langgraph 1.1→1.2,
      langchain 1.2→1.3.
- [ ] Frontend `pnpm update` (radix patches, react 19.2.x, zustand, postcss).
- Verify: app boots, `next build` passes.

## Tier 2 — OpenTelemetry lockstep (folded into the Python bump)

- [ ] Bump the whole family together: sdk + exporter 1.29.0 → 1.44.x,
      the three `opentelemetry-instrumentation-*` 0.50b0 → 0.65bx.
      Core (1.x) and instrumentation (0.x b) are released in lockstep and
      must match — never bump one side alone.
- **Do this as part of
  [03-python-3.14-upgrade.md](03-python-3.14-upgrade.md)**: 3.14-capable
  grpcio requires protobuf ≥6, and otel-proto 1.29 caps protobuf <6, so the
  Python bump forces this upgrade anyway (verified empirically 2026-08-08).
- Verify: boot with the monitoring stack (`make monitor`), confirm traces
  and logs land in Tempo/Loki.

## Tier 3 — majors, one PR each, with a functional check

- [ ] **websockets 13 → 17** (four majors). Exercise the chat WebSocket
      path end-to-end afterwards.
- [ ] **firebase-admin 6 → 7**. Touches auth and the EPUB file downloader.
      Not forced by 3.14 (6.9 imports fine there with newer google-cloud-*),
      so it can wait.
- [ ] **pgvector client 0.3.6 → 0.5.0**. Check langchain-postgres's
      constraint first; it may cap it.
- [ ] **markdownify 0.14 → 1.2**. The EPUB→Markdown parser depends on its
      output shape — diff parser output on a sample book before/after
      (chunk boundaries in `embedding_service` key off Markdown structure).
- [ ] Tooling: black 24 → 26, pytest 8 → 9 (no test suite exists yet —
      writing one is its own workstream and blocks confident upgrades).

## Tier 4 — repo hygiene (not versions)

- [ ] **Makefile rot** from the ChromaDB removal:
  - `logs` target still tails `chroma-server` → the command fails.
  - `infra` help-text still says "(postgres, chroma, anki)".
  - `reset-db` calls `poetry run reset-vector-db`, which no longer exists
    in `[tool.poetry.scripts]` → fix or delete (02 supersedes it).
- [ ] **AnkiConnect failure mode**: `POST /api/area` returns 500 when
      AnkiConnect is unreachable, *after* the area row commits — the client
      sees an error for a half-succeeded operation. Make deck creation
      non-fatal (log + retry later) so area creation degrades gracefully.
- [x] **AnkiConnect unreachable locally** — root-caused and resolved
      2026-08-08. The reworked Anki image (PR #8, incl. the stale-volume
      `webBindAddress` fix `e31bad6`) reached master via PR #6's merge, but
      the open PR stack (#10 → #12) forked before that, so images built
      from those checkouts lack the fix. Rebuilding the container from
      master's `anki/` immediately fixed it (AnkiConnect responds on 8765;
      the entrypoint repairs the stale volume in place — no volume wipe
      needed). Remaining: update the open PR branches from master so
      `make infra`/`docker-dev` builds the fixed image from any checkout.
      Note: `ANKI_URL` in `.env` was never the problem.
- [ ] **ESLint**: `next build` warns about a `react-hooks` plugin conflict
      (declared in both `.eslintrc.json` and `eslint-config-next`). Remove
      the duplicate registration. eslint 8.57 is EOL → flat-config/eslint-9
      migration when convenient.
- [ ] Prune merged remote branches (`feat/chromadb-to-pgvector-migration`,
      `feat/chunked-embeddings-and-md-parser`, stale `fix/*`).
