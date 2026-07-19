# AI Workflow Rules

## Approach

Build this project incrementally using a spec-driven workflow.
The `context/` files define what to build, how to build it, and
the current state of progress — implement against them, don't
infer or invent behavior from scratch. When something isn't
settled yet (real-time strategy, scoring formula, leaderboard
scope, storage decisions, visualization approach at scale), it
gets resolved through discussion — and, for genuine forks, an
explicit choice between named options — before it's written into
a context file or implemented. That's been the working pattern
for every non-trivial decision so far; keep using it rather than
guessing product behavior to keep momentum.

## Scoping Rules

- Work on one feature unit at a time (e.g. the theme toggle, or
  the leaderboard row component — not both interleaved)
- Prefer small, verifiable increments over large speculative
  changes
- Do not combine unrelated system boundaries in a single
  implementation step (e.g. don't mix `/api/leaderboard`'s
  fetch/aggregation logic with leaderboard UI styling in one
  change)

## When to Split Work

Split an implementation step if it combines:

- UI changes and data-fetching/aggregation logic changes
- Multiple unrelated routes or components
- Behavior not clearly defined in the context files (e.g. the
  still-open all-projects visualization question in
  `progress-tracker.md`)

If a change cannot be verified end to end quickly, the scope is
too broad — split it.

## Handling Missing Requirements

- Do not invent product behavior not defined in the context
  files
- If a requirement is ambiguous, resolve it through discussion
  (offering concrete named options where the ambiguity is a
  real fork) before implementing or finalizing the relevant
  context file
- If a requirement is missing, add it as an open question in
  `progress-tracker.md` before continuing

## Protected Files

Do not modify the following unless explicitly instructed:

- `components/ui/*` — shadcn/Base UI-generated components;
  regenerate via `npx shadcn add` instead of hand-editing
- Any third-party library internals (e.g.
  `node_modules/shadcn/dist/tailwind.css`)

## Keeping Docs in Sync

Update the relevant context file whenever implementation
changes:

- System architecture or boundaries
- Storage model decisions
- Code conventions or standards
- Feature scope

This includes recording decisions discovered mid-implementation
that weren't anticipated when a doc was first drafted (e.g. the
shadcn CLI's actual behavior, or a scope addition like the
project standings leaderboard) — don't let the docs drift from
what's actually true.

## Before Moving to the Next Unit

1. The current unit works end to end within its defined scope
2. No invariant defined in `architecture.md` was violated
3. `progress-tracker.md` reflects the completed work
4. `npx next build` passes
