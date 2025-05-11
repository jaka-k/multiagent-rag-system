FROM python:3.12-slim

RUN pip install poetry==2.0.1

ENV POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=1 \
    POETRY_VIRTUALENVS_CREATE=1 \
    POETRY_CACHE_DIR=/tmp/poetry_cache

RUN apt-get update && \
    apt-get install -y libpq-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /backend

COPY pyproject.toml poetry.lock ./
COPY ./ ./

RUN touch README.md

RUN poetry install --no-interaction

ENTRYPOINT ["poetry", "run", "fastapi", "dev", "server/main.py", "--host", "0.0.0.0", "--port", "8080" ]