# Anki pull-sync — review state flows back into the app

> **Steps 1–4 executed 2026-08-08/09** (PRs #16 and #19): async client,
> AnkiCardState/AnkiSyncRun mirror, watermark pull, manual trigger +
> optional loop. E2E-verified against the live container; AnkiWeb
> credentials confirmed working. Bonus fix: the mrag-minimal template
> deck-override was sending every pushed card to Default — cards are now
> moved to the intended deck explicitly. Step 5 (UI consumers) done 2026-08-14:
> queue progress bars, mastered badges, and live In-progress/Mastered
> filters, verified end-to-end with answerCards-simulated reviews.
> Remaining: step 6 (agent prompt variables) later.

Today the Anki integration is **push-only**: area → `createDeck`
(`RAG::{label}`), card → `addNote` + `sync()`, and the returned note id is
stored on `Flashcard.anki_id` (`server/service/anki/anki_service.py`,
`routers/flashcards.py:65-69`). Nothing ever reads back. All actual
studying happens in Anki (desktop/mobile via AnkiWeb sync through the
containerized Anki), so the app is blind to the most interesting data it
generates: what the user has learned.

Pulling that state back is what powers the redesign's "next level"
surfaces — and several of them are already drawn in the MRAG design
project:

- Queue-grid **progress bars** (`studied / count`, doc 05's open question)
- The Flashcards view's **"In progress" / "Mastered" filter chips**
  (`flashcards.jsx` — currently unanswerable from our DB)
- **Due counts** as badges (TopNav, queue cards)
- Longer-term: generation agents that *know the review history* — skip
  concepts already mastered, bias toward lapsed cards, suggest "you
  struggled with §5.2, want more cards on it?"

## What AnkiConnect gives us (v6)

| Action | Returns | Use |
|---|---|---|
| `findCards(query)` | card ids for e.g. `deck:RAG::golang` or `nid:<note_id>` | map our note ids → card ids; enumerate a deck |
| `cardsInfo(cards)` | per card: `due`, `interval`, `reps`, `lapses`, `queue`, `type`, `factor` (ease), `mod` | the core scheduling snapshot |
| `getReviewsOfCards(cards)` | full review log per card (timestamp, ease, interval…) | history, streaks, "struggled with" signals |
| `getLatestReviewID(deck)` | monotonically increasing id of the newest review | **incremental-sync watermark** — skip pulls when nothing changed |
| `cardsModTime(cards)` | last-modified per card | cheap change detection for snapshot fields |
| `getDeckStats(decks)` | aggregate new/learn/due counts per deck | badges without per-card fan-out |
| `deleteNotes` / absence from `findCards` | — | detect cards the user deleted in Anki |

One mapping subtlety: `Flashcard.anki_id` is a **note** id; review state
lives on **cards**. With the `mrag-minimal` Front/Back model each note has
exactly one card, so `findCards("nid:X")[0]` resolves it — but store the
resolved card id (`anki_card_id`) rather than re-deriving on every sync.

## Ownership rule (decide once, apply everywhere)

**MRAG owns content; Anki owns scheduling.** Card text edited in MRAG wins
on push (updateNoteFields); review/scheduling state pulled from Anki wins
on read. Never write scheduling to Anki; never overwrite local
question/answer from Anki's fields. This keeps the sync one-directional per
data-axis and eliminates whole classes of conflict logic. (If the user
edits card *text* inside Anki, that drift is detected via `notesInfo` mod
times and surfaced as a "modified in Anki" flag — resolved manually, not
auto-merged. Rare enough not to over-engineer.)

## Schema

Keep sync-state separate from authored content — a new 1:1 table rather
than widening `Flashcard` (which doc 05 is already widening for other
reasons):

```
AnkiCardState                       # 1:1 with Flashcard, created on first pull
  flashcard_id: UUID (pk, fk -> flashcard.id)
  anki_card_id: str                 # resolved card id (note id stays on Flashcard)
  reps: int                         # total reviews
  lapses: int
  interval_days: int
  ease_factor: int                  # Anki's `factor`, e.g. 2500
  due_at: Optional[datetime]
  last_reviewed_at: Optional[datetime]
  queue: str                        # new | learning | review | suspended | buried
  is_deleted_in_anki: bool = False  # disappeared from findCards
  is_modified_in_anki: bool = False # note text drift, surfaced not auto-merged
  synced_at: datetime

AnkiSyncRun                         # bookkeeping, one row per sync execution
  id: UUID (pk)
  deck_id: UUID (fk -> deck.id)
  started_at / completed_at: datetime
  latest_review_id: int             # watermark from getLatestReviewID
  cards_updated: int
  status: str                       # ok | partial | failed
  error: Optional[str]
```

Derived, not stored: **"mastered"** = e.g. `interval_days >= 21 and
lapses' recent rate low` (tune later); **queue progress** `studied` =
count of cards with `reps > 0`. Both computable from `AnkiCardState` with
plain queries — matches the mockup's filters without inventing state.

## Sync mechanism

**Polling, because AnkiConnect has no push/webhooks.** Three triggers,
one code path:

1. **Watermark check (cheap, frequent).** Per deck:
   `getLatestReviewID(deck)` vs. `AnkiSyncRun.latest_review_id`. Equal →
   done, one HTTP call, no fan-out. This is the reason full polling stays
   affordable.
2. **On-view refresh.** Opening the Flashcards tab (or a queue) fires the
   watermark check for that area's deck, debounced (e.g. ≥60s since last
   run) so browsing doesn't hammer the container.
3. **Periodic background task.** An asyncio task started from the FastAPI
   lifespan (same place Firebase init lives), looping every ~10 min over
   decks with a watermark check each. No APScheduler/celery needed at this
   scale — one user, a handful of decks.

When the watermark moved, the actual pull per deck:
`findCards(deck:...)` → diff against known `anki_card_id`s (absences →
`is_deleted_in_anki`) → `cardsInfo` in one batched call for changed cards
(use `cardsModTime` to trim the set) → upsert `AnkiCardState` rows →
record the new watermark in `AnkiSyncRun`.

## Prerequisite fixes in the existing Anki layer (do these first)

Found while reading the current code — all three predate this feature but
block it from being built cleanly:

1. **`invoke()` is blocking urllib inside async handlers**
   (`anki/config.py:17-22` called from async routes). Fine-ish for one
   `addNote`; not fine for a periodic sync loop doing batched pulls inside
   the event loop. Port to `httpx.AsyncClient` (or wrap in
   `asyncio.to_thread`) as step zero — this also fixes the current routes.
2. **`AnkiService.__init__` calls `createDeck` as a side effect** — you
   cannot construct the service to *read* without potentially creating a
   deck. Split into a thin stateless client (invoke wrapper + typed
   actions) and keep deck-creation an explicit call. The sync worker uses
   the client only.
3. **`sync()` (AnkiWeb sync) runs after every single `addNote`**
   (`routers/flashcards.py:67`) — a full AnkiWeb round-trip per card, and
   a failure mid-batch leaves cards in Anki but errors the request. Batch:
   add all notes, then one `sync()`. Also gives the pull-sync a consistent
   view. Pull-sync itself should likewise trigger `sync()` once *before*
   reading, so review state done on mobile (→ AnkiWeb) is visible to the
   containerized Anki it reads from — without this, the pull only sees
   reviews done in the container's own UI, which is nearly none of them.

That third point is worth restating because it's the crux of the whole
feature: **the container's Anki is not where the user studies.** Reviews
happen on phone/desktop and reach AnkiWeb; the container only learns about
them after an AnkiWeb `sync()`. So every pull is really:
`sync()` (pull AnkiWeb → container) → read via AnkiConnect → upsert DB.
AnkiWeb sync needs credentials configured in the container's Anki profile
— verify that's true in the current image (the `sync` action is already
called today, so presumably yes, but confirm before building on it).

## Execution order

1. Anki-layer refactor (async client, service split, batch-then-sync) —
   independently valuable, ship as its own PR.
2. `AnkiCardState` + `AnkiSyncRun` migration; backfill `anki_card_id` for
   existing cards via `findCards("nid:...")`.
3. Pull path + watermark logic behind a manual trigger endpoint
   (`POST /api/anki/sync/{area_id}`) — testable end-to-end before any
   automation.
4. Lifespan background loop + on-view debounced trigger.
5. Wire the consumers: queue progress bars, In-progress/Mastered filters,
   due badges (this is where doc 05's progress-bar open question gets its
   answer: **local mirror, refreshed by this sync** — not live
   AnkiConnect calls at render time).
6. Later, once data has accumulated: expose review signals to the
   generation agents ({{mastered_concepts}}, {{lapsed_cards}} as prompt
   variables — ties into doc 05's `Agent.variables`).

## Relationship to the other rework docs

- Answers doc 05's open question on queue progress (option (a), local
  mirror — the live-query option (b) dies on the AnkiWeb-sync latency
  described above).
- Independent of the queue redefinition decision: `AnkiCardState` hangs
  off `Flashcard`, so it works under either queue direction.
- The mockup's "Mastered" filter chip (`flashcards.jsx`) becomes real at
  step 5.
