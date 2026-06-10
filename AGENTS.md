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

- **18 frameworks** (e.g. "Two Kinds · Count & Legs", "Sharing with Leftovers",
  "Fenceposts & Spacing", "Shape Equations", "Number Bonds"…), grouped into 5 families on
  the home grid (`app/page.tsx`).
- **4-stage ladder per framework** (`lib/engine/`): **Watch** (app works it, narrating each
  question + answer) → **Together** (app asks, she answers, hint on error) → **Lead** (she
  *chooses which question to ask next*, then answers it) → **Solo** (fresh problem, she
  enters only the final answer; confetti on success).
- **iPad-first**: big touch targets, on-screen numpad, tap over typing, **text only** (no
  audio), works offline during play (no runtime network calls; confetti bundled from npm).
- **No visible timer, no speed pressure.** Concept mastery, not racing.

## 2. Architecture — how a framework works (the important part)

One **shared engine** (`lib/engine/StageEngine.tsx` + `StageRunner.tsx`) renders all four
stages from a single `Problem` object. **Each framework is a self-contained module** at
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

1. Every `input:'number'` step `answer` is a **non-negative integer**.
2. Every step has **≥2 `decoyQuestions`**, none equal to its own `ask`, and a non-empty `hint`.
3. Every `input:'choice'` step has ≥2 `choices`, one of which has `.value === answer`.
4. Every `finalAnswers[i].value` is a **non-negative integer**.
5. `invariant(data)` is **true** for every generated problem.

**Keep the arithmetic small and clean.** The child is ~7 and good at computation — the
*thinking* is the challenge, never the numbers. If a generated value could go negative or
fractional, fix the generation ranges so it can't.

## 3. Figures

Frameworks that need a picture set `Problem.figure` to a `FigureSpec`; `lib/figures/Figure.tsx`
dispatches on `spec.kind` to a pure component: `numberBond`, `bars`, `dotArray`, `postRow`,
`sequence`, `grid`, `shapes`. No external assets — all generated SVG/flex.

## 4. Progress

`lib/progress.ts` stores per-framework progress under `localStorage["aoife-frameworks-progress"]`:
`{ stageReached: 1..4, soloPasses, lastPlayed }`. Stages unlock in order (the next rung is
always available); the home grid shows pips + a ⭐ once soloed. **Parent peek:** 5 quick taps
on the home title opens a hidden progress overlay (mirrors the sibling app's gesture).

> **Lint gotcha (from the sibling repo):** never call `Date.now()` / `new Date()` /
> `Math.random()` during render — eslint `react-hooks/purity` will fail. Keep them in event
> handlers or effects (e.g. seed the problem in a `useEffect`, not in render).

## 5. Repo layout

```
app/page.tsx            — home grid (18 tiles by family) + progress + parent peek
app/f/[id]/page.tsx     — framework screen; mounts <StageEngine>
app/globals.css         — Tailwind v4 theme (pink/purple, Bubblegum Sans) + framework classes
lib/types.ts            — Framework / Problem / Step / FigureSpec / Stage
lib/rng.ts              — seedable RNG (deterministic generators)
lib/progress.ts         — localStorage progress
lib/engine/             — StageEngine, StageRunner, Numpad, ChoicePad
lib/figures/            — Figure dispatcher + 7 figure components
lib/frameworks/<id>.ts  — one framework each (generator + question-script)
lib/frameworks/index.ts — FRAMEWORKS registry + byId() + FAMILIES
lib/frameworks/frameworks.test.ts — the 500-seed self-test harness
docs/superpowers/       — design spec + implementation plan
```

`npm run dev` / `npm run build` / `npm run lint` / `npm test` (Vitest). No env vars, no secrets.

## 6. Gotchas

- **Never commit `node_modules` or npm caches.** `.gitignore` covers them (the old
  `aoife-subtraction-game` repo once committed a 469MB cache — don't repeat it).
- **No CDN runtime deps.** `canvas-confetti` is bundled from npm and imported in
  `StageRunner.tsx` — do not reintroduce a CDN `<script>` (the sibling repo deliberately
  removed one for offline/flaky-wifi resilience).
- **Vercel deploy:** if the GitHub App link isn't authorized for this repo, use
  `vercel --prod` from the CLI (same situation as `aoife-math`).
- Adding/removing a framework: update `lib/frameworks/index.ts` and the `frameworks.test.ts`
  count assertion (`FRAMEWORKS.length`) together.
