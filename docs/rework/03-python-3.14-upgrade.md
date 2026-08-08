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
   - [ ] `poetry run python -c "import server.main"` (already proven in the
         scratch venv).
   - [ ] alembic chain on a fresh DB; app boot; WS chat connect.
   - [ ] Live smoke: one embedding, one chat turn, one EPUB upload
         (validates protobuf 7 against real Gemini + Firebase traffic).
   - [ ] Monitoring stack up: traces/logs still arrive (otel 1.44 vs the
         collector image — bump the collector if the OTLP handshake fails).

## Not doing

- Free-threaded (no-GIL) 3.14 build — separate experiment, zero dependency
  support guarantees; the standard build is the target.
- Keeping 3.12/3.13 support in the constraint — single-team pre-launch app,
  one interpreter is simpler.
