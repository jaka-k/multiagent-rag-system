The poetry dir called backend,
meant for dev notes on the backend.

## Resetting the vector store

Vectors live in pgvector tables (`langchain_pg_embedding`, `langchain_pg_collection`)
inside the main Postgres instance. There is intentionally no app-code reset
path — drop into the DB shell and run SQL.

From the repo root:

```bash
make db-shell
```

then inside `psql`:

```sql
TRUNCATE TABLE langchain_pg_embedding, langchain_pg_collection RESTART IDENTITY CASCADE;
UPDATE chapter SET is_embedded = FALSE;
UPDATE document SET embedding_status = 'idle';
```

After truncating, trigger re-embedding per document through the existing
embedding controller flow (no automatic re-embed runs).
