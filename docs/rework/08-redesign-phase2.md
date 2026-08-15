# Redesign phase 2 — plan

Phase 1 (the chat-first shell: docs 04/05/06 execution) merged 2026-08-14
as PRs #21–#28 — full detail in docs/CHANGELOG.md phase 7. This plan
covers what phase 1 deliberately deferred, plus the **new design work**
that landed in the MRAG design project since (`Auth.html` + `app/auth.jsx`,
new `dlg-area` shots).

## A. Auth screens (new design, ready to build)

The design project now contains complete login/register/terms screens in
the shipped shell style (Iris/charcoal, `auth-card` on the desk).
Implementation notes from reading `app/auth.jsx`:

- **Login**: email + password card. Maps onto the existing
  `/auth/token` flow; replaces the pre-redesign login page.
- **Register is gated by an 8-digit beta invite PIN** — a *new product
  feature*, not just styling. The mock hardcodes the PIN client-side;
  the real build needs server-side invite codes:
  - `InviteCode` table (code, created_by/purpose, redeemed_by,
    redeemed_at, max_uses?) + check in `/auth/register` (typed
    `UnauthorizedError`/`ConflictError` per the error rules).
  - The design's PIN input UX (8 boxes, paste support, error shake) is
    fully specified in `auth.jsx` — port as `ui/auth/pin-gate.tsx`.
- **Terms**: real five-section copy in the design (content ownership,
  fair use, generated-answer disclaimer, Anki sync, account deletion) —
  replaces the placeholder terms page. Note: section 5 promises account
  deletion/export from settings — **no settings surface exists**; either
  build a minimal one or soften the copy.
- Register/terms flow: agree-checkbox → account creation; wire to the
  existing register endpoint + auto-login.

## B. Area-creation dialog (new `dlg-area` shots)

Redesigned create-area dialog. Port from the shots; replaces the old
top-menu dialog (currently still the pre-redesign Radix dialog). Wire the
"New area" affordance into the rail's area menu (`area-menu-foot` styles
already shipped in mrag.css).

## C. Gated on a working GOOGLE_API_KEY

The last rotation is rejected by Google (401 ACCESS_TOKEN_TYPE_UNSUPPORTED
from any process). After the next rotation, in order:

1. **Happy-path re-smoke** (doc 03's checklist: one embedding, one chat
   turn, one EPUB upload) — also validates google-genai 2.18.1 (#26).
2. **Citations** (old doc 04 phase 6): answer generation emits structured
   citations keyed to chapter_ids; `MessageRetrieval` (shipped) is the
   backing store; render `<ref>` chips in `MessageRow` that open the
   shipped `ChapterReader`.
3. **GenBot**: rework the sidebar Creator tab into the design's drafting
   assistant (chapter-reference picker backed by `MessageRetrieval` +
   chapter tree; count/difficulty; draft → save to the session queue).
4. **Agents into the pipeline**: the generation flow reads the area's
   active `Agent` rows (system_prompt, card_type, difficulty) instead of
   the hardcoded templates; card_type lands on created cards (needs D).
5. Doc 06 step 6: review-state prompt variables ({{mastered_concepts}},
   {{lapsed_cards}}) for agents.

## D. Leftover schema from the old doc 05 (all additive)

- `Flashcard.card_type` (def|code|concept|cloze) — set by the generating
  agent; the UI currently approximates types from topic tags.
- `Flashcard.question/answer/code_snippet` — structured fields as source
  of truth; Anki HTML generated from them at export (decouples the web
  UI from Anki templates).
- `Flashcard.origin` (chat|clip|manual) + `source_url` — clipper-ready
  provenance (the loose-cards band is the clipper's landing zone).
- Resolved for the record: queues stay 1:1 with sessions; agents are
  per-area; session covers derive from the area (no Session.document_id).

## E. Reader (doc 07 — separate plan, still current)

ChapterHtml lazy blob + sanitized HTML + base64 images; sidebar reader
upgrade; dedicated reading view awaiting the designer's answer to the
brief in `feedback/design-gaps.md`.

## F. Still open with the designer

- Full-page reading experience (the doc 07 brief).
- Error-bubble design for in-thread typed errors (code + step + retry).
- Mobile/responsive behavior of the shell.
- Settings surface (now load-bearing: the designed terms copy promises
  account deletion/export).

## Suggested order

1. **A + B now** (no key needed): invite-code backend + auth screens +
   area dialog — small, self-contained, ships the new design work.
2. **Key rotation** → C1 smoke, then C2–C4 as separate PRs (citations,
   GenBot, agents) with D's schema landing alongside C4.
3. **E** whenever the designer responds (or sidebar-only first).
