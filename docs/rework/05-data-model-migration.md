# Data model migration — porting the current schema onto the redesign

Companion to [04-frontend-redesign.md](04-frontend-redesign.md), organized
**screen by screen, section by section** to match how that plan is phased.
This is a **proposal for discussion, not a committed schema** — per-section
verdicts below are a starting point; several sections end in an explicit
open question rather than an answer. Nothing here should be turned into an
alembic migration until the relevant question is resolved.

Grounded in the actual models (`server/models/*.py`) and the EPUB parser
(`tools/epub_parser/utils/chapter_extractor.py`, `toc.py`), not assumptions.

## Foundational correction to doc 04

Doc 04's gap #2 said chapter subsections "don't exist." That's not quite
right — **they partially already do.** `toc.py::parse_toc_ncx` walks the
EPUB's NCX and extracts only **second-level** `navPoint`s: each stored
`Chapter` row is already one subsection, with `label` = the subsection
title and `parent_label` = the parent chapter's title (`toc.py:18-31`).
`embedding_service.py` already relies on this split (`"chapter":
chapter.parent_label, "subchapter": chapter.label` in chunk metadata,
`embedding_service.py:69-71`). So the mockup's chapter tree — chapter
number + title, expandable to subsections with titles — is **mostly a
grouping-and-display problem on existing data**, not a new hierarchy.

Two real gaps remain even so:
- **No chapter number.** Nothing stores "Chapter 5" as a number; only
  `order`/`play_order` sequencing exists. Fine to derive at query time
  (group `Chapter` rows by `parent_label`, preserve first-seen `order`,
  assign sequential integers) — no schema change needed for this alone.
- **Fragile on flat (single-level) TOCs.** `parse_toc_ncx` only descends
  into `navPoint` children; a book whose NCX has no nested navPoints
  yields zero entries, and `extract_chapters`'s `max(...)` over an empty
  list raises. This is a pre-existing parser bug, not caused by the
  redesign, but the redesign's chapter-tree UI is the first place it will
  visibly matter (some real-world books will show empty/broken trees, or
  fail to embed at all). Worth a fix in the same window as this work,
  tracked here since it wasn't visible in doc 01/03/04.

Page numbers stay a non-goal per doc 04 — EPUBs don't carry them.

## Rail — Library (book covers, indexed state, per-book card count)

- **Indexed dot**: `Document.embedding_status == COMPLETED` — already
  exists, no change.
- **Cover art**: `Document.cover_image` already exists as a field; confirm
  the parser actually populates it (needs a check, not a schema change). If
  frequently empty, port the mockup's gradient+abbreviation `BookCover` as
  the fallback rendering — that's the *only* rendering the mockup itself
  uses, so it's a safe default regardless.
- **Per-book card count ("86 cards") — real gap.** `Flashcard` has no link
  to `Chapter` or `Document` at all: only `deck_id` (per-area) and
  `queue_id` (per-session). There is currently no query that can answer
  "how many cards came from this book." **Proposed:** add
  `Flashcard.chapter_id: Optional[UUID] = Field(foreign_key="chapter.id")`.
  Nullable, because loose/web-clipped/manual cards have no chapter. This
  single FK also fixes two other sections below (card source badge,
  loose-cards provenance) — it's the highest-leverage schema change in this
  whole doc.

## Chat Home — session list (grouped by day, per-session book, counts)

- **Grouping by Today/Yesterday/Earlier**: pure client/query-time bucketing
  on `Session.updated_at`. No schema change.
- **Message/card counts per session**: `len(session.messages)` and
  `len(session.flashcard_queue.flashcards)` — both already derivable.
- **"Book cover" per session — structural mismatch, not just a missing
  field.** The mockup's data model assumes **1 session = 1 book**
  (`sessions[i].book = "ddia"`). The real app scopes a `Session` to an
  **`Area`**, which can contain many `Document`s — there is no single
  "the book this chat is about." Options:
  1. Derive a "primary book" per session from whichever document its
     retrieved chapters most often belong to (needs the retrieval-history
     table proposed below — no schema change beyond that).
  2. Let the user pin a book at chat-creation time (`Session.document_id:
     Optional[UUID]`, new nullable FK) — cheap, explicit, but a chat can
     legitimately span multiple books in a broad area and the mockup's
     "book" framing may just not fit multi-book areas.
  3. Drop the per-session book cover for multi-book areas; fall back to the
     area's own icon/color when a session has no single dominant book.
  **This needs a decision before building `ChatHome`** — it changes
  whether option 1's supporting table is required up front.

## Conversation — inline citations

No change to the finding in doc 04 gap #3: `Message.content` is a plain
string, so there is nowhere to hang a `<ref n="1">` → chapter mapping. This
needs the RAG answer step to emit structured output (text + citation spans
keyed to a `chapter_id`) rather than a raw token stream, plus somewhere to
persist that structure per message (see next section — the same storage
answers both citations and the Chapters sidebar tab). Sequencing note:
build the storage in the next section first; citations are a rendering
layer on top of it, not a separate schema problem.

## Sidebar tab 1 — Chapters (retrieved-for-this-answer tree + reader)

- **Real gap: retrieval results aren't persisted per message.**
  `retrieve_chapters` runs per turn and its result is yielded once over the
  WebSocket (`rag_agent.py`: `yield {"context": docs}`) — nothing writes it
  to the database. Reload the page and the "Retrieved for this answer" tree
  in the mockup has nothing to show, because there's no record of what was
  retrieved. **Proposed:** a new table,
  ```
  MessageRetrieval
    id: UUID (pk)
    message_id: UUID (fk -> message.id)
    chapter_id: UUID (fk -> chapter.id)
    relevance_score: float          # from RerankItem.score, already computed
    rank: int                       # position in the reranked list
  ```
  One row per (message, chapter) hit. This is the same data
  `_rerank_chunks` already computes in `retriever.py` — the change is
  writing it out instead of discarding it after the WS yield. This table
  is also the natural backing store for citations (previous section) and
  for the Chat-Home "primary book per session" derivation (previous
  section, option 1).
- **Reader pane** (whole-chapter view, scroll-synced to subsection): reads
  `Chapter.content` directly, already Markdown from the parser. No schema
  change; this is a frontend rendering task once `MessageRetrieval` exists
  to know *which* chapters to offer.

## Sidebar tab 2 — Flashcards (cards generated in this chat)

Good news: this one mostly already works structurally.
`FlashcardQueue` is 1:1 with `Session` (`session.py:63-72`), so
`session.flashcard_queue.flashcards` **is already** "cards from this chat"
— no new relationship needed. Two smaller gaps:

- **Card type (def/code/concept/cloze) for the tag chip + accent bar.**
  Confirmed by reading `statemachine/agents/flashcards/templates.py` and
  `analysis/knowledge_identification_agent.py`: the existing `Flashcard.tag`
  field is populated from a **topic category** (e.g. "Concurrency API",
  "Architectural Components" — a fixed taxonomy from
  `analysis/templates.py`), which is a different axis from the mockup's
  card-*format* type. **Do not repurpose `tag`.** Proposed: add
  `Flashcard.card_type: Optional[str]` (or a proper enum:
  `def | code | concept | cloze`), populated at generation time by whichever
  agent produced the card.
- **Structured q/a fields vs. Anki HTML.** `front`/`back` are currently
  pre-rendered, Anki-flavored HTML (see the inline-styled template in
  `flashcards/templates.py` — category badges, colored borders baked into
  the HTML string). The mockup's `FlashCard` component wants to render its
  own `q` / `code` / `a` fields with its own styling, not embed someone
  else's inline-styled HTML. **Proposed:** add structured fields —
  `Flashcard.question: str`, `Flashcard.answer: str`,
  `Flashcard.code_snippet: Optional[str]` — as the source of truth for the
  web UI; keep generating the Anki-HTML `front`/`back` pair *from* those
  structured fields at Anki-sync time rather than the reverse. Cleaner
  separation, and it stops the web redesign from being coupled to Anki's
  card template.

## Sidebar tab 3 — Generation Bot

Mostly a UI/orchestration feature (chapter-reference picker + a drafting
loop that calls the existing flashcard-generation agents), not a schema
problem, *given* the two changes above (`card_type`, structured
question/answer fields) and the chapter-reference picker being backed by
the same `Chapter` grouping used in the Chapters tab. No new tables
proposed here beyond what's already listed.

## Flashcards main tab

- **Loose-cards band ("not in a queue") — the MRAG Clipper's landing zone.**
  Product direction (2026-08): the Chrome extension is a planned feature,
  and clipped web content lands here first, to be filed into queues later.
  `Flashcard.queue_id` is nullable today, so "loose" already means
  `queue_id IS NULL` at the schema level — but the schema should be
  clipper-ready now so the extension epic doesn't need its own migration
  wave later:
  - `Flashcard.source_url: Optional[str]` — the clipped page's URL, cited
    on every card (the mockup's "Keep source: URL + selection" setting).
  - `Flashcard.origin: str` — enum `chat | clip | manual`, so the UI badges
    provenance ("web · MDN" vs. "DDIA · §5.1" vs. "manual") without
    inferring it from which FKs happen to be null. Chat-generated cards get
    `chapter_id` set; clipper cards get `source_url`; manual cards neither.
  - The clipper itself will need an authenticated ingest endpoint
    (`POST /api/flashcards` accepting origin=clip + source_url + agent to
    run) — out of scope for this doc's schema work, but the columns above
    are exactly what that endpoint writes into.
- **Queue grid — the largest structural mismatch in this entire redesign.**
  The mockup's `queues` (`data.js`) are **persistent, cross-session, named
  collections** scoped to a book/chapter — cards accumulate into a queue
  "from" a chat session but the queue outlives that session and can be
  studied later with a progress bar (`studied`/`count`). The current
  `FlashcardQueue` is **1:1 and permanently bound to a single `Session`**
  (`uselist: False` on both sides). These are different concepts wearing
  the same name. Reusing the current table as-is would mean every mockup
  "queue" is really just that one session's card set — no cross-session
  accumulation, no "Auto by chapter" routing, no persistent named
  collections a user builds up over time.

  **This needs to be discussed and decided explicitly before any Flashcards
  main-tab work starts** — it's not a field addition, it's a redefinition.
  Two directions, not a recommendation yet:
  1. Introduce a new `Queue` entity (name, area-scoped, cards route into it
     from many sessions/agents over time), and repurpose today's
     `FlashcardQueue` as what it actually is — the per-session scratch set
     — feeding into one or more real `Queue`s on save. This matches the
     mockup closely but is a genuine new subsystem.
  2. Keep the 1-session-1-queue model and reinterpret the mockup's grid as
     "one card per session," accepting that "Auto by chapter" routing and
     long-lived named queues aren't part of this iteration. Much cheaper,
     but drops a feature the mockup treats as central.
- **Progress bar (`studied`/`count`) — depends on the above, plus a source-
  of-truth decision.** No local review-state field exists on `Flashcard`
  today; cards sync to Anki (`anki_id`) which *does* track review state.
  Options: (a) mirror review state locally (`Flashcard.last_reviewed_at`,
  `review_count`) via a periodic AnkiConnect sync, or (b) query
  AnkiConnect's batched `cardsInfo` live at render time (one call can cover
  every card in the visible queue grid, so this may be fast enough without
  caching — worth measuring before building a sync job).

## Agent Instructions main tab

Confirms and sharpens doc 04 gap #1. `CustomInstructionQueue` today is:
```
CustomInstructionQueue
  id, session_id (1:1), instruction: str, created_at
```
One freeform string, one per session — not reusable, not toggleable, no
identity beyond the text. The mockup's agent grid needs named, independent,
persistent entities. Proposed new table (replacing
`CustomInstructionQueue`'s role, not necessarily its rows):
```
Agent
  id: UUID (pk)
  area_id: UUID (fk -> area.id)      # scope: reusable across sessions in an area
  name: str                          # "Definition Carder"
  description: str
  icon: str
  card_type: str                     # def | code | concept | cloze — what it produces
  system_prompt: str                 # the actual instruction text
  variables: list[str]               # {{chapter}}, {{selection}}, etc. — JSON column
  is_active: bool
  model: Optional[str]               # overrides area/session default if set
  difficulty: Optional[str]          # Standard | Hard
  target_queue_id: Optional[UUID]    # only meaningful once the Queue decision above lands
```
`area_id` scope is proposed (matches how `Document`/`Deck` are already
scoped) rather than per-user or global — **flag this as a decision to
confirm**, not settled. Existing `Instruction` model on `Area`
(`area.py:33-41`, `context_text`/`model`) looks like an earlier, simpler
attempt at the same idea and should be reconciled with this proposal rather
than left as a third, competing concept — worth checking whether anything
still reads `Instruction` before deciding to fold it in or deprecate it.

## Cross-cutting summary — proposed changes at a glance

| Change | Kind | Blocks |
|---|---|---|
| `Flashcard.chapter_id` (nullable FK → `chapter.id`) | new column | Rail card counts, loose-card source badges |
| `Flashcard.card_type` | new column/enum | Flashcards sidebar tab, main-tab cards |
| `Flashcard.question` / `.answer` / `.code_snippet` | new columns | Flashcards sidebar tab, main-tab cards |
| `Flashcard.source_url` | new column | Loose-cards source badge; MRAG Clipper ingest |
| `Flashcard.origin` (`chat \| clip \| manual`) | new column/enum | Provenance badges; MRAG Clipper ingest |
| `MessageRetrieval` (message_id, chapter_id, relevance_score, rank) | new table | Chapters sidebar tab (reload persistence), Conversation citations, Chat-Home primary-book derivation |
| `Session.document_id` (nullable FK) *or* derive from `MessageRetrieval* | new column *or* none | Chat-Home book cover (pending decision) |
| `Agent` (replaces `CustomInstructionQueue`'s role) | new table | Agent Instructions main tab |
| `Queue` redefinition (new entity vs. reinterpret current 1:1) | **decision, not yet a change** | Flashcards main tab queue grid |
| Chapter numbering | derived at query time | Chapters sidebar tab, Rail (no schema change) |
| Flat-TOC parser crash | bug fix, unrelated to schema | Chapters sidebar tab reliability |

## Suggested sequencing

Ordered so nothing gets built twice against a model that's about to change:

1. Resolve the **Queue redefinition** and **Agent scope** decisions first —
   both are load-bearing for multiple later phases in doc 04.
2. `Flashcard.chapter_id` + `card_type` + structured question/answer/code
   fields — small, additive, unblocks Rail counts and both Flashcards tabs.
3. `MessageRetrieval` table + wiring `retriever.py`'s already-computed
   scores into it — unblocks the Chapters sidebar tab, then citations, then
   the Chat-Home book-cover decision.
4. `Agent` table, once its scope is settled — unblocks the Agent
   Instructions main tab, which doc 04 already places last.
5. Queue entity (if direction 1 is chosen) — largest single piece of new
   subsystem in this doc; do it after everything above so it isn't built
   against a still-changing `Flashcard` shape.
