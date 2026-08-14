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
