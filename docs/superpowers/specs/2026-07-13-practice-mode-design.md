# Practice Mode — "5 in a row"

**Date:** 2026-07-13 · **Status:** approved by owner (this conversation)

## 1. Problem

Solo proves she can run a framework's script once. The owner wants a repetition mode —
"practice 5 in a row of the same problem [type]" — so fluency comes from volume, on any
lesson, right where Solo lives.

## 2. Design

### The mode

- A 5th button **🔁 Practice** rendered after 🦋 Solo in the stage row of every framework
  (all 32, not just Time & Clocks). Unlocks exactly when Solo unlocks
  (`isUnlocked(progress, id, "solo")`). It is **NOT** a member of `STAGES` — stage
  semantics (progress model, unlock math, `stageReached` 1..4, tests) are untouched.
- Playing: **five fresh problems of the same framework, back to back**, each played with
  the existing Solo mechanics (prompt + figure + finalAsk + numpad, unlimited retries with
  the gentle shake message). A header row shows five slots plus "Problem N of 5":
  - ⭐ = solved on the **first try** (no wrong submission on any answer slot)
  - ✅ = solved after one or more wrong tries
  - A wrong answer never resets the run — she just retries that problem (Solo behavior).
- Per-problem completion: small confetti is SKIPPED for problems 1–4 (a brief "slot fills"
  beat instead); finishing problem 5 fires confetti — a **bigger burst when all five are
  ⭐** — then an end panel: "🔁 Practice again" (new run, fresh seeds) / "🏠 Home".

### Progress (additive only)

- `FwProgress` gains optional `practiceRuns?: number` and `perfectRuns?: number`;
  `recordPractice(id, perfect)` increments them (+ `lastPlayed`). Existing stored JSON
  stays valid (fields default 0 via the `entry()` fallback).
- Parent-peek table gains a "Practice" column: `runs` with `(⭐ perfect)` when > 0.
- Home tile shows a small 🔁 beside the ⭐ once `perfectRuns > 0`.

### Implementation shape

- `lib/engine/PracticeRunner.tsx` — owns the run: 5 seeds derived from a base seed
  (`base + i`), generates each problem, renders its own prompt box + `Figure` (StageEngine
  does NOT render its shared prompt/figure in practice mode — the problem changes mid-run),
  the slots header, and the end panel trigger. Reuses `SoloRunner` (exported from
  `StageRunner.tsx`) with two new optional props: `celebrate?: boolean` (default true;
  false suppresses its confetti) and `onSolved?: (firstTry: boolean) => void` (practice
  callback; when provided, `onComplete` is not called).
- `StageEngine` — adds `mode: "stages" | "practice"`; the Practice button sits after the
  4 stage buttons (same pill styling, amber accent); entering practice picks a fresh base
  seed; `onFinish(perfect)` → `recordPractice` → practice end panel.
- No changes to generators, figures, chips, STAGES, or the self-test contract.

## 3. Testing

- `lib/progress.test.ts`: `recordPractice` increments runs/perfectRuns, preserves existing
  fields, defaults old records.
- Lint + tsc + build + browser smoke (enter practice, complete a run incl. one wrong
  answer → ✅ slot, finish → confetti + end panel, parent peek column, tile 🔁).
- Deploy `vercel --prod --yes`, live smoke.

## 4. Non-goals

Timers, speed pressure, adaptive difficulty, changing Solo, cross-framework mixed drills,
streak resets.
