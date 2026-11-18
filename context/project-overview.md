# GPCE Live Tracker

## Overview

A Next.js web app that gives the GPCE jury and organizers a
live, shared view of jury scoring progress during the
evaluation session. It is the companion app to the GPCE Jury
Scoring App (a separate mobile/tablet repo) where jurors
actually enter scores. This app displays that data — it never
collects evaluations itself. Intended for display on a shared
screen in the jury room (e.g. a projector or TV) as well as
individual browsers.

All user-facing app content (labels, headings, buttons,
messages) is in **French** — the jury's working language,
matching the mobile app's own convention. Code, comments, and
these context docs stay in English.

## Goals

1. Show, in real time, which jurors have completed which
   projects and how many remain — so the room always knows
   where scoring stands without asking around.
2. Show a live-updating leaderboard of running project
   standings as scores come in, as a shared, exciting focal
   point for the room.
3. Make both views feel alive — smooth animated transitions
   as new evaluations land, not a static table that silently
   refreshes.

## Core User Flow

1. Organizer/jury member opens the tracker (no login — public
   display).
2. The dashboard shows two distinct views:
   - **Juror completion leaderboard**: each of the 12 jurors
     (J1–J12), how many of their assigned projects are
     scored vs. remaining.
   - **Project standings leaderboard**: projects ranked by
     running average score, updating live as each new
     evaluation lands.
3. As jurors submit evaluations on the mobile app, this
   dashboard updates within a few seconds, without a manual
   refresh — new/changed entries animate into place.

## Features

### Live Data

- A Next.js Route Handler (`/api/leaderboard` or similar) is
  the only thing that calls the mobile app's `GET /evaluations`
  — it proxies and computes the ranked/aggregated data server
  side. Browsers never call the mobile API directly.
- Browsers poll that route on an interval (2-5s) via SWR or
  equivalent. Chosen over SSE/websockets because the app
  deploys to Vercel, where serverless functions aren't suited
  to long-lived streaming connections — polling is the
  platform-native fit and, at this cadence, visually
  indistinguishable from push.

### Juror Completion Leaderboard

- Per juror: count of projects scored / total assigned,
  sorted by completion.
- A juror's row updates and re-sorts live as they submit.
- An ineligible ("No" / out-of-scope) determination counts as
  done, matching the mobile app's own invariant.

### Project Standings Visualization

- Per project: running average of the 20-point criteria
  totals across **every** juror who has evaluated it so far,
  each ineligible ("hors critères") answer counting as 0/20
  (owner, 2026-11-18; `averageCountingIneligibleAsZero` in
  `lib/leaderboard-types.ts`, used by both the ranking and the
  dossier detail). Until then ineligible answers were excluded,
  so 1 juror at 17/20 + 11 "hors critères" ranked first at 17.0;
  now it is (17 + 11×0) / 12 = 1.4.
- Recalculates and re-ranks live as each new score lands —
  a project can move up or down the moment a juror submits.
- The dossier detail lists the ineligible jurors as "Hors
  critères (0)" and states the count, so the room sees where
  the zeros come from.
- Projects nobody has evaluated yet are shown as not-yet-ranked
  rather than a false 0.
- **Open design question**: with up to 200 projects, a single
  flat leaderboard of horizontal bars does not scale visually
  — 200 animated rows is noise, not a "stunning" leaderboard.
  The full-list horizontal-bars layout described elsewhere in
  earlier discussion applies to a small/top-N view; the
  all-projects view needs a different visualization (e.g.
  top-N bars + a compact view for the rest, pagination,
  grouping/filtering, or a different chart type entirely).
  See `progress-tracker.md` for this open question — resolve
  before building the all-projects view.

### Animation

- New evaluations landing, leaderboard re-ordering, and
  completion milestones (e.g. a project reaching all 12
  jurors) are animated with Motion — this is a primary design
  goal of the app, not a nice-to-have.

## Scope

### In Scope

- Live juror completion leaderboard
- Live project standings leaderboard (running average)
- Real-time updates via server-side polling of the mobile
  app's API + SSE fan-out to browsers
- Public, unauthenticated display (shared-screen use case)

### Out of Scope (for now)

- Any evaluation data entry — this app is read-only; all
  scoring happens in the mobile app
- Authentication / access control — revisit if the room needs
  it restricted later
- Historical/session-over-session analytics — this tracks the
  current live session only
- Declaring an official final winner — the standings
  leaderboard is a live/informal view, not the authoritative
  award decision

## Success Criteria

1. The dashboard reflects a new evaluation submitted on the
   mobile app within a few seconds, with no manual refresh.
2. The project standings leaderboard correctly recalculates
   and re-ranks as running averages change, counting each
   ineligible determination as 0/20 in the average.
3. The juror completion leaderboard correctly counts an
   ineligible determination as done.
4. Leaderboard re-ordering and new entries animate smoothly
   rather than jumping/flashing.
