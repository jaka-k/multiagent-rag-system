# Frontend redesign — from admin console to chat-first app

Source of truth: **claude.ai/design project "MRAG"**
(`https://claude.ai/design/p/92cbb016-2833-441e-9681-7d7bb4d94e92`). This is
a *live, working prototype* (React 18 + Babel-standalone, its own CSS design
system, mock data), not a frozen spec — re-read it via the `DesignSync` tool
before implementing each phase below in case it moved on. Key files:

| Path | Contents |
|---|---|
| `app/main.jsx` | App shell — Rail, TopNav, view router, theme/palette |
| `app/ui.jsx` | Icon set, `BookCover`, `FlashCard`, `Toggle`, `AreaTag` |
| `app/chat.jsx` | Chat home, Conversation, 3-tab sidebar (Chapters/Flashcards/Gen Bot) |
| `app/flashcards.jsx` | Flashcards main tab: loose-cards band + queue grid |
| `app/agents.jsx` | Agent Instructions main tab: extension banner + agent grid + editor |
| `app/data.js` | Mock data — shape of books/sessions/chapters/cards/queues/agents |
| `app/styles.css` | Full design-token system (colors, radii, shadows, type scale) |
| `app/tweaks-panel.jsx` | Prototyping-tool scaffold only — **not part of the product**, ignore |
| `shots/` | Exploration history (palettes, layout variants) — for context only |
| `uploads/` | The current app's own screenshots (uploaded as redesign input) |

## The headline change

This is not a reskin. The current app is an **admin console**: area dropdown
+ tabs (File Upload / Flashcards / Agent Instructions) + data tables, with
chat as one tab among others (`frontend/src/components/ui/dashboard/*`,
`chat-table.tsx`). The target is a **chat-first app shell**: a persistent
dark left rail (area switcher + visual book library), chat as the home view
with a hero launcher and a grouped session list, and every other surface
(flashcards, agents) reorganized around chapters/books rather than a table
of uploads. Expect this to touch nearly every screen and several backend
data shapes, not just CSS.

## Current state (grounded in the repo)

- Stack: Next 15 (App Router) + React 19 + TypeScript, Tailwind, shadcn-style
  wrappers over Radix primitives (`components/ui/dialog.tsx`, `popover.tsx`,
  `tabs.tsx`, `select.tsx`, `scroll-area.tsx`, `command.tsx`, `tooltip.tsx`,
  `collapsible.tsx`).
- Top-level IA: `dashboard.tsx` (area selector + tabs: File Upload,
  Flashcards, Agent Instructions) → `chat-table.tsx` (full chat list as a
  filterable data table) → `chat/[chatId]/page.tsx` (two-pane: `chat.tsx`
  thread + `console.tsx` sidebar with Documents/Flashcards/Creator tabs).
- The "Console" sidebar (`console.tsx`, `chapter-viewer.tsx`,
  `chapter-content.tsx`, `sse-pill.tsx`) is structurally the closest thing
  to the target's `ChatSidebar` — it already renders retrieved chapters and
  a reader pane, just unstyled/underbuilt (empty states in yesterday's
  screenshot sweep) and missing the Flashcards/Generation-Bot depth.
- `flashcard-creator.tsx` exists and is the natural home for the target's
  "Generation Bot" concept — a drafting assistant, not a plain form.

## Target state (grounded in the design project's code)

- **App shell** (`main.jsx`): fixed dark frame (`--shell`) wrapping a light
  content panel (`--panel`) on a soft desk background — the whole app reads
  as a floating window, not a browser page. Left `Rail` (268px): brand,
  **active-area switcher** (dot + name + book count, dropdown to switch),
  **Library** (book covers as gradient thumbnails with title/author/card
  count/indexed dot), inline "Add a book", user footer. `TopNav`: Chat /
  Flashcards / Agent Instructions tabs with icons + badges.
- **Chat Home** (`ChatHome` in `chat.jsx`): hero ("What do you want to
  learn?") + a large prompt launcher scoped to the active area, then a
  **session list grouped by Today/Yesterday/Earlier**, each row showing
  book cover, title, message/card counts, relative time. This *replaces*
  `chat-table.tsx`'s data-table entirely as the primary navigation surface.
- **Conversation** (`Conversation`, `Thread`, `Composer`): markdown prose
  with inline **citation chips** (`<ref n='1'>` → clickable marker tied to a
  retrieved chapter), callout boxes, a per-message tool row (copy / make
  cards / thumbs), composer with a `§section` context chip and a RAG
  indexed-chapter count.
- **Chat sidebar**, 3 tabs (`ChatSidebar`):
  1. **Chapters** — retrieval-result tree (chapter → subsections, each with
     a page number and a relevance %) driving an inline **whole-chapter
     reader pane** with scroll-synced active-section highlighting.
  2. **Flashcards** — cards generated *in this chat*, type filter chips,
     study/save-to-queue actions.
  3. **Generation Bot** — a distinct chat-like assistant for drafting cards:
     pick chapters/subsections to reference, set count/difficulty, get a
     draft with per-type summary chips, save or regenerate.
- **Flashcards main tab** (`flashcards.jsx`): a **loose-cards band**
  (unassigned cards in a grid, "move into a queue") above a **queue grid**
  (one card per queue: book cover, chapter, progress bar, preview of the
  next due card).
- **Agent Instructions main tab** (`agents.jsx`): a Chrome-extension status
  banner + routing settings, then a **grid of named agents** (e.g.
  "Definition Carder", "Code Example Carder") each independently toggleable
  with icon/type/model/difficulty tags, plus a sticky right-side editor
  (system-prompt textarea, `{{variable}}` chips, card-format/difficulty/
  target-queue selects, save/test-run).
- **Design tokens** (`styles.css`): named CSS custom properties (`--ink`,
  `--paper`, `--accent*`, `--r-*` radii, `--sh-*` shadows), four selectable
  accent palettes (Ember/Azure/Iris/Pine), SF Pro Display. `FlashCard` is a
  shared primitive: color-coded left accent bar by type
  (def/code/concept/cloze), tag chip, question, optional code chip, answer,
  footer with source + mini actions.

## Component-library decision

**Recommendation: keep Next + Tailwind + Radix, retheme rather than
rewrite.** Radix primitives are unstyled by design, so the existing
`Dialog`/`Popover`/`Select`/`Tabs`/`ScrollArea`/`Command` wrappers already
used for create-area, create-chat, area-selector, and the console tabs can
be retokened to match `styles.css` without discarding their accessibility
and interaction behavior. Porting is: (1) translate `styles.css`'s custom
properties into Tailwind theme extensions + a `globals.css` token layer,
(2) restyle each `components/ui/*` wrapper against those tokens, (3) rebuild
layout components (`dashboard.tsx`, `sidebar.tsx`, `top-menu.tsx`) around
the new rail/shell structure. A ground-up rewrite would throw away working
Radix accessibility wiring for no benefit — the mockup's own primitives
(dropdown menus, dialogs) are simpler than what's already built.

## Component mapping

| Current | Action | Target equivalent |
|---|---|---|
| `dashboard.tsx`, `top-menu.tsx`, `sidebar.tsx` | Rebuild | `Rail` + `TopNav` (`main.jsx`) |
| `area-selector.tsx` | Restyle in place | Rail's area-switcher dropdown |
| `file-upload.tsx`, `epub-element.tsx` | Rebuild as rail affordance | Rail's "Add a book" + book covers |
| `chat-table.tsx` | **Replace** | `ChatHome` grouped session list |
| `chat.tsx` | Restyle + extend | `Thread` + `Composer` (add citation chips, tool row) |
| `console.tsx`, `sse-pill.tsx` | Restyle + extend | `ChatSidebar` tab shell |
| `chapter-viewer.tsx`, `chapter-content.tsx` | Restyle | `SideChapters` + reader pane (closest existing match) |
| *(new)* | Build | `SideFlashcards` (chat-scoped card list + filters) |
| `flashcard-creator.tsx` | Rework | `SideGenBot` (chapter-reference picker + draft/save loop) |
| `flashcard-item.tsx`, `flashcard-list.tsx` | Restyle | `FlashCard` (type accent bar, code chip, footer actions) |
| *(new)* | Build | Flashcards main tab — loose-cards band + queue grid |
| *(new, needs backend)* | Build | Agent Instructions main tab — agent grid + editor |

## Backend / data-model gaps

These block full parity and need product decisions, not just UI work:

1. **Agent Instructions is currently one freeform string.**
   `CustomInstructionQueue.instruction` (`server/models/session.py:91`) is a
   single per-session text field. The target's agent grid needs named,
   independently-toggleable, reusable entities (icon, type, model,
   difficulty, target queue, variables) — likely a new `Agent` model scoped
   to area or user, not session. **Decide scope before building the UI**;
   building the grid against the current single-string model would mean
   throwing it away almost immediately.
2. **No chapter subsections or page numbers.** `Chapter`
   (`server/models/document.py`) has `parent_label`/`label`/`order`/
   `content` only — no fine-grained subsection anchors or page numbers like
   the mockup's "5.1 Leaders and Followers · p.152". EPUBs are reflowable
   and mostly lack real page numbers, so "page" in the mockup is likely
   presentational flourish; decide whether to (a) drop page numbers and
   show heading-based subsections only, using Markdown headings already
   produced by the EPUB→Markdown parser, or (b) fake a page estimate from
   character offset. Recommend (a).
3. **No structured citations.** `Message.content` is a plain string; the
   RAG answer has no inline markers tying a sentence to a specific
   retrieved chapter. The mockup's `<ref n='1'>` chips need the final
   answer generation (not just rerank) to emit structured citations —
   e.g. extend `RagAgent`'s answer step to a structured output with
   `{text, citations: [{chapter_id, span}]}` instead of a raw token stream,
   or a post-hoc citation-attribution pass. This is a real RAG pipeline
   change, coordinate with `docs/rag-and-embeddings-primer.md`.
4. **Queue progress (`studied`/`count`) isn't tracked.** `FlashcardQueue`
   has no review-state field. Cards sync to Anki (`Flashcard.anki_id`,
   `Deck.anki_id`) — check whether AnkiConnect can report review stats per
   card/deck to back the progress bar, or add local tracking.
5. **"Loose cards" is UI-only work** — `Flashcard.queue_id` is already
   nullable, so unassigned cards already exist at the schema level; this
   tab just needs a query and a grid.
6. **Book covers**: `Document.cover_image` exists; confirm the EPUB parser
   actually populates it. If covers are frequently missing, port the
   mockup's gradient-+-abbreviation `BookCover` as the fallback (it's
   already the *only* rendering in the mockup — no real cover images used
   there at all).

## Explicit non-goals for this rework

- **Chrome extension** ("MRAG Clipper", the "Connected" banner in
  `agents.jsx`) does not exist and is not part of this plan — the mockup
  hardcodes it as always-connected. Treat as a separate future epic if
  wanted; for now the Agent Instructions tab ships without the extension
  banner/routing-settings section, or with it visibly disabled.
- Page numbers on EPUB content (see gap #2) — ship heading-based
  subsections, not literal page numbers, unless a real pagination source
  is found.
- Multi-palette theming (Ember/Azure/Iris/Pine accent picker) — nice-to-have
  from the design tool's tweaks panel, not load-bearing; pick one accent
  for launch and revisit if there's a settings surface later.

## Phased execution plan

Ordered to ship the highest-traffic, lowest-backend-risk surfaces first,
and to not block on the `Agent` model decision (#1 above) until last.

1. **Design tokens + app shell.** Port `styles.css` tokens into Tailwind
   theme + `globals.css`. Build the dark-frame shell, `Rail` (area switcher
   + book library, no upload logic changes yet — just visual), `TopNav`.
   No data-shape changes; purely presentational + layout.
2. **Chat Home + Conversation.** Replace `chat-table.tsx` with the grouped
   session-list home view. Restyle `chat.tsx` thread/composer. Defer
   citation chips (gap #3) — ship plain prose first, layer citations in once
   the RAG pipeline change lands.
3. **Chat sidebar — Chapters tab.** Restyle `console.tsx` +
   `chapter-viewer.tsx`/`chapter-content.tsx` into `SideChapters` + reader
   pane. This is the least net-new work in the whole plan since the
   underlying components already exist.
4. **Chat sidebar — Flashcards + Generation Bot tabs.** Build
   `SideFlashcards` (new, small) and rework `flashcard-creator.tsx` into
   `SideGenBot` (bigger — chapter picker + draft loop).
5. **Flashcards main tab.** Build the loose-cards band (query on
   `queue_id IS NULL`) and the queue grid. Resolve gap #4 (progress
   tracking) here — decide Anki-sourced vs. local before building the
   progress bar, not after.
6. **Citations in Conversation.** Land the RAG pipeline change from gap #3,
   then wire citation chips into the Thread component from step 2.
7. **Agent Instructions main tab.** Blocked on the `Agent` model decision
   (gap #1). Design the model, migrate `CustomInstructionQueue` data if any
   exists, then build the agent grid + editor last.

## Open questions to resolve before/while implementing

- Are agents (step 7) scoped per-area, per-user, or global? Reusable across
  sessions, or still tied to one session's queue?
- Is queue progress worth an AnkiConnect round-trip per page load, or
  should review state be mirrored locally on each sync?
- Keep the four-palette accent picker as a real settings feature, or hardcode
  one accent (Azure, matching the current brand primary in `fetch-with-auth`
  usage patterns) and drop the picker?
