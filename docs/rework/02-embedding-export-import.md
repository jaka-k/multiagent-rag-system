# Embedding export/import scripts (per book or area)

> **Implemented 2026-08-08** (`feat/embedding-export-import`, stacked PR).
> Roundtrip-verified in dev: export → truncate → import with identical
> similarity neighbors, idempotent re-import, --remap-area, and the
> manifest guard rejecting a dim-mismatched file.

Depends on the `book_embeddings` table from PR #12 (PGVectorStore v2).

## Why

Embeddings are the only data in the system that costs real money and time to
recreate (Gemini API calls per token); everything else rebuilds from Postgres
or the source EPUBs. Export/import lets us survive table resets, move data
between environments, and seed prod without re-embedding.

Whole-database backup is **not** the goal — that's just
`pg_dump -t book_embeddings`. These scripts exist for the per-book/per-area
granularity.

## CLI surface

Two scripts in `backend/scripts/`, wired as poetry entry points:

```bash
poetry run export-embeddings --area golang --out golang.jsonl.gz
poetry run export-embeddings --document <doc-uuid> --out book.jsonl.gz
poetry run import-embeddings golang.jsonl.gz [--remap-area <label>]
```

## Selection logic

- `--area`: `WHERE area = :label` — trivial, `area` is a real column.
- `--document` (single book): chunk metadata carries `chapter_id` but not the
  document id, so join:
  `book_embeddings.chapter_id::uuid → chapter.id → chapter.document_id = :doc`.

## File format

Gzipped JSONL.

- **Line 1 — manifest**: `{model, dim, exported_at, filter, row_count}`.
  Import **refuses to load** if `model` or `dim` don't match the current
  `EMBEDDING_MODEL` / `EMBEDDING_DIM` in `server/db/vectordb/embeddings.py`.
  This guard is what makes the format safe across future model swaps.
- **One line per chunk**:
  `{langchain_id, content, embedding, area, chapter_id, metadata}`
  (embedding as a JSON float array; `metadata` is the JSONB column verbatim).

## Import mechanics

- Stream in batches (~500 rows); insert with
  `ON CONFLICT (langchain_id) DO UPDATE`. The deterministic
  `{chapter_tag}-{chunk_index}` ids make re-imports idempotent.
- Vectors cast via `'[...]'::vector` (or psycopg's pgvector adapter).
- Afterward:
  - `chapter.is_embedded = true` for every imported `chapter_id`;
  - `document.embedding_status = 'COMPLETED'` for documents whose chapters
    are all covered — so the embedding pipeline doesn't re-process what was
    just restored.
- `--remap-area <label>` overrides the `area` column on the way in (restore a
  book into a differently-labeled area). Also rewrite the `area` key inside
  the JSONB metadata to stay consistent.

## Testing

Roundtrip in dev, no Gemini calls: seed `book_embeddings` with a
deterministic fake embedder (`langchain_core.embeddings.DeterministicFakeEmbedding`,
size 1536 — same approach as the PR #12 smoke test), then:

1. export area → truncate table → import
2. assert row count matches the manifest
3. assert a similarity search returns identical neighbors before/after
4. re-import the same file → row count unchanged (upsert proof)

## Non-goals

- Cross-model migration (a 768-dim export cannot be imported into a 1536-dim
  table — the manifest guard rejects it; re-embedding is the only path).
- Incremental/differential export. Files are small (a few MB per book:
  ~235k tokens ≈ 235 chunks × ~6 KB vector); full re-export is fine.
