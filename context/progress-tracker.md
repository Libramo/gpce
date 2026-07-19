# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- **Live and running end-to-end** as of 2026-07-16. Wired up to
  both real mobile app endpoints: `GET /evaluations`
  (`EVALUATIONS_API_URL`) for the leaderboard data, `GET /health`
  (`HEALTH_API_URL`) for the live juror/project roster size. Full
  three-tab dashboard (Progression des jurés, Classement des
  projets, Complétion des projets), click-through detail dialogs,
  activity ticker, completion KPI, criteria/composition stats,
  celebration toasts. Scroll model (sidebar `sticky`, tabs
  `sticky`, page scrolls normally) was debugged through several
  iterations this session and is now confirmed working. User has
  tested against the real live session in a browser (not just
  `next build`) multiple times this session, including watching
  celebrations fire and the sticky sidebar behave correctly.
  Both polling routes now support ETag/304 conditional requests
  (Vercel bandwidth optimization, see Completed below), verified
  end-to-end against a running server, not just type-checked.
  `npx next build` passes as of the last change.

## Current Goal

- No active implementation goal. Next session should start by
  reading this file's "Next Up" and "Open Questions" sections
  below, which are kept current.

## Completed

- project-overview.md drafted, including the French-content /
  English-docs language convention (mirrors the mobile app)
- architecture.md drafted (stack, folder boundaries, storage
  model, invariants)
- ui-context.md drafted (theme, colors, typography, radius,
  layout patterns, animation conventions)
- app/globals.css carries the real theme tokens (light + dark,
  oklch, blue primary)
- shadcn initialized by the user directly (`components.json`,
  `lib/utils.ts`, `components/ui/button.tsx`) — CLI v4.x, uses
  **Base UI** (`@base-ui/react`) as its primitive engine, not
  Radix; preset `base-nova`. This overwrote globals.css with
  its own neutral theme once; reconciled back to the custom
  blue OKLCH theme — see the shadcn CLI note in memory if
  running `shadcn init`/`add` again.
- app/layout.tsx loads Inter / JetBrains Mono / Source Serif 4
  via next/font/google, wraps children in next-themes'
  ThemeProvider (`defaultTheme="dark"`, `enableSystem={false}`),
  `lang="fr"`
- components/theme-toggle.tsx — animated dark/light toggle
  using the View Transitions API (circle-reveal) + Motion for
  the sun/moon icon rotation; trimmed from a user-provided
  reference component (dropped the gif/polygon/rectangle
  variant picker and demo options panel — not needed here)
- app/page.tsx — placeholder home page (French text, renders
  the theme toggle) — user tested locally via `npm run dev`,
  confirmed working (2026-07-16)

## In Progress

- None yet.

## Next Up

- **Decided, not built (2026-07-16)**: if/when the mobile app adds
  `POST /jurors` and `POST /projects` to let organizers add a juror
  or project mid-session, that admin UI belongs **in the mobile
  app**, not here — it already owns the roster as source of truth,
  and this tracker is documented read-only (architecture.md
  invariant #1). Adding a proxied `POST` here would mean reversing
  that invariant and adding real auth (this dashboard is public/
  unauthenticated — an unauthenticated write endpoint would let
  anyone with the URL corrupt the roster). No action needed on this
  repo either way: once the mobile app can add jurors/projects, this
  tracker picks them up automatically within 30s via the existing
  `/api/session-info` polling — that's the whole point of having
  built it live instead of hardcoded.
- Juror `total` (assigned project count — now the *live*
  `projectCount` from `/api/session-info`, see Completed below,
  not a hardcoded 200) still assumes every juror evaluates every
  project. That assumption needs confirming against the mobile
  app's actual assignment model — the real session so far only has
  9 of 12 jurors active and 91 total evaluations, too early to
  tell from data alone.
- The document-missing semantics are still inferred, not
  confirmed: real records show `documentIdentity`/
  `documentBulletin3`/`documentMotivationLetter` as `null` far
  more often than `boolean` in the current live session (small
  sample so far). `deriveWorstDocumentGap` only treats an explicit
  `false` as "confirmed missing" and ignores `null` — keep
  watching as more real evaluations come in to see if `false`
  actually gets used
- No retry/backoff tuning on SWR beyond its defaults — worth
  revisiting once this runs unattended for a full multi-hour
  session (Vercel cold starts, upstream hiccups, etc.)

## Completed (continued)

- Real dashboard UI, now built on a proper mock **evaluation
  stream** (not just pre-aggregated fake numbers) so the
  derivation logic mirrors what the real API route will need:
  `lib/evaluation-types.ts` (`Evaluation` — juror/project/
  eligibility/scores/timestamp, matching the mobile app's
  `GET /evaluations` shape), `lib/mock-evaluations.ts`
  (seeding, per-tick generation, and derive* functions for
  juror progress / project standings / session stats / last
  evaluation / evaluator count)
- Rich live-feel widgets, all deriving from that one stream:
  `components/leaderboard/activity-ticker.tsx` (big flashing
  "J7 vient de noter P042" banner — score intentionally
  omitted, redundant with the leaderboard), `completion-kpi.tsx`
  (submitted/expected count + %), `stat-tiles.tsx` (pace per
  minute, ineligibility count), `project-complete-toast.tsx`
  (self-dismissing celebration banner when a project reaches
  all 12 juror evaluations)
- `leaderboard-bar.tsx`, `dashboard.tsx`, and `app/page.tsx`
  resized/restructured for projector readability — see the new
  Projection/Readability section in `ui-context.md`: bigger
  text throughout, `h-screen overflow-hidden` at the root so
  the page never scrolls, a two-column layout (KPI/stats
  sidebar beside the leaderboard, not stacked above it) so
  everything fits without scrolling on a landscape display, and
  the leaderboard row list scrolls in its own bounded region if
  it's too long
- Random mock data is seeded in a `useEffect` (client-only),
  not in `useState`'s initializer — avoids a hydration mismatch
  from `Math.random()` differing between SSR and client render
- `npx next build` passes

## Completed (continued 2)

- Visual redesign after user feedback that v1 looked flat/plain:
  fixed a real layout bug (leaderboard column had `max-w-4xl`
  with no `mx-auto`, so it sat flush-left under a
  flexbox-centered tab pill), fixed juror bars being scaled
  against a 200-project ceiling (made them look permanently
  near-empty) by rescaling every bar to the current leader
  instead — the standard bar-chart-race convention. Added a
  shared frosted-glass surface (`glassPanel` in `lib/utils.ts`),
  an ambient animated background (`components/ambient-background.tsx`,
  slow-drifting blurred glow, extracted as its own client
  component since `app/page.tsx` stays a Server Component),
  animated count-up on the completion KPI (`useSpring` +
  `useTransform`), and real podium tiers (top 3 get
  tiered glow, not just rank 1).
- `lib/evaluation-types.ts` and `lib/mock-evaluations.ts`
  rewritten to match the **real** `GET /evaluations` record
  shape the user pasted from actual API output (see Session
  Notes) — field names, per-criterion fields instead of a
  generic scores array, the 3 separate document fields, and
  `createdAt`/`updatedAt` both present. The mock's `tick()` now
  sometimes edits an existing record in place (same `id`, new
  `updatedAt`) instead of only ever adding new pairs, so the
  "just edited" ticker wording and `isEdit()` actually get
  exercised.
- New widgets, all from real-schema fields:
  `criteria-breakdown.tsx` (per-criterion average, 5 mini bars),
  `composition-stats.tsx` (individual/group split +
  worst-missing-document stat). `activity-ticker.tsx` now says
  "a modifié son évaluation de X" when `updatedAt !== createdAt`
  instead of treating every change as a fresh submission.
- Decision: the free-text `recommendation` field is never shown
  on the public display — confirmed with the user, not an
  oversight.
- `pickNextPair` in `lib/mock-evaluations.ts` reworked from
  uniform-random to "nearest to completion, weighted toward the
  10 displayed projects" — uniform-random across 200 projects
  meant a displayed project reaching all 12 juror evaluations
  (the celebration toast's trigger condition) was rare within a
  short demo.
- First attempt at seeding one displayed project at 11/12 still
  didn't produce a visible celebration for the user — rather
  than keep guessing, seeded 8 of the 10 displayed projects at
  11/12 (varied missing juror per project) so completions should
  fire within seconds, repeatedly, not depend on one lucky pick.
  Also fixed a related correctness bug found while investigating:
  the completion-detection effect in `dashboard.tsx` didn't
  distinguish edits from fresh submissions, so an edit touching
  an already-completed project's evaluation would re-trigger its
  celebration. Now gated on `!isEdit(latest)`.
  Resolved: it was a stale dev server/browser, not a code bug —
  confirmed working once reloaded fresh.
- `npx next build` passes
- Found and fixed a real gap after the 8-project seed burst: once every
  displayed project reached 12/12, there was nothing left on screen to
  complete, so the celebration toast correctly went silent for the rest
  of the session — a one-time burst, not an ongoing demo. Added
  `recycleADisplayedProjectIfAllComplete` (mock-only, clearly commented
  as such) that resets one displayed project back to 11/12 once the
  whole board is maxed out, so there's always something in the pipeline
  and the celebration loop keeps going indefinitely. Side effect: the
  affected juror's completion count can briefly tick backward by one
  when this fires — self-corrects within a few ticks, acceptable for
  mock scaffolding that goes away once real data replaces the sim.

## Completed (continued 3)

- Third leaderboard tab: **Project Completion** — persistent
  juror-coverage progress per displayed project
  (`deriveCompletionProgress` in `lib/mock-evaluations.ts`,
  `components/leaderboard/completion-board.tsx`), reusing
  `LeaderboardBar` but scaled against the real ceiling of 12
  jurors (not leader-relative, since "complete" is a real
  achievable state here). Deliberately paired with the
  celebration toast — toast is "it just happened," this tab is
  "check anytime."
- Tab switcher replaced with `FluidTabs`
  (`components/leaderboard/fluid-tabs.tsx`), adapted from a
  user-provided reference component: sliding active-pill
  indicator via Motion's shared `layoutId` instead of an instant
  color swap. Swapped the reference's `react-icons` for
  `lucide-react` (already the project's icon library) and its
  hardcoded cream/neutral hex colors for real theme tokens.
- `npx next build` passes

## Completed (continued 4)

- **Resolved the long-open all-projects visualization question**:
  `ProjectBoard` and `CompletionBoard` now cover all 200 projects
  (`deriveProjectStandings`/`deriveCompletionProgress` changed
  from the old 10-project `DISPLAYED_PROJECT_CODES` cap to the
  full `PROJECT_CODES`), with a search bar
  (`components/leaderboard/board-search.tsx`) filtering by code
  and a render cap (30 rows) applied *after* ranking so a search
  hit still shows its true rank, not its position within the
  filtered subset. `JurorBoard` stays uncapped/unsearched — 12
  rows fits fine as-is.
  `SPOTLIGHT_PROJECT_CODES` (renamed from `DISPLAYED_PROJECT_CODES`)
  still exists in `lib/mock-evaluations.ts` but now means
  something different: which 10 projects the *simulation* biases
  activity toward for pacing/celebration purposes, not which
  projects the UI is allowed to show.
- **Rows are now clickable**, opening a `Dialog`
  (`components/ui/dialog.tsx`, hand-built on `@base-ui/react/dialog`
  since the shadcn CLI wasn't re-run — see the CLI caution in
  memory) with different content per tab:
  - Progression des jurés → `juror-detail-content.tsx`: every
    project that juror scored, with total shown inline and
    per-criterion breakdown one click away (an expand toggle per
    row), plus their overall average at the top. Below that, a
    collapsed-by-default "N projet(s) restant(s)" section — the
    projects that juror hasn't scored yet — with its own search
    (reuses `BoardSearch`) since that list can be ~190 items;
    added after the user asked for it explicitly. `PROJECT_CODES`
    exported from `lib/mock-evaluations.ts` to support this.
  - Classement des projets → `project-scores-content.tsx`: the
    average (disaggregated) plus each juror's individual score
    for that project
  - Complétion des projets → `project-coverage-content.tsx`:
    simple coverage grid — which of the 12 jurors have evaluated
    this project and which haven't, no scores (matches what that
    tab is actually about)
  New data getters: `getEvaluationsForProject`,
  `getEvaluationsForJuror` (now in `lib/evaluation-aggregate.ts`
  after the real-data split below).
- `npx next build` passes, including type-checking against
  `@base-ui/react`'s own Dialog types — a decent signal the
  unfamiliar API (`Dialog.Root`/`Portal`/`Backdrop`/`Popup`,
  `data-open`/`data-closed` state attributes rather than Radix's
  `data-state="open"`) was used correctly, though not yet
  verified in an actual running browser this session.

## Completed (continued 5)

- **Wired up to the real mobile app API**, replacing the mock
  simulation as the live data source:
  - `EVALUATIONS_API_URL=https://gpce.expo.app/evaluations` in
    `.env.local` (gitignored) / `.env.example` (committed
    template)
  - `lib/evaluation-validate.ts` — boundary validation of the
    upstream response; drops malformed records rather than
    crashing the whole response; handles both a bare array and
    `{ evaluations: [...] }` (the real shape)
  - `app/api/leaderboard/route.ts` — the only place that calls the
    mobile API; `cache: "no-store"`, clean French error messages
    (500 if `EVALUATIONS_API_URL` unset, 502 if upstream
    unreachable/non-OK/invalid JSON)
  - Split `lib/mock-evaluations.ts`: real, reusable aggregation
    logic moved to **`lib/evaluation-aggregate.ts`** (all the
    `derive*` functions, `JUROR_CODES`/`PROJECT_CODES`,
    `scoreTotal`, `isEdit`, `lastTouched`, `evaluatorCount`, the
    `getEvaluationsFor*` getters); `mock-evaluations.ts` now holds
    only simulation-specific code (`createEvaluation`,
    `seedInitialEvaluations`, `tick`, spotlight/recycle logic) and
    imports shared pieces from the new module. Every component
    that imported aggregate functions from `mock-evaluations.ts`
    was repointed to `evaluation-aggregate.ts`.
  - `Dashboard` rewritten: `useSWR("/api/leaderboard", ...,
    { refreshInterval: 3000 })` replaces the local
    `seedInitialEvaluations`/`tick`/`setInterval` simulation
    entirely. Added a real error state (red banner + message,
    distinct from the loading state) rather than silently falling
    back to blank/fake data on failure — important for a display
    a jury room is actually trusting.
- **Two real bugs found by testing against the actual live
  payload** (not just the schema, the running data) — both would
  have silently broken the app:
  1. `PROJECT_CODES` assumed zero-padded codes ("P001"); real
     codes are **not** zero-padded ("P13", "P7", "P200"). Every
     aggregate lookup would have missed every real evaluation.
     Fixed in `lib/evaluation-aggregate.ts`; added
     `compareProjectCodes` for correct numeric (not lexicographic)
     sort ordering now that codes aren't zero-padded.
  2. `isEdit` compared `updatedAt !== createdAt` for exact string
     equality. Real data confirmed the mobile app writes these two
     fields in separate steps — even a fresh submission typically
     has tens of milliseconds of drift (sometimes `updatedAt`
     lands *before* `createdAt`). This made the ticker say "a
     modifié son évaluation" for every single submission, not just
     real edits. Fixed with a 1000ms threshold instead of exact
     equality; verified against the real payload: 88/91 records
     correctly read as fresh, 3 as genuine edits (22.8s, 90.3s,
     and a ~46.5-hour gap matching the `P200` example from
     earlier).
  - Both bugs were caught by actually downloading and inspecting
    the real payload (`curl` + a `node -e` script against it), not
    by reasoning about the schema alone — worth repeating this
    kind of direct data check for any future integration, not just
    trusting a hand-written validator's types.
- `npx next build` passes; `/api/leaderboard` confirmed dynamic
  (server-rendered per request, not statically cached) per the
  build output.

## Completed (continued 6)

- **Juror/project roster is now live, not hardcoded** — the mobile
  app turned out to expose a `GET /health` endpoint
  (`{"jurorCount":"12","projectCount":"200"}`, note: **strings**,
  not numbers) that this app didn't know about until the user
  found it. Added:
  - `lib/session-info-validate.ts` — parses/validates the
    string-to-number counts, returns `null` (not a throw or a
    silent NaN) if unusable
  - `app/api/session-info/route.ts` — proxies `HEALTH_API_URL`,
    same error-handling shape as `/api/leaderboard`
  - `Dashboard` polls it every 30s (roster changes are occasional,
    not continuous like evaluations — no need for a 3s interval)
    and threads `jurorCount`/`projectCount`/`jurorCodes`/
    `projectCodes` down to every consumer as props/params instead
    of them reading a module constant
  - `lib/evaluation-aggregate.ts` refactored: `JUROR_COUNT`/
    `PROJECT_COUNT`/`JUROR_CODES`/`PROJECT_CODES` module constants
    replaced with `DEFAULT_JUROR_COUNT`/`DEFAULT_PROJECT_COUNT`
    (fallback only) and `generateJurorCodes(count)`/
    `generateProjectCodes(count)` functions; every `derive*`
    function that used to read the module constant now takes
    `jurorCodes`/`projectCodes`/`jurorCount`/`projectCount` as
    parameters. `completion-board.tsx`, `project-coverage-content.tsx`,
    `juror-detail-content.tsx` updated to receive these as props
    instead of importing the (now-removed) constants.
  - This directly answers "what if a juror joins or a project is
    added mid-session": the tracker adapts automatically within
    30s, no env var edit, no redeploy. A settings UI requiring a
    rebuild was considered and explicitly rejected as the wrong
    shape for this, once a live endpoint turned out to exist.
- `npx next build` passes; `/api/session-info` confirmed dynamic.

## Completed (continued 7)

- **ETag/304 conditional requests on both polling routes** — the
  user asked about Vercel cost at a 3s poll interval; real numbers
  (Hobby plan: 1M invocations/mo — a non-issue; 100GB/mo fast data
  transfer — the actual constraint) showed a maxed-out session
  (2400 evaluations, ~950KB/response at ~404 bytes/record measured
  from the real payload) polled every 3s by one continuously-open
  tab could run ~4-5GB/session-day, since every poll re-sent the
  full array even when nothing had changed.
  - `lib/etag.ts` — SHA-1 hash of the response payload, server-side
  - `lib/etag-fetcher.ts` — client-side fetcher factory that sends
    the last-seen ETag as `If-None-Match`; on `304`, returns the
    previously-seen data by the same object reference (so
    SWR/React see no change and skip re-rendering) instead of
    re-parsing an empty-but-still-real response
  - Both `/api/leaderboard` and `/api/session-info` compute an
    ETag and return `304` when `If-None-Match` matches
  - `Dashboard`'s two `useSWR` calls now use
    `createEtagFetcher()` (one instance each, via `useMemo`) in
    place of the old plain-`fetch` fetcher
  - **Verified end-to-end against a real running server** (not
    just `next build`): first request to `/api/leaderboard`
    returned `200` with a 28,192-byte body against the live
    session's actual data; a second request with that ETag as
    `If-None-Match` returned `304` with a 0-byte body. This is the
    real fix — the poll interval itself was never the expensive
    part, re-sending the unchanged payload every 3s was.
  - Separately flagged, not addressed: Vercel Hobby's ToS
    restricts to non-commercial/personal use — the user said
    they'll resolve that separately, not a technical concern.
- `npx next build` passes.

## Completed (continued 8)

- **Fixed: celebration toast replayed stale completions on every page
  refresh** (e.g. "P2 est complet" reappearing every reload even
  though that project completed long before). Root cause: the
  celebration effect keyed off `lastTouched(evaluations)` — on a
  fresh page load, `evaluations` jumps from empty to the full
  current dataset in one step, so whatever was most recently
  touched in that snapshot looked like it "just happened," no
  matter how old it actually was.
  - Reworked around a `celebratedRef` (`Set<string>` of project
    codes already celebrated) + `hasInitializedRef` in
    `dashboard.tsx`. On the first successful load, every
    already-complete project is recorded as seen *without*
    celebrating — that's what stops the replay. After that, only
    genuinely new transitions to complete trigger a toast.
  - This also fixes a latent related bug for free: the old logic
    only ever checked the single `lastTouched` record, so if two
    projects completed between polls, only one toast would fire.
    The new version checks all of `completionProgress` each time,
    so a burst of simultaneous completions all get celebrated.
  - `isEdit`/`evaluatorCount` imports removed from `dashboard.tsx`
    (no longer used there — the `celebratedRef` check makes the
    old "don't re-celebrate on edit" guard redundant, since a
    project already in the set is never re-added regardless of
    what touches it next).
- `npx next build` passes.

## Completed (continued 9)

- **PIN-gated the dashboard page**, following on from the Vercel
  cost discussion above — the realistic cost driver isn't a
  malicious actor, it's an unintended/casual viewer finding the
  URL and leaving a tab open, quietly adding to data transfer. User
  explicitly chose page-only scope (API routes stay open) over
  full app-wide gating, aware that a determined caller could still
  hit the API directly without a PIN — this protects the realistic
  case, not the adversarial one.
  - `lib/access-pin.ts` — SHA-256 hash of `DASHBOARD_PIN` as the
    cookie value (not the raw PIN), so rotating the env var
    auto-invalidates every previously-granted cookie
  - `proxy.ts` at the project root — **not** `middleware.ts`;
    confirmed via the docs that Next.js 16 renamed Middleware to
    Proxy (`middleware.ts` would not be picked up the same way).
    Also confirmed Proxy now defaults to the **Node.js runtime**
    (a real change from Middleware's old Edge-only default), so
    `node:crypto` is safely usable — checked this before writing
    any code, per AGENTS.md's "not the Next.js you know" warning.
    `matcher: ["/"]` scopes it to the page only.
  - `app/api/acces/route.ts` (POST) validates the submitted PIN,
    sets the cookie via `NextResponse`'s cookie API (not a
    hand-built `Set-Cookie` string — more robust)
  - `app/acces/page.tsx` — French PIN entry form, matches the
    app's existing glass-panel/ambient-background visual language
  - `DASHBOARD_PIN` added to `.env.local` (placeholder value —
    user needs to set a real one before deploying) and
    `.env.example`
  - Build passes and registers `ƒ Proxy (Middleware)` in the route
    output, confirming it's picked up. **Not yet runtime-verified**
    — the user explicitly declined having Claude start a server to
    test this (see memory: never start a server in this project
    without being asked). User will verify themselves: unauthenticated
    `/` should redirect to `/acces`; submitting the correct
    `DASHBOARD_PIN` should set the cookie and land on the real
    dashboard; `/api/leaderboard` should stay reachable with no PIN.
- `npx next build` passes.

## Open Questions

- None currently open. (The all-projects visualization question
  is resolved — see Completed (continued 4).)

## Architecture Decisions

- Live updates use server-side polling of the mobile app's
  GET /evaluations (proxied through a Next.js Route Handler)
  + client-side polling via SWR, not SSE/websockets — chosen
  because the app deploys to Vercel, where serverless functions
  don't suit long-lived streaming connections.
- Project standings score = running average of 20-point
  criteria totals across jurors who have scored so far;
  ineligible ("No") determinations are excluded from the
  average but shown as a count indicator.
- Tracker reads data via the mobile app's API only — no direct
  database access, no shared Drizzle schema with the mobile app.
- **Superseded, kept for history**: earlier in this session, the
  juror/project roster (`jurorCount`/`projectCount`) was believed
  to be unavailable from any API — the user had confirmed the
  mobile app hardcodes it as a fixed preset with no exposing
  endpoint, and `GET /evaluations` structurally can't be the
  source (it only shows evaluations that exist). `NEXT_PUBLIC_
  JUROR_COUNT`/`NEXT_PUBLIC_PROJECT_COUNT` env vars were added as
  the roster source. **Then the user found `GET /health`**, which
  does expose `{jurorCount, projectCount}` (as strings) — the
  mobile app apparently has this after all, just not documented
  anywhere we'd looked. The roster is now fetched live via
  `/api/session-info` (polled every 30s); the `NEXT_PUBLIC_*` env
  vars are demoted to fallback-only (pre-first-fetch / fetch-failure),
  not the primary source. See Completed (continued 6).
  Lesson: "confirmed hardcoded, no endpoint exists" from a person
  familiar with a codebase can still be wrong/incomplete — worth
  treating as a strong prior, not a certainty, especially for
  something as checkable as "try the obvious endpoint path."

## Session Notes

- Mobile app repo (separate): GPCE-app under
  Projects/mobile-apps/GPCE-app.
- **Confirmed real `GET /evaluations` record shape** (user
  pasted actual API output, 2026-07-16): `id` (uuid),
  `jurorCode`, `projectCode`, `meetsCriteria` (bool),
  `projectType` ("individual" | presumably "group" | null),
  `documentIdentity` / `documentBulletin3` /
  `documentMotivationLetter` (bool | null — three separate
  fields, not one checkbox as the mobile app's own docs implied),
  `pertinence` / `approcheInnovante` / `transferabilite` /
  `rigueur` / `faisabilite` (each 0-4, not a generic array),
  `recommendation` (string | null, never shown publicly — see
  above), `createdAt` / `updatedAt` (both present — evaluations
  are genuinely edited after submission, confirmed by real
  sample data where `updatedAt` was ~90s after `createdAt`).
  `lib/evaluation-types.ts` now mirrors this exactly.
- Open nuance: both real sample records had all 3 document
  fields as `null` despite `meetsCriteria: true` — whether
  `null` vs `false` actually distinguishes "not checked" from
  "confirmed missing" isn't verified yet (see Next Up).
- **Live endpoint confirmed (2026-07-16)**: deployed via Expo EAS
  at `https://gpce.expo.app/evaluations` (GET, no auth). Mobile
  app is built with Expo Router, whose API routes can deploy this
  way — explains the `.expo.app` domain despite this being a
  server endpoint, not a mobile screen. Response shape is
  `{ evaluations: [...] }`, not a bare array. As of this session's
  testing, the real session had 91 evaluations across 9 of the 12
  jurors.
- **`GET /health` also exists** (2026-07-16, same host:
  `https://gpce.expo.app/health`, no auth) — returns
  `{"jurorCount":"12","projectCount":"200"}`. Counts are strings,
  not numbers; `lib/session-info-validate.ts` parses defensively.
  This wasn't mentioned anywhere before the user found it — worth
  probing for sibling endpoints (`/health`, `/status`, `/config`,
  etc.) on any future API integration rather than assuming
  `GET /evaluations` is the only thing there.
