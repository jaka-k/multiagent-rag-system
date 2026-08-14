"""Import embeddings from an export file into book_embeddings.

Usage:
    poetry run import-embeddings golang.jsonl.gz [--remap-area <label>]

Refuses files whose manifest model/dim don't match the current
EMBEDDING_MODEL / EMBEDDING_DIM. Upserts by langchain_id (the
deterministic "{chapter_tag}-{chunk_index}" ids), so re-imports are
idempotent. Afterwards flips chapter.is_embedded for every imported
chapter and marks documents COMPLETED once all their chapters are
embedded, so the pipeline doesn't re-embed what was just restored.
"""
import argparse
import asyncio
import gzip
import json
import sys
import uuid

from sqlalchemy import text

from server.db.database import engine
from server.db.vectordb.embeddings import EMBEDDING_DIM, EMBEDDING_MODEL

BATCH = 500

_UPSERT = text(
    "INSERT INTO book_embeddings "
    "(langchain_id, content, embedding, area, chapter_id, langchain_metadata) "
    "VALUES (:id, :content, (:emb)::vector, :area, :chapter_id, (:meta)::jsonb) "
    "ON CONFLICT (langchain_id) DO UPDATE SET "
    "content = EXCLUDED.content, embedding = EXCLUDED.embedding, "
    "area = EXCLUDED.area, chapter_id = EXCLUDED.chapter_id, "
    "langchain_metadata = EXCLUDED.langchain_metadata"
)


def _read(path: str, remap_area: str | None):
    with gzip.open(path, "rt", encoding="utf-8") as f:
        manifest = json.loads(f.readline())
        if manifest.get("model") != EMBEDDING_MODEL or manifest.get("dim") != EMBEDDING_DIM:
            sys.exit(
                f"Refusing import: file is {manifest.get('model')}@{manifest.get('dim')}d, "
                f"current stack is {EMBEDDING_MODEL}@{EMBEDDING_DIM}d. Re-embed instead."
            )
        rows = []
        for line in f:
            r = json.loads(line)
            if remap_area:
                r["area"] = remap_area
                if isinstance(r.get("metadata"), dict) and "area" in r["metadata"]:
                    r["metadata"]["area"] = remap_area
            rows.append(r)
    if len(rows) != manifest["row_count"]:
        sys.exit(f"Corrupt file: manifest says {manifest['row_count']} rows, found {len(rows)}.")
    return manifest, rows


async def do_import(path: str, remap_area: str | None) -> int:
    manifest, rows = _read(path, remap_area)

    async with engine.begin() as conn:
        for i in range(0, len(rows), BATCH):
            await conn.execute(_UPSERT, [
                {
                    "id": r["langchain_id"],
                    "content": r["content"],
                    "emb": json.dumps(r["embedding"]),
                    "area": r["area"],
                    "chapter_id": r["chapter_id"],
                    "meta": json.dumps(r["metadata"]),
                }
                for r in rows[i:i + BATCH]
            ])

        chapter_ids = []
        for r in rows:
            try:
                chapter_ids.append(uuid.UUID(r["chapter_id"]))
            except (ValueError, AttributeError, TypeError):
                pass  # non-uuid chapter ids (e.g. test fixtures) carry no flags
        if chapter_ids:
            await conn.execute(
                text("UPDATE chapter SET is_embedded = true WHERE id = ANY(:ids)"),
                {"ids": chapter_ids},
            )
            # embedding_status stores enum *names* (see 20260529 migration)
            await conn.execute(text(
                "UPDATE document SET embedding_status = 'COMPLETED' WHERE id IN ("
                "  SELECT document_id FROM chapter "
                "  WHERE document_id IN (SELECT document_id FROM chapter WHERE id = ANY(:ids)) "
                "  GROUP BY document_id HAVING bool_and(is_embedded))"
            ), {"ids": chapter_ids})

    print(f"Imported {len(rows)} chunks from {path} "
          f"(filter={manifest['filter']}, remap_area={remap_area or '-'})")
    return len(rows)


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("file", help="export file (.jsonl.gz)")
    p.add_argument("--remap-area", help="import under a different area label")
    args = p.parse_args()
    asyncio.run(do_import(args.file, args.remap_area))


if __name__ == "__main__":
    main()
