# Python 3.14 upgrade

## Current spread (found 2026-08-08)

| Where | Version |
|---|---|
| prod/dev Docker images | **3.12** (`python:3.12-slim`) |
| local dev (pyenv global) | 3.13.9 |
| pyproject constraint | `^3.12` |

Prod runs a different interpreter than anyone develops on. The goal is one
version everywhere: **3.14** (current stable line; Python has no formal LTS —
3.14 gets full support until ~Oct 2027, security fixes to ~2030).

## Compatibility — verified empirically, not from classifiers

Done on 2026-08-08: built CPython 3.14.5, installed the full locked
dependency set into a clean venv, resolved conflicts, and imported
`server.main` successfully. Results:

**Compatible at currently-locked versions** (no change needed):
pydantic 2.12 / pydantic-core, psycopg 3.3, sqlalchemy 2.0.48, fastapi,
langchain stack, tiktoken 0.13, orjson, cryptography (abi3), websockets 13,
firebase-admin 6.9 — and everything else not listed below.

**Postgres driver, verified with live traffic** (the highest-risk C
extension): psycopg 3.3.3 + psycopg-binary loads its compiled
implementation on 3.14 (`psycopg.pq.__impl__ == "binary"`, cp314 wheels
exist — no pure-Python fallback), and the full PGVectorStore smoke test
passes against live Postgres on 3.14: async engine, table introspection,
batched inserts, upsert-by-id, area-filtered cosine similarity with correct
metadata merge. psycopg-pool 3.3.0 likewise installs unchanged.

Note: pyproject declares psycopg twice (a plain `^3.2.1` in the main deps and
`^3.2.4` + binary extra further down) — consolidate to one declaration with
`extras = ["binary"]` while touching this.

**Watch item — langchain's pydantic.v1 shim**: importing `langchain_core`
on 3.14 emits *"Core Pydantic V1 functionality isn't compatible with Python
3.14 or greater"*. Our code is pydantic-v2 native and everything tested
works; the warning comes from langchain-core's deprecated v1 compat layer.
Bumping langchain 1.2 → 1.3 (Tier 1 in 01) should quiet it — confirm after.

**Minimum bump set** (locked versions predate 3.14; these are the versions
pip resolved to and that import cleanly):

| Package | Locked | 3.14-capable |
|---|---|---|
| greenlet | 3.1.1 | 3.5.4 |
| grpcio / grpcio-status | 1.70.0 | 1.83.0 |
| numpy | 2.2.5 | 2.5.1 |
| watchfiles | 1.0.4 | 1.2.0 |
| **protobuf** | 5.29.6 | **7.35.1** (two majors) |
| proto-plus / googleapis-common-protos | 1.26 / 1.69 | 1.28 / 1.75 |
| google-cloud-* family (firestore, storage, auth, genai, …) | various | various (minor/major mix) |
| **opentelemetry family** (all 12 packages) | 1.29.0 / 0.50b0 | **1.44.0 / 0.65b0** |

Two structural takeaways:

1. **The Python bump forces the otel Tier-2 upgrade** from
   [01-dependency-upgrades.md](01-dependency-upgrades.md): 3.14-capable
   grpcio needs protobuf ≥6, and opentelemetry-proto 1.29 caps protobuf <6.
   Do them as one change, not two.
2. **protobuf jumps two majors (5 → 7)**. Everything imports, but the first
   live Gemini call and Firestore/Storage operation after the bump are the
   real test. Budget a manual smoke of: one embedding call, one chat
   completion, one EPUB upload (Firebase Storage download path).

## Plan

1. **Interpreter**
   - [ ] `pyenv install 3.14.5` (done locally already); add a repo-root
         `.python-version` with `3.14.5` so pyenv agrees for everyone.
   - [ ] `poetry env use 3.14.5` in `backend/`.
2. **pyproject**
   - [ ] `python = "^3.14"` (pre-launch, no reason to keep a support range).
   - [ ] `poetry update greenlet grpcio grpcio-status numpy watchfiles \
         protobuf proto-plus googleapis-common-protos google-auth \
         google-api-core google-cloud-firestore google-cloud-storage \
         google-genai opentelemetry-sdk opentelemetry-exporter-otlp-proto-grpc \
         opentelemetry-instrumentation-fastapi opentelemetry-instrumentation-requests \
         opentelemetry-instrumentation-sqlalchemy`
         — or fold in the Tier-1 batch from 01 and do a single `poetry update`.
3. **Docker**
   - [ ] `dev.Dockerfile` + `prod.Dockerfile`: `FROM python:3.14-slim`.
   - [ ] Rebuild `make docker-dev` and boot the full stack once.
4. **Verify**
   - [x] `poetry run python -c "import server.main"` — clean on the real venv.
   - [x] alembic upgrade head; app boot (24 routes, Firebase init OK, DB
         init OK); pgvector smoke (introspection/insert/upsert/filtered
         search) all pass on 3.14.
   - [x] Live smoke, partial: **Firebase Admin initialized against real
         credentials on protobuf 7** — the riskiest surface validated. The
         Gemini call reached Google and round-tripped a well-formed API
         error through the new grpc/protobuf/httpx stack, but the response
         was `API_KEY_INVALID`: **the GOOGLE_API_KEY in `.env` is being
         rejected by Google** (not a 3.14 issue — same key fails on any
         stack). Rotate the key, then re-run one embedding + one chat turn
         to finish this checkbox.
   - [ ] Monitoring stack up: traces/logs still arrive (otel 1.44 vs the
         collector image — bump the collector if the OTLP handshake fails).
   - [ ] `make docker-dev` full-stack rebuild on the 3.14 image.

### Found during execution (2026-08-08)

- **httpcore 1.0.7 crashes on import under 3.14** (`typing.Union` became
  immutable; its `setattr(__module__)` loop throws). Fixed by 1.0.9 —
  included in this branch's lock. Anything else pinning httpcore <1.0.9
  will hit the same wall.
- `poetry lock` alone keeps old pins; the explicit `poetry update` of the
  binary set was required, exactly as planned above.
- aiohttp updated 3.11.13 (yanked) → 3.14.3 in the same pass — doc 01
  Tier 1 item, done here.

## Not doing

- Free-threaded (no-GIL) 3.14 build — separate experiment, zero dependency
  support guarantees; the standard build is the target.
- Keeping 3.12/3.13 support in the constraint — single-team pre-launch app,
  one interpreter is simpler.
