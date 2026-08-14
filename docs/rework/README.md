# Rework plans

Actionable follow-up plans distilled from the August 2026 audit of the repo
(post pgvector/PGVectorStore migration, PRs #10 and #12). Each document stands
alone: findings first, then a concrete, ordered plan.

| Doc | Topic | Effort |
|---|---|---|
| [01-dependency-upgrades.md](01-dependency-upgrades.md) | Version bumps + hygiene | **Tiers 1–2 done** (#14/#15/#18); Tier 3 open |
| [02-embedding-export-import.md](02-embedding-export-import.md) | Export/import embeddings per book or area | **Done** (#17) |
| [03-python-3.14-upgrade.md](03-python-3.14-upgrade.md) | Python 3.14 everywhere | **Done** (#14) |
| [04-frontend-redesign.md](04-frontend-redesign.md) | Chat-first app-shell redesign, modeled on the claude.ai/design "MRAG" project | Multi-phase, the largest item here |
| [05-data-model-migration.md](05-data-model-migration.md) | Backend schema changes needed to support 04, section by section — **proposal, pending discussion** | Feeds into 04's phases |
| [06-anki-pull-sync.md](06-anki-pull-sync.md) | Anki review-state pull-sync | **Steps 1–5 done** (#16/#19/#22); agent variables later |
| [07-epub-html-reader.md](07-epub-html-reader.md) | Store chapter HTML (lazy 1:1 blob) for a real book reader | Planned 2026-08-14; design requested |

Recommended order: **03 → 01 → 02**, independently of **04 + 05** (the
frontend redesign and its data-model prerequisites). The Python bump first,
so the dependency upgrades in 01 are resolved once against the final
interpreter; 02 is independent and can happen anytime after the
`book_embeddings` table lands (PR #12). 04 is the biggest single effort and
has its own internal phasing; 05 is not yet approved schema — several of its
sections end in an open decision rather than a change, and nothing in it
should become a migration until that decision is made.
