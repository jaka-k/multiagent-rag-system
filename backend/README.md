The poetry dir called backend,
meant for dev notes on the backend

To drop all vector db collections in prod:
```bash
docker compose exec backend python scripts/reset_vector_db.py
```