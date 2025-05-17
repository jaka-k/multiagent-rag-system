FROM python:3.12-slim

RUN pip install poetry==2.0.1

ENV POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=true \
    POETRY_VIRTUALENVS_CREATE=1 \
    POETRY_CACHE_DIR=/tmp/poetry_cache \
    PYTHONPATH=/backend

WORKDIR /backend

COPY . .

RUN touch README.md

RUN poetry install

COPY . .

EXPOSE 8080

ENTRYPOINT ["poetry", "run"]

CMD ["fastapi", "run", "server/main.py", "--host", "0.0.0.0", "--port", "8080"]