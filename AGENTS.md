# AGENTS.md — Aoife Frameworks ("Math Detective")

> **Single source of truth for anyone (human or AI) touching this repo.** Read it fully
> before changing code or "fixing" anything. If something here is wrong, fix *this* file.

A sibling of the `aoife-math*` repos, but with a **different purpose**. Those drill
operations (Aoife is already strong at those). **This app teaches reasoning frameworks** —
for each *type* of word problem it gives her a fixed **question-script** (the self-questions
to ask), and trains her up a 4-stage ladder until she can run that script on a fresh problem
herself. The goal is teaching her *which questions to ask*, not the arithmetic.

There is **no backend, no database, no API, no auth, no accounts**. It is a static
client-side site. Progress lives in `localStorage`.

---

## 1. What this is

**Next.js 16 (App Router) + React 19 + Tailwind v4**, static, deploys to **Vercel**. Same
stack and pink/purple **Bubblegum Sans** look as `aoife-math`, so it feels like part of her
set.

- **32 frameworks** (e.g. "Two Kinds · Count & Legs", "Sharing with Leftovers",
  "Shape Equations", "Number Bonds"…), grouped into 7 families on the home grid
  (`app/page.tsx`). The **Time & Clocks family is a 9-day story ladder** — see §7.
- **4-stage ladder per framework** (`lib/engine/`): **Watch** (app works it, narrating each
  question + answer) → **Together** (app asks, she answers, hint on error) → **Lead** (she
  *chooses which question to ask next*, then answers it) → **Solo** (fresh problem, she
  enters only the final answer; confetti on success) — plus a **🔁 Practice** pill (five
  Solo problems in a row, see §4).
- **iPad-first**: big touch targets, on-screen numpad, tap over typing, **text only** (no
  audio), works offline during play (no runtime network calls; confetti bundled from npm).
- **No visible timer, no speed pressure.** Concept mastery, not racing.

## 2. Architecture — how a framework works (the important part)

One **shared engine** (`lib/engine/StageEngine.tsx` + `StageRunner.tsx`, plus
`PracticeRunner.tsx` for 🔁 Practice) renders all stages from a single `Problem` object. **Each framework is a self-contained module** at
`lib/frameworks/<id>.ts` that exports a `Framework` (see `lib/types.ts`):

```ts
interface Framework {
  id; title; emoji; family; blurb; source;
  generate(rng): Problem;                 // random skin + numbers → a fresh, solvable problem
  invariant(data: Record<string, number>): boolean;  // test-only: must hold for every problem
}
```

`generate` returns a `Problem` with `promptText`, an optional `figure`, an ordered list of
`steps` (each a self-question with its `answer`, a `hint`, and `decoyQuestions` for the Lead
stage), `finalAsk`, `finalAnswers`, and a flat `data` bag of the key numbers.

**To add or change a framework:** copy an existing one (start from `two-kinds.ts`), write
its generator + question-script, register it in `lib/frameworks/index.ts`, and make its
self-test pass. The engine, numpad, hints, figures, home grid, and progress are **shared and
never touched**.

### The generator contract (DO NOT BREAK)

The strict self-test in `lib/frameworks/frameworks.test.ts` runs every generator across **500
seeds** and asserts:

1. Every numeric step (`number`, `clock-set`, `line-hop`) `answer` is a **non-negative integer**.
2. Every step has **≥2 `decoyQuestions`**, none equal to its own `ask`, and a non-empty `hint`.
3. Every `input:'choice'` step has ≥2 `choices`, one of which has `.value === answer`.
4. Every `finalAnswers[i].value` is a **non-negative integer**, is **reached** by some numeric
   step, and the **last step's answer is a final answer** (the script must end on the answer).
5. No "What is A op B?" decoy may evaluate to a real answer.
6. `invariant(data)` is **true** for every generated problem.
7. Figure/`inputSpec` numbers must match `data` (`lib/figures/figures.test.ts`, 300 seeds).

**Keep the arithmetic small and clean.** The child is ~7 and good at computation — the
*thinking* is the challenge, never the numbers. If a generated value could go negative or
fractional, fix the generation ranges so it can't.

## 3. Figures

Frameworks that need a picture set `Problem.figure` to a `FigureSpec`; `lib/figures/Figure.tsx`
dispatches on `spec.kind` to a pure component: `numberBond`, `bars`, `dotArray`, `postRow`,
`sequence`, `grid`, `shapes`, `dayLine`, `clockFace`. No external assets — all generated
SVG/flex. `dayLine` (24-cell midnight→noon→midnight strip; gold/purple ribbons, anchor-event
icons, per-hour hop arcs, `double` 0–23 row, `stacked` two-city + NOW line) and `clockFace`
(hour hand, ghost start hand, a.m./p.m. rim color) are the Time & Clocks shared visuals.

## 4. Progress

`lib/progress.ts` stores per-framework progress under `localStorage["aoife-frameworks-progress"]`:
`{ stageReached: 1..4, soloPasses, lastPlayed, practiceRuns?, perfectRuns? }`. Stages unlock
in order (the next rung is always available); the home grid shows pips + a ⭐ once soloed
(+ 🔁 once a perfect practice run exists).

**🔁 Practice mode (added 2026-07-13):** a 5th pill after Solo on every framework — five
fresh Solo-style problems back to back (`lib/engine/PracticeRunner.tsx`, reuses the exported
`SoloRunner` via `celebrate`/`onSolved` props). ⭐ = first-try, ✅ = after a retry; a wrong
answer never resets the run; all-⭐ ends with the big confetti + 🏆 panel. Practice is NOT a
member of `STAGES` (a sibling `mode` in `StageEngine`) — do not fold it into the stage
array, that would change progress semantics. Unlocks with Solo. `recordPractice(id,
perfect)` is additive-only on the stored JSON. **Parent peek:** 5 quick taps
on the home title opens a hidden progress overlay (mirrors the sibling app's gesture).

> **Lint gotcha (from the sibling repo):** never call `Date.now()` / `new Date()` /
> `Math.random()` during render — eslint `react-hooks/purity` will fail. Keep them in event
> handlers or effects (e.g. seed the problem in a `useEffect`, not in render).

## 5. Repo layout

```
app/page.tsx            — home grid (32 tiles by family; Time & Clocks as 2 chapters) + parent peek
app/f/[id]/page.tsx     — framework screen; mounts <StageEngine>
app/globals.css         — Tailwind v4 theme (pink/purple, Bubblegum Sans) + framework classes
lib/types.ts            — Framework / Problem / Step / FigureSpec / Stage
lib/rng.ts              — seedable RNG (deterministic generators)
lib/progress.ts         — localStorage progress
lib/engine/             — StageEngine, StageRunner, PracticeRunner, Numpad, ChoicePad, ClockInput, DayLineInput, rich (chips), confetti
lib/figures/            — Figure dispatcher + 9 figure components
lib/frameworks/<id>.ts  — one framework each (generator + question-script)
lib/frameworks/index.ts — FRAMEWORKS registry + byId() + FAMILIES
lib/frameworks/time-shared.ts — Time & Clocks anchors/cities/warm-up factories
lib/frameworks/time-ladder.ts — Day 1-9 chapter metadata for the home page
lib/frameworks/frameworks.test.ts — the 500-seed self-test harness
lib/stress.test.ts      — 3000-seed Time & Clocks sweep (text sanity, chip discipline, edge invariants)
docs/superpowers/       — design spec + implementation plan
```

`npm run dev` / `npm run build` / `npm run lint` / `npm test` (Vitest). No env vars, no secrets.

## 6. Gotchas

- **Never commit `node_modules` or npm caches.** `.gitignore` covers them (the old
  `aoife-subtraction-game` repo once committed a 469MB cache — don't repeat it).
- **No CDN runtime deps.** `canvas-confetti` is bundled from npm behind
  `lib/engine/confetti.ts` — do not reintroduce a CDN `<script>` (the sibling repo
  deliberately removed one for offline/flaky-wifi resilience).
- **Vercel deploy:** if the GitHub App link isn't authorized for this repo, use
  `vercel --prod` from the CLI (same situation as `aoife-math`).
- Adding/removing a framework: update `lib/frameworks/index.ts` and the `frameworks.test.ts`
  count assertion (`FRAMEWORKS.length`) together.

## 7. Time & Clocks — the 9-day ladder (redesigned 2026-07-11, don't "simplify" away)

Rebuilt per `docs/superpowers/specs/2026-07-11-time-clocks-redesign-design.md` after the
original text-only version proved unintuitive. Design law: **see it / count it — never
memorize it.** The wrap past 12 and the a.m./p.m. flip HAPPEN on screen while she counts;
"−12"/"+12" appear only as "✨ magic shortcut" hint text, never as a required step.

- **Two chapters on the home page** (`time-ladder.ts`): 🏠 Aoife's Day (Days 1–5: am-pm,
  hop-hours, past-noon, clock-add, clock-24) and 🌍 Around the World (Days 6–9:
  time-difference, time-zones, chained-zones, flight-zones). One new idea per day; a
  "⭐ start here" ring marks the first un-soloed day. **Nothing is locked.**
- **Chips:** every time value in this family is a `[[7|am]]` token (`chip()` in
  `lib/clock.ts`), rendered as a gold ☀️ a.m. / purple 🌙 p.m. pill by
  `lib/engine/rich.tsx`. **Never write a naked time string.** a.m./p.m. is always taught as
  before-lunch ☀️ / after-lunch 🌙; noon = 🥪 lunchtime; midnight = 💤 mid-sleep.
- **Interactive steps:** `input:'clock-set'` (hop the hour hand; cumulative angle so the
  sweep goes FORWARD through 12) and `input:'line-hop'` (hop the 24-cell strip; `mode:
  'land' | 'count'`, `row: 'h12' | 'h24'`, optional `target` 🚩 cell that stops the hop) — both submit numbers and validate exactly like
  `number` steps. Watch stage auto-plays them (`demo` prop).
- **Warm-ups:** Days 2–9 open with a `warmup: true` step from *yesterday's* skill
  (factories in `time-shared.ts`). Lead skips question-picking for warm-ups; Solo never
  shows steps, so warm-ups stay out of it. Warm-up answers don't need to feed the final.
- **Story realism:** Days 1–5 star Aoife herself and all start-times stay inside her waking
  day (no 1 a.m. painting). Whole hours only (`lib/clock.ts` — minutes never change).
- The last step of every time framework is the numeric landing step (contract rule 4).
