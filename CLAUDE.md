# Project instructions

## Code comments

Don't clutter code with long comments. Write descriptive code (good names,
small functions) and add short explanations only where the code can't speak
for itself — a non-obvious constraint, an external quirk, a deliberate
trade-off. One line is the norm; multi-paragraph comment blocks are not
welcome in code. Longer rationale belongs in the PR description or
`docs/`, not inline.

## Changelog discipline

`docs/CHANGELOG.md` tracks everything since v1.0. When completing a
meaningful unit of work (a PR's worth), add it to the Unreleased section
in the same commit or the same session — don't let it accumulate. Promote
Unreleased items to a numbered phase heading when their PRs merge.

## API endpoint authorization

Every endpoint derives identity from the auth token
(`Depends(get_current_active_user)`) — never from a client-supplied user
id. Any resource referenced by id (area, session, agent, flashcard,
document, …) must be verified to belong to the caller by walking its
ownership chain up to `user_id`; return 404 (not 403) on foreign
resources so ids don't leak existence. No unauthenticated data
endpoints.

## Frontend composition

Views compose; they don't implement. Reuse existing components
(`components/ui/*`) and extract new sub-components instead of growing a
view file. All API access goes through `lib/fetchers/*` — never inline
`fetchWithAuth` calls or response-shape types in components. Shared
types live in `types/types.d.ts`, shared helpers in `lib/`. A reader of
a view file should see structure, not plumbing.

## Error handling

All application errors go through the centralized polymorphic hierarchy
in `server/core/exceptions.py` (`AppError` subclasses with a five-digit
`code` and `step`; HTTP status derives from the code). Never raise ad-hoc
`HTTPException`s with inline status codes/messages in routers or
services — add or reuse a typed subclass. Codes are append-only.
