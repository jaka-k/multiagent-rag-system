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
