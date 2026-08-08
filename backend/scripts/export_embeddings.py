"""Export embeddings for one area or one document to gzipped JSONL.

Usage:
    poetry run export-embeddings --area golang --out golang.jsonl.gz
    poetry run export-embeddings --document <doc-uuid> --out book.jsonl.gz

Line 1 is a manifest {model, dim, exported_at, filter, row_count}; every
following line is one chunk {langchain_id, content, embedding, area,
chapter_id, metadata}. The import side refuses files whose model/dim don't
match the current EMBEDDING_MODEL / EMBEDDING_DIM — that guard is what
makes the format safe across future model swaps (see docs/rework/02).
"""
import argparse
import asyncio
import gzip
import json
import sys
from datetime import datetime, timezone

from sqlalchemy import text

from server.db.database import engine
from server.db.vectordb.embeddings import EMBEDDING_DIM, EMBEDDING_MODEL

_BASE = (
    "SELECT langchain_id, content, embedding::text AS embedding, area, "
    "chapter_id, langchain_metadata FROM book_embeddings"
)


async def export(area: str | None, document: str | None, out_path: str) -> int:
    if area:
        query, params, filt = f"{_BASE} WHERE area = :area", {"area": area}, {"area": area}
    else:
        # chapter_id is TEXT; match against the document's chapter uuids as
        # text to avoid ::uuid casts blowing up on any non-uuid rows.
        query = (
            f"{_BASE} WHERE chapter_id IN "
            "(SELECT id::text FROM chapter WHERE document_id = :doc)"
        )
        params, filt = {"doc": document}, {"document": document}

    async with engine.connect() as conn:
        rows = (await conn.execute(text(query), params)).mappings().all()

    if not rows:
        print(f"No embeddings matched {filt} — nothing exported.", file=sys.stderr)
        return 0

    manifest = {
        "model": EMBEDDING_MODEL,
        "dim": EMBEDDING_DIM,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "filter": filt,
        "row_count": len(rows),
    }
    with gzip.open(out_path, "wt", encoding="utf-8") as f:
        f.write(json.dumps(manifest) + "\n")
        for r in rows:
            f.write(json.dumps({
                "langchain_id": r["langchain_id"],
                "content": r["content"],
                "embedding": json.loads(r["embedding"]),  # '[0.1,...]' is valid JSON
                "area": r["area"],
                "chapter_id": r["chapter_id"],
                "metadata": r["langchain_metadata"],
            }) + "\n")

    print(f"Exported {len(rows)} chunks -> {out_path}")
    return len(rows)


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    scope = p.add_mutually_exclusive_group(required=True)
    scope.add_argument("--area", help="area label to export")
    scope.add_argument("--document", help="document uuid to export")
    p.add_argument("--out", required=True, help="output path (.jsonl.gz)")
    args = p.parse_args()
    asyncio.run(export(args.area, args.document, args.out))


if __name__ == "__main__":
    main()
