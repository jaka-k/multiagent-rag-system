# syntax=docker/dockerfile:1.7

# ── Build: resolve dependencies into /backend/.venv ─────────────────────────
FROM python:3.14-slim AS builder

# A compiler is needed for dependencies without Python 3.14 wheels (cffi, zstandard).
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential \
 && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir poetry==2.1.3

ENV POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=1 \
    POETRY_VIRTUALENVS_CREATE=1 \
    POETRY_CACHE_DIR=/tmp/poetry_cache

WORKDIR /backend

# Dependencies first so this layer is cached until the lock file changes.
COPY pyproject.toml poetry.lock ./
RUN touch README.md \
 && poetry install --no-root \
 && rm -rf "$POETRY_CACHE_DIR"

# Then the app itself (installs the console scripts, e.g. create-invite).
COPY . .
RUN poetry install --only-root


# ── Runtime: no compiler, no Poetry, non-root ───────────────────────────────
FROM python:3.14-slim

ENV PATH="/backend/.venv/bin:$PATH" \
    PYTHONPATH=/backend \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN useradd --uid 10001 --no-create-home --shell /usr/sbin/nologin app

WORKDIR /backend
COPY --from=builder --chown=app:app /backend /backend

USER 10001
EXPOSE 8080

CMD ["fastapi", "run", "server/main.py", "--host", "0.0.0.0", "--port", "8080"]
