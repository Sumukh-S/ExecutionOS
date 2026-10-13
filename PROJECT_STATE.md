# Execution OS — Project State

_Last updated: 2026-10-13_

## Overview

Execution OS is a personal productivity and execution app built with Next.js 15 (App Router),
React 19, TypeScript, Tailwind CSS, and Supabase scaffolding.

## Stack

- Next.js 15.2.4 (App Router, Turbopack dev)
- React 19
- TypeScript 5.7
- Tailwind CSS 3.4 with custom HSL theme tokens
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`) — auth scaffolding only
- lucide-react icons
- Recharts, react-day-picker, zod (installed; limited use)

## Key Architecture

### Shared data store — `contexts/execution-data.tsx`
Single source of truth for the app, persisted to `localStorage` under `execution-os-data`.

- `TaskRecord`: full task model with `id`, `isMain?`, `parentId?`, title, icon, listName,
  description, scope, firstAction, priority, status, scheduledStart/End, deadline, location,
  alarm, notes, resources, predictedDifficulty, actualDifficulty, expectedDuration, wish,
  outcome, obstacle, weeklyGoal, monthlyGoal, createdAt.
- `GoalRecord`: `{ id, title, type: weekly|monthly|longterm, target, progress }`.
- `QuickTask`: `{ id, title, completed, createdAt }` (under-5-minute tasks).
- `FocusSession`: `{ id, taskId, taskTitle, startedAt, endedAt, durationMinutes }`.
- Exposed methods: `addTask` (returns `boolean`, enforces max 2 main tasks), `deleteTask`,
  `startTask`, `completeTask`, `addFocusSession`, `addGoal`, `addQuickTask`,
  `toggleQuickTask`, `deleteQuickTask`.
- Helper: `getTaskQuadrant(task)` returns `q1|q2|q3|q4` from priority + deadline.

### Other providers
- `contexts/theme.tsx` — dark/light theme, persisted to `execution-os-theme`.
- `contexts/auth.tsx` — Supabase auth (scaffolding).

## Routes (20 total)

| Route | Purpose |
| --- | --- |
| `/` | Today page (`app/page.tsx` → `app/today/page.tsx`). Shows only tasks scheduled today or due today. |
| `/today` | Same Today page. Main tasks on top, other today tasks below, under-5-min tasks on the right. |
| `/tasks` | Tasks hub: up to 2 main tasks and independent subtasks. No under-5-min list. |
| `/calendar` | Month view built from real scheduled tasks; tasks link back to `/tasks?task=id`. |
| `/weekly` | Weekly plan — add tasks/goals via `PlanAddDialog`. |
| `/monthly` | Monthly plan — add tasks/goals via `PlanAddDialog`. |
| `/goals` | Goals — create long-term/monthly/weekly goals. |
| `/eisenhower` | Matrix derived from shared tasks via `getTaskQuadrant`. |
| `/focus` | Pomodoro: task-gated work timer, break tasks (Q2/Q3/Q4 + under-5-min), session history. |
| `/dashboard` | Stats snapshot (legacy). |
| `/analytics`, `/standards`, `/countdown`, `/backup`, `/more` | Supporting screens. |
| `/empty`, `not-found.tsx`, `error.tsx` | Empty state, custom 404, error boundary. |

## Tasks page behavior (current)

- `/` is the **Today** page. It only lists tasks whose `scheduledStart` or `deadline` is today.
- Today locks new/edited task dates to today and includes Details, Done, Delete, Edit, and Add.
- Exactly **2 main tasks** allowed, always pinned on top (`isMain`). `addTask` blocks a 3rd.
- Tasks page has separate **Add main task** and **Add subtask** buttons. Main tasks and subtasks are independent.
- Under-5-minute tasks live on Today only: right sidebar on desktop, collapsible dropdown on mobile.

## Theme

Warm neutral / clay palette. Light and dark tokens defined in `app/globals.css`:

- Light: background `#f4efe7`, cards white, primary brown `rgb(111,61,30)`.
- Dark: background `rgb(15,15,15)`, cards `rgb(32,32,32)`, primary clay `rgb(163,104,72)`.

## Conventions

- Navigation lives in `components/layout/header.tsx` as a bottom-right drawer + mobile tab bar.
- `components/task-card.tsx` is the shared task card (Details, Done, Delete).
- `components/plan-add-dialog.tsx` is the shared task/goal creation dialog for planning pages.
- Dates use deterministic formatters in `lib/dates.ts` to avoid hydration mismatches.

## Status

- `npx tsc --noEmit` passes.
- `npm run build` passes; all 20 routes build.
- Data is local (`localStorage`); Supabase persistence is not yet wired for tasks/goals.
