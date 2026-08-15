# Dependency upgrades & hygiene — remaining items

Trimmed 2026-08-15. Executed history (Tiers 1–2, websockets 16.1,
markdownify 1.2.3, google-genai 2.18.1, Makefile/Anki/ESLint hygiene)
lives in docs/CHANGELOG.md phases 6–7.

- [ ] **firebase-admin 6 → 7**. Touches auth + the EPUB downloader; not
      forced by anything. Verify with one EPUB upload (Firebase Storage
      download path) after bumping.
- [ ] **pgvector client** — blocked upstream: all langchain-postgres
      releases (≤0.0.17) cap pgvector <0.4, and 0.3.6 is the last 0.3.x.
      Recheck with any future langchain-postgres release.
- [ ] **websockets 17** — capped by google-genai (<17 as of 2.18.1);
      recheck on SDK bumps.
- [ ] Tooling: black 24 → 26, pytest 8 → 9 (a test suite is still the
      real gap — nothing exists to run).
- [ ] `make docker-dev` full-stack rebuild verification on the 3.14 image.
- [ ] otel 1.44 vs collector image handshake check under `make monitor`.
- [ ] Dependabot triage: 69 open on master (1 critical) after the wave,
      down from 117.
- [ ] Prune merged remote branches.
