# UI Context

## Theme

Light and dark are both fully defined (shadcn "New York"-style
token set, oklch color space). The app opens in **dark by
default** — it's primarily a shared-screen display (projector/TV
in the jury room) where dark reads better from a distance and
avoids glare — but a toggle exists for individual browser use.
Implemented with `next-themes`, `defaultTheme="dark"`,
`enableSystem={false}` (don't let OS preference override the
display default).

## Colors

CSS custom properties, defined once in `app/globals.css` for
`:root` (light) and `.dark` (dark), consumed via Tailwind v4's
`@theme inline` mapping. No hardcoded hex/oklch values in
components — always the token (e.g. `bg-primary`, `text-muted-foreground`).

| Role                | CSS Variable            | Light                          | Dark                            |
| ------------------- | ------------------------ | ------------------------------- | --------------------------------- |
| Page background     | `--background`           | `oklch(1.0000 0 0)`              | `oklch(0.2046 0 0)`                |
| Foreground text      | `--foreground`           | `oklch(0.3211 0 0)`              | `oklch(0.9219 0 0)`                |
| Card surface         | `--card`                 | `oklch(1.0000 0 0)`              | `oklch(0.2686 0 0)`                |
| Primary (brand/accent bars) | `--primary`        | `oklch(0.6231 0.1880 259.8145)`  | `oklch(0.6231 0.1880 259.8145)`    |
| Primary foreground   | `--primary-foreground`   | `oklch(1.0000 0 0)`              | `oklch(1.0000 0 0)`                |
| Secondary            | `--secondary`            | `oklch(0.9670 0.0029 264.5419)`  | `oklch(0.2686 0 0)`                |
| Muted                | `--muted`                | `oklch(0.9846 0.0017 247.8389)`  | `oklch(0.2393 0 0)`                |
| Muted text           | `--muted-foreground`     | `oklch(0.5510 0.0234 264.3637)`  | `oklch(0.7155 0 0)`                |
| Accent               | `--accent`               | `oklch(0.9514 0.0250 236.8242)`  | `oklch(0.3791 0.1378 265.5222)`    |
| Destructive          | `--destructive`          | `oklch(0.6368 0.2078 25.3313)`   | `oklch(0.6368 0.2078 25.3313)`     |
| Border               | `--border`               | `oklch(0.9276 0.0058 264.5313)`  | `oklch(0.3715 0 0)`                |
| Ring (focus)         | `--ring`                 | `oklch(0.6231 0.1880 259.8145)`  | `oklch(0.6231 0.1880 259.8145)`    |
| Chart series 1–5     | `--chart-1`…`--chart-5`  | see `globals.css`                | see `globals.css`                  |

Full token set (including `popover`, `input`, `sidebar-*`, and
shadow tokens) lives in `app/globals.css` — this table covers the
roles components will reach for most; treat `globals.css` as the
source of truth if this table and the file ever diverge.

`--chart-1`…`--chart-5` are reserved for the project standings
bars if/when a per-project or per-category color distinction is
needed (e.g. one series color isn't enough to distinguish
something). Default to `--primary` for a single-series bar list;
don't reach for the chart palette until there's an actual second
series to distinguish.

## Typography

| Role      | Font            | Variable      |
| --------- | --------------- | ------------- |
| UI text   | Inter           | `--font-sans` |
| Code/mono | JetBrains Mono  | `--font-mono` |
| Serif     | Source Serif 4  | `--font-serif` |

Loaded via `next/font/google` in `app/layout.tsx` (not yet wired
— current layout.tsx still loads Geist/Geist Mono from the
default Next.js scaffold; updating it to Inter/JetBrains
Mono/Source Serif is a pending implementation step, see
`progress-tracker.md`). Source Serif 4 has no identified use case
yet in this app's UI (no long-form text) — keep it defined since
it's part of the theme export, but don't force it into a
component just because it exists.

## Border Radius

Base `--radius: 0.375rem` (6px), scaled via `@theme inline`:

| Context                        | Class         | Resolves to |
| ------------------------------- | ------------- | ----------- |
| Inline / small UI (badges, chips) | `rounded-sm`  | ~2px |
| Buttons, inputs                 | `rounded-md`  | ~4px |
| Cards / panels / leaderboard rows | `rounded-lg`  | 6px |
| Modals / overlays               | `rounded-xl`  | ~10px |

## Component Library

shadcn/ui on **Base UI** (`@base-ui/react`), not Radix — see
`architecture.md`. Components live in `components/ui/` (protected
— see `ai-workflow-rules.md`), generated via the shadcn CLI where
practical (`button.tsx`). `dialog.tsx` was hand-built directly
against `@base-ui/react/dialog` instead of `npx shadcn add dialog`,
to avoid re-running the CLI (see the shadcn CLI caution in memory
— `init` overwrote the theme once already) — same result, same
`data-slot` / `cn()` conventions as the CLI-generated `button.tsx`,
just written by hand. Base UI's open/closed styling hooks are
`data-open`/`data-closed` attributes (via custom Tailwind variants
from `shadcn/tailwind.css`), not Radix's `data-state="open"`.

## Projection / Readability

This app is primarily viewed projected across a room, not read
up close — "we don't see it" from a juror is a real failure
mode, not a nitpick. This shapes sizing everywhere, not just
one component:

- Leaderboard rows: rank/code/value text is `text-2xl`+, bars
  are `h-10`, row padding is generous (`px-4 py-3`) — small
  `text-sm` rows (the original v1 pass) do not survive being
  shot across a room
- Primary live signals (activity ticker, completion count) are
  the largest text on the page — `text-4xl`–`text-7xl` —
  since they're the thing a glance should catch first
  regardless of which leaderboard tab is active
- Secondary stats (pace, ineligibility count) are smaller
  (`text-3xl` for the number, `text-sm` for the label) but
  still well above normal UI scale
- **Dashboard scroll model** (this went through several buggy
  iterations before landing here — the current design is
  deliberate, don't reintroduce `overflow-hidden`/`h-screen` clamps
  on the page or dashboard chain): **the browser page scrolls
  normally.** There are no `overflow-hidden` height clamps between
  the content and the document root. Everything flows at natural
  height. Then:
  - The **sidebar** (KPI, stat tiles, criteria, composition) is
    `sticky top-4` — it pins near the top of the viewport while the
    taller leaderboard column scrolls past it.
  - The **leaderboard column** flows at its natural (tall) height
    and scrolls with the page. Its tab switcher is a `sticky top-4`
    header (with `bg-card/70` + `backdrop-blur` so rows scrolling
    behind stay covered), so the tabs stay reachable however far
    you scroll.
  - The **ambient background** is `fixed inset-0` and the **theme
    toggle** is `fixed` — both stay put visually while the page
    scrolls under them.
  Why this shape: `position: sticky` silently does nothing if *any*
  ancestor between the sticky element and its scroll container has
  `overflow: hidden` (or `auto`/`scroll`). Earlier attempts kept an
  `overflow-hidden` page root (for a "page never scrolls" projector
  ideal) plus nested per-column `overflow-y-auto` + `min-h-0`
  chains — that combination both broke `sticky` (overflow-hidden
  ancestor) and was fragile (a missing `min-h-0` defaults a
  flex/grid item to `min-height: auto`, which won't shrink below
  content and pushed the whole page past the viewport anyway).
  Removing every `overflow-hidden`/height clamp and letting the
  document scroll is what finally made the sidebar reliably stick.
  Trade-off accepted with the user: the title header and activity
  ticker scroll away with the page (they are not pinned) — the
  original "nothing ever scrolls, everything fits the viewport"
  projector ideal was abandoned in favor of a scroll model that
  actually works in a browser. If the ticker needs to stay visible
  on scroll later, make it `sticky`/`fixed` too — but do NOT
  re-add `overflow-hidden` to the page root to achieve it.
- Layout goes horizontal (multi-column) before it goes tall —
  see the dashboard's sidebar (KPI + stats) beside the
  leaderboard, not stacked above it. Projector displays are
  landscape; use the width.

## Layout Patterns

- **Main display**: single full-bleed screen (`h-screen`, no page
  scroll), no auth/nav chrome — matches the public/no-auth scope.
  A persistent header (activity ticker) always shows regardless of
  tab. Below it, a content sidebar (completion KPI + pace/
  ineligibility stat tiles) sits beside the leaderboard rather than
  above it — see Projection/Readability above for why. This is a
  content sidebar, not a navigational one; there's still no app
  nav/menu chrome.
- **Tabs**: switch between three leaderboard views — Juror
  Completion, Project Standings (score), and Project Completion
  (juror-coverage progress, persistent counterpart to the
  celebration toast below) — via `FluidTabs`
  (`components/leaderboard/fluid-tabs.tsx`): a pill-shaped active
  indicator that slides between tabs using Motion's shared
  `layoutId`, not an instant color swap. Large and high-contrast,
  sized for viewing/clicking on a TV or projector from a distance
  — not a compact desktop-density tab strip.
- **Leaderboard rows**: each row is a horizontal bar (`bg-primary`
  fill against `bg-muted` track) inside a `rounded-lg` container,
  animated with Motion (`layout` + `AnimatePresence`, see
  Animation below) — not a traditional data table. The row list
  scrolls within its own bounded region if it overflows (see
  Projection/Readability); the page itself never does. The same
  `LeaderboardBar` component powers all three tabs — Juror
  Completion and Project Standings scale bars relative to the
  current leader (see Animation below), while Project Completion
  scales against the real, meaningful ceiling of 12 jurors, since
  "complete" is an actual achievable state there, not just a
  relative comparison. Every row is clickable (rendered as
  `motion.button`, not a plain div) and opens a detail `Dialog` —
  see below.
- **Search**: Classement des projets and Complétion des projets
  cover all 200 projects, not a fixed top-N — a search bar
  (`board-search.tsx`) filters by code, and only a capped number
  of rows (30) actually render as animated bars at once, so the
  board never tries to animate all 200 simultaneously. Rank shown
  on a search result is its true rank among all 200, computed
  before filtering. Progression des jurés has no search (12 rows
  fits without one).
- **Row detail dialog**: clicking any row opens a centered `Dialog`
  (`components/ui/dialog.tsx`) with content specific to the tab it
  came from — this is deliberate, not a generic "show the row's
  data" modal: Progression des jurés shows that juror's
  evaluations with per-criterion detail one click away; Classement
  des projets shows the average disaggregated into each juror's
  individual score; Complétion des projets shows a plain
  covered/not-covered grid of the 12 jurors, no scores, since that
  tab is about coverage, not scoring.
- **Celebration toasts**: a project reaching full juror coverage
  (all 12 evaluations in) triggers a large, brief, self-dismissing
  banner fixed to the top of the screen — the one overlay pattern
  in this app, distinct from a modal (no backdrop, no focus trap,
  doesn't block interaction, auto-clears after a few seconds).
  This is deliberately paired with the persistent Project
  Completion tab above — the toast is "it just happened," the tab
  is "check anytime."
- **Other modals/overlays**: the row detail `Dialog` above and the
  celebration toast are the only two. No forms, no auth, no
  settings requiring a dialog beyond these. Revisit if a feature
  needs one.

## Icons

Lucide React (shadcn's default pairing). Stroke-based icons only.
Sizes: `h-4 w-4` inline (e.g. next to juror codes), `h-5 w-5` for
any standalone/button icon (e.g. tab icons).

## Animation

Motion (`motion/react`) drives every leaderboard update — this is
a core product goal (see `project-overview.md`), not decoration.

- Ranked lists use `motion.div` with `layout` on each row, keyed
  by a stable id (juror code / project code) — reordering animates
  automatically as SWR polling brings in new rankings.
- New entries animate in via `<AnimatePresence>`; nothing should
  pop or flash into place.
- Bar fill width animates via `animate={{ width: `${pct}%` }}`
  against the row's current-max-relative percentage.
- Prefer `--primary` for the bar fill in both single-series views;
  reach for `--chart-1`…`--chart-5` only if a view needs to
  distinguish multiple series at once.
