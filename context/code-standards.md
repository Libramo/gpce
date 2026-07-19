# Code Standards

## General

- Keep modules small and single-purpose — a component that
  fetches data, aggregates it, and animates it is three
  concerns wearing one file
- Fix root causes, do not layer workarounds
- Do not mix unrelated concerns in one component or route
  (e.g. `/api/leaderboard` computes rankings; it does not also
  know how a bar renders)

## TypeScript

- Strict mode is required throughout (already enabled in
  `tsconfig.json`) — keep it that way
- Avoid `any` — use explicit interfaces or narrowly scoped
  types, especially for the shape of the mobile app's
  `GET /evaluations` response
- Validate unknown external input at the boundary: the mobile
  app's API response is the one piece of external, unversioned
  input this app depends on — parse/validate it in the route
  handler that calls it, not downstream in components

## Next.js (App Router, v16 — see AGENTS.md)

- Default to Server Components; add `"use client"` only where
  browser interactivity requires it (the theme toggle,
  animated leaderboard rows, anything using Motion or React
  state)
- Route Handlers stay focused on a single responsibility —
  `/api/leaderboard` fetches from the mobile API and returns
  ranked/aggregated data, nothing else
- This Next.js version has documented breaking changes from
  older training data — check `node_modules/next/dist/docs/`
  before assuming an API's shape, per AGENTS.md

## Styling

- Use the CSS custom property tokens defined in
  `app/globals.css` (`bg-primary`, `text-muted-foreground`,
  etc.) — no hardcoded hex/oklch values in components
- **Exception**: a self-contained decorative icon/illustration
  asset where a fixed two-tone design is the point (e.g. the
  sun/moon SVG in `components/theme-toggle.tsx`) may use fixed
  colors internally. The interactive chrome around it (button
  background, borders) still uses tokens.
- Follow the border radius scale defined in `ui-context.md`
- No inline `style` objects except for values Motion is
  actively animating (e.g. a leaderboard bar's `width`) — that
  is the sanctioned exception, not a general escape hatch

## Component Library (shadcn/ui on Base UI)

- `components/ui/*` is CLI-generated (this project's shadcn CLI
  is v4.x, using `@base-ui/react` as its primitive engine, not
  Radix — see `architecture.md`) — protected, regenerate via
  `npx shadcn add <component>` rather than hand-editing
- Re-running `npx shadcn init` can silently overwrite the
  custom theme in `app/globals.css` with its own preset
  defaults — this happened once already in this project. If it
  needs to run again, diff `globals.css` afterward before
  trusting it.

## API Routes

- Validate and parse the mobile API's response before any
  ranking/aggregation logic runs
- No auth/ownership checks needed (public, read-only app — see
  `architecture.md`), but still return consistent, predictable
  response shapes, including when the upstream mobile API is
  briefly unreachable (a client polling this route should get a
  clear, handleable state — not an unhandled 500)

## Data and Storage

- This app never writes evaluation data (see `architecture.md`
  invariant #1)
- The Neon/Drizzle scaffolding (`db/`), once it has real
  tables, stays out of the live leaderboard request path — see
  invariant #4. Don't reach for it as a shortcut for caching
  live data.

## Language and Content

- All user-facing strings — JSX text, `aria-label`s, page
  metadata (title/description) — are in French, matching the
  mobile app's convention (see `project-overview.md`)
- Code, identifiers, comments, commit messages, and everything
  in `context/*.md` stay in English

## File Organization

- `app/` — routes only (pages, layouts, Route Handlers)
- `components/ui/` — shadcn/Base UI-generated primitives
  (protected, see above)
- `components/` — leaderboard-specific and shared components
  built on top of `components/ui/`
- `lib/` — non-UI logic: the mobile API client,
  ranking/aggregation functions, the `cn()` helper, shared types
- `db/` — Drizzle schema and Neon client (currently unused,
  reserved for future features — see `architecture.md`)
