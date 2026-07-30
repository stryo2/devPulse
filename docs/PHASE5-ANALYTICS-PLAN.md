# Phase 5 — Analytics Engine: from aggregation to insight

> Approved in principle, deferred until after the polish pass.

## Context

The analytics engine works, but every number it returns is a **count of what happened**, never a
statement about **how you work**. `totalEvents: 40` is a fact; it is not an insight. There is no
comparison to a previous period, no notion of consistency, no sense of rhythm, and — most wastefully
— the entire *history* of snapshot rows is discarded in favour of the single latest value.

No ML, no forecasting, no "AI summary" — every figure traces back to a row in `ActivitySnapshot` by
an arithmetic rule stated up front.

## The constraint everything is designed around

| Platform | Row means | `timestamp` is | Safe to use for |
|---|---|---|---|
| GitHub | one discrete event | **real upstream event time** | streaks, day/hour rhythm, per-day series |
| LeetCode | cumulative counter changed | **detection time** | totals, deltas, growth curves |
| Codeforces | profile state changed | **detection time** | current state, deltas, rating curve |

**Streaks and time-of-day are GitHub-only, labelled as such.** A cross-platform streak would measure
how often the worker ran, not how often you worked — it would change when `SYNC_SCHEDULE_CRON` is
edited, which makes it worthless. Snapshot platforms are not second-class: cumulative counters make
**windowed deltas and growth curves exact** regardless of detection timing.

## Measured data reality

- 83 `ActivitySnapshot` rows total; **all GitHub events on one day** (2026-07-03), 3 distinct hours
- Snapshot platforms have 1–2 distinct timestamps per user

Correct to build now, sparse until history accumulates. **Visual checks alone are insufficient** —
pure functions need crafted-input unit checks.

## What is missing

1. No period-over-period comparison
2. No streaks or consistency (burst vs habit is indistinguishable)
3. No day-of-week / hour-of-day rhythm
4. **Snapshot history discarded** — `DISTINCT ON` keeps only the newest row plus one baseline; the
   discarded rows *are* the growth curve. Biggest unused asset, free to use.
5. Repository data shallow (`{repo, count}` only)
6. No weekly/monthly rollups
7. No takeaways

## MVP vs nice-to-have

**MVP:** F1 period comparison · F2 streaks (GitHub) · F3 consistency (GitHub) · F4 best day/time
(tz-aware) · F5 platform growth curves · F8 insight cards (rule-based)

**Nice-to-have:** F6 deeper repository insights · F7 weekly/monthly summaries endpoint

## Backend vs frontend rule

> **Backend** owns anything requiring *reading rows*. **Frontend** owns arithmetic on numbers
> already in the payload.

Backend: streak runs, active-day sets, `AT TIME ZONE` bucketing, period buckets, growth series,
previous-period aggregates, insight **facts**. Frontend: percentages of returned totals, sorting,
top-N selection, formatting, insight **sentences**. Prose in an API is untestable as data.

## Schema, jobs, API

- **No schema change required for MVP.** Recommended additive: `@@index([userId, platform, timestamp])`;
  and `ConnectedPlatform.lastSyncedAt` stops being cosmetic (without it a worker outage is
  indistinguishable from user inactivity, so a broken streak may be our fault).
- **No background jobs.** Precomputed rollups are overengineering at this scale (83 rows today);
  revisit past ~100k rows/user.
- Extend `/analytics/summary` with `previous`, `streak`, `consistency`, `patterns`, `growth`; add
  validated `tz` param; new `/analytics/trends?period=week|month` for F7 only.

## Order

1. **F1** period comparison + `tz` param (foundation)
2. **F2** streaks — computed over **all history, not the window** (a streak must not change when the
   range filter moves); day list is small, reduce in JS for testability
3. **F3** consistency — `activeDays / daysInWindow`, plain ratio not an invented score
4. **F4** best day/time — dense 7 + 24 buckets via `EXTRACT(... AT TIME ZONE $tz)`; render with
   **emphasis** (peak in accent, rest gray), not an ordinal ramp — 24 ramped bars double-encode
5. **F5** growth curves from the previously discarded snapshot history
6. **F8** insight cards, each suppressed when its precondition fails:
   streak ≥ 2 · peak day > 1.5× median · |trend| ≥ 10% · top repo ≥ 40% · progress ≠ 0 · consistency
7. **F6** repo insights (nice-to-have) · 8. **F7** weekly/monthly (nice-to-have)

## Reuse

Backend: `analytics.service.js` (`toDateKey`, `startOfUtcDay`, `buildDateSpine`, `MS_PER_DAY`, the
fan-out shape, the `asOf: null` convention, `groupBy` + `$queryRaw` split); `analytics.validator.js`;
`analytics.controller.js` envelope; `auth.middleware.js`.

Frontend: `ChartCard` (incl. table-view twin), `StatTile`, `StateViews`, `RangeFilter`,
`ContributionHeatmap`, all `charts/*`, `vizChrome.js`, `useAnalytics`, `splitSolved`, and the
**validated** palette tokens — any new hue requires re-running the validator.

## Verification

1. Pure functions unit-checked with crafted input (live data is one day wide and would pass almost
   any implementation)
2. SQL cross-check of every aggregate against a direct query
3. `tz=UTC` vs `tz=Asia/Kolkata` must shift hour buckets by 5h30m
4. `currentStreak` identical at `days=7` and `days=365`
5. 1-day streak must not render a streak card
6. Non-regression on existing fields; `null`-means-not-connected still holds

## Out of scope

AI/LLM insights, forecasting, anomaly detection, ML scoring · adapter/normalizer changes (GitHub's
discarded `getProfile`/`getRepos` stay discarded — worth revisiting, two API calls paid for and
thrown away every sync) · rollup tables/caching · cross-platform streaks · any change to the
event/snapshot architecture.
