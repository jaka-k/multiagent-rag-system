# Rework plans

Actionable follow-up plans distilled from the August 2026 audit of the repo
(post pgvector/PGVectorStore migration, PRs #10 and #12). Each document stands
alone: findings first, then a concrete, ordered plan.

| Doc | Topic | Effort |
|---|---|---|
| [01-dependency-upgrades.md](01-dependency-upgrades.md) | Backend/frontend version bumps + repo hygiene | 1–2 sessions, tiered |
| [02-embedding-export-import.md](02-embedding-export-import.md) | Scripts to export/import embeddings per book or area | ~1 session |
| [03-python-3.14-upgrade.md](03-python-3.14-upgrade.md) | Align Python at 3.14 everywhere (prod runs 3.12 today) | ~half a session |

Recommended order: **03 → 01 → 02**. The Python bump first, so the dependency
upgrades in 01 are resolved once against the final interpreter; 02 is
independent and can happen anytime after the `book_embeddings` table lands
(PR #12).
