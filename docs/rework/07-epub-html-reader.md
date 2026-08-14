# EPUB chapter HTML for the frontend reader

First raised 2026-08-14 (decisions below locked the same day). Today the
parser converts chapter HTML → Markdown at upload and **discards the
HTML**; `Chapter.content` (Markdown) feeds both embeddings and the sidebar
reader. The original EPUB survives in Firebase Storage, so all of this is
recoverable for already-uploaded books by re-parsing.

## Decisions (2026-08-14)

- **Storage: separate 1:1 blob table in Postgres**, not a column on
  `Chapter` — chapter rows are loaded eagerly all over the app
  (selectinload chains, retrieval joins); the HTML must never ride along.
  Fetched lazily by its own endpoint only when a reader opens.
- **Images: inlined as base64** in the stored HTML. Trade-off accepted:
  rows get heavy (images dominate EPUB size), but the separate table
  quarantines that weight from every hot query, and the reader gets
  self-contained HTML with zero extra fetch/auth infrastructure. Revisit
  only if books with heavy artwork make rows unwieldy (Postgres TOAST
  handles multi-MB text fine).
- **Reader surface: likely both** — upgrade the sidebar `ChapterReader`
  and add a dedicated reading view — but the actual design is delegated
  to the design project (request added to `feedback/design-gaps.md` in
  the claude.ai MRAG project).
- **Markdown stays the embedding source.** HTML is display-only; the
  chunker and retrieval pipeline are untouched.

## Schema

```
ChapterHtml
  chapter_id: UUID (pk, fk -> chapter.id)   # 1:1
  html: str                                  # sanitized, images base64-inlined
  created_at: datetime
```

No relationship configured on `Chapter` (or `lazy="noload"`), so ORM
loads can't accidentally pull the blob.

## Parse pass changes (tools/epub_parser)

The extractor already slices per-chapter HTML fragments before
markdownifying — capture that same slice as HTML:

1. Serialize the chapter's block elements (same fragment boundaries the
   Markdown path uses, so HTML and Markdown stay aligned per chapter).
2. **Sanitize server-side** (allowlist tags/attrs, strip scripts/event
   handlers/external refs — publisher EPUB HTML is untrusted input that
   we'd otherwise re-serve to the browser).
3. Resolve `<img src>` against the EPUB archive and inline as
   `data:` base64 URIs; drop images that fail to resolve.
4. Return alongside markdown; the embedding controller writes
   `ChapterHtml` rows in the same transaction as chapters.

Backfill: a small script re-runs the parse for existing documents from
the stored EPUBs (same path the export/import scripts use for their
side of the world).

## API

`GET /api/chapter/{chapter_tag}/html` — auth + ownership via the
chapter→document chain (authz helpers exist), returns `{html}`. Not
embedded in any list endpoint, ever.

## Frontend

- `lib/fetchers/fetch-chapters.ts` gains `getChapterHtml`.
- `ui/chat/chapter-reader.tsx` prefers HTML when available (rendered via
  `dangerouslySetInnerHTML` — acceptable *only* because sanitization
  happened at ingest; consider a client-side DOMPurify pass as belt and
  braces), falls back to the Markdown render for chapters without a blob.
- Dedicated reading view: **pending design** — the design project has
  been asked to propose the full-page reading experience (entry from the
  rail's library, chapter navigation, typography).

## Open items

- [ ] Designer input on the reading view (requested in the design project)
- [ ] Sanitizer choice (bleach vs nh3) — nh3 (ammonia bindings) is the
      faster, maintained option
- [ ] Backfill script for existing documents
- [ ] Size telemetry: log ChapterHtml sizes at ingest so the base64
      decision can be revisited with data
