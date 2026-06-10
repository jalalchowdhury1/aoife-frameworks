# Aoife Frameworks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a static, iPad-first Next.js web app that teaches Aoife 18 math-reasoning *frameworks*, each as a fixed "question-script" climbed through a 4-stage ladder (Watch → Together → Lead → Solo), with parameterized generators so every replay is a fresh, solvable problem.

**Architecture:** One **shared stage engine** renders all four stages from a single `Problem` object. Each framework is a self-contained module exporting a `generate(rng)` function (random story-skin + numbers, always solvable) and a question-script baked into the returned `Problem.steps`. The engine, numpad, hint logic, and figure components are shared and never edited when adding frameworks. Progress lives in `localStorage`. No backend.

**Tech Stack:** Next.js 16.2.1 (App Router) · React 19.2.4 · TypeScript 5 (strict) · Tailwind v4 (`@tailwindcss/postcss`) · `canvas-confetti` (bundled) · Vitest (generator self-tests) · deploy to Vercel. Mirrors the sibling `aoife-math` repo.

**Source of truth for content:** `docs/superpowers/specs/2026-06-10-aoife-frameworks-design.md`. Every framework's generator math + script is fully specified in **Phase 4 / §Framework Catalog** below.

---

## File Structure

```
package.json                       — deps mirror aoife-math + vitest
next.config.ts, tsconfig.json,     — copied verbatim from aoife-math
  postcss.config.mjs, eslint.config.mjs
vitest.config.ts                   — node env, picks up lib/**/*.test.ts
app/layout.tsx                     — metadata + fonts (from sibling)
app/globals.css                    — sibling theme + a few framework classes
app/page.tsx                       — HOME: 18 framework tiles grouped by family + progress
app/f/[id]/page.tsx                — framework screen; resolves id → framework, mounts <StageEngine>
lib/rng.ts                         — seedable RNG (mulberry32) + helpers (int, pick, shuffle)
lib/types.ts                       — Step, Problem, Framework, FigureSpec, Stage
lib/progress.ts                    — localStorage read/write (stageReached, soloPasses)
lib/engine/StageEngine.tsx         — the 4-stage state machine + layout
lib/engine/Numpad.tsx              — reused numpad (number input)
lib/engine/ChoicePad.tsx           — tap-to-choose buttons (choice steps / Lead questions)
lib/engine/useStageRunner.ts       — hook driving step progression per stage
lib/figures/Figure.tsx             — dispatch on FigureSpec.kind
lib/figures/*.tsx                  — NumberBond, Bars, DotArray, PostRow, Sequence, Grid, Shapes
lib/frameworks/index.ts            — FRAMEWORKS registry (array of all 18) + byId()
lib/frameworks/<id>.ts             — one file per framework (generator + script)
lib/frameworks/_template.ts        — copy-me reference (documented)
lib/frameworks/frameworks.test.ts  — generic self-test harness across all registered frameworks
AGENTS.md                          — single source of truth (generator contract, no-CDN, no-backend)
```

**Families & ids** (registry order):
1. Counting & Grouping: `sharing-leftovers`, `equal-groups`, `fenceposts`, `how-many-different`
2. Comparing & Parts: `more-fewer`, `part-part-whole`, `compare-bar`
3. Reasoning to a Hidden Number: `two-kinds`, `two-clue`, `guess-check`, `working-backwards`, `shape-equations`, `cross-number-grid`
4. Patterns & Structure: `number-bonds`, `patterns-rules`
5. Multi-Step & Real-World: `multi-step-money`, `time-elapsed`, `measure-units`

---

## Phase 0 — Scaffold

### Task 0.1: Copy sibling config + create package.json

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs`, `next-env.d.ts`, `vitest.config.ts`

- [ ] **Step 1: Copy config verbatim from `../aoife-math`** for `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs`, `next-env.d.ts`.

- [ ] **Step 2: Write `package.json`** (sibling deps + vitest, name changed, `test` script added):

```json
{
  "name": "aoife-frameworks",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run"
  },
  "dependencies": {
    "canvas-confetti": "^1.9.4",
    "next": "16.2.1",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/canvas-confetti": "^1.9.0",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.1",
    "tailwindcss": "^4",
    "typescript": "^5",
    "vitest": "^3"
  }
}
```

- [ ] **Step 3: Write `vitest.config.ts`:**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["lib/**/*.test.ts"] },
});
```

- [ ] **Step 4: Install** with an isolated cache to avoid the EACCES issue the sibling repo hit:

Run: `npm install --cache /tmp/npm-cache-aoife-frameworks`
Expected: `node_modules/` populated, exit 0. (If native-module errors recur, copy `node_modules` from `../aoife-math` then `npm install` again.)

- [ ] **Step 5: Commit.** `git add -A && git commit -m "chore: scaffold Next.js + Vitest config"`

### Task 0.2: layout, globals.css, favicon

**Files:** Create `app/layout.tsx`, `app/globals.css`

- [ ] **Step 1:** Copy `app/globals.css` verbatim from `../aoife-math` and append framework-specific classes:

```css
/* Framework UI */
.card-tile { @apply bg-white border-4 border-purple-200 rounded-3xl p-4 shadow-lg transition-all active:scale-95 hover:border-purple-400; }
.step-done { @apply bg-green-50 border-2 border-green-200 rounded-2xl; }
.step-active { @apply bg-white border-4 border-purple-400 rounded-2xl; }
.step-locked { @apply bg-gray-100 text-gray-400 rounded-2xl; }
.q-choice { @apply bg-white border-4 border-purple-200 rounded-2xl text-left active:scale-95 hover:border-purple-400; }
```

- [ ] **Step 2:** Copy `app/layout.tsx` from sibling; change `metadata.title` to `"Aoife — Math Detective"`, description to `"Learn the questions to ask for any math puzzle."`

- [ ] **Step 3:** Copy `app/favicon.ico` from sibling.

- [ ] **Step 4: Commit.** `git commit -am "chore: theme + layout from sibling"`

---

## Phase 1 — Core types & RNG (TDD)

### Task 1.1: `lib/rng.ts`

**Files:** Create `lib/rng.ts`, `lib/rng.test.ts`

- [ ] **Step 1: Failing test** `lib/rng.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { makeRng } from "./rng";

describe("rng", () => {
  it("is deterministic for a seed", () => {
    const a = makeRng(42), b = makeRng(42);
    expect(a.int(1, 100)).toBe(b.int(1, 100));
  });
  it("int respects inclusive bounds", () => {
    const r = makeRng(7);
    for (let i = 0; i < 500; i++) {
      const n = r.int(3, 6);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(6);
    }
  });
  it("pick returns a member; shuffle preserves members", () => {
    const r = makeRng(1);
    expect([10, 20, 30]).toContain(r.pick([10, 20, 30]));
    expect(r.shuffle([1, 2, 3, 4]).sort()).toEqual([1, 2, 3, 4]);
  });
});
```

- [ ] **Step 2: Run, expect FAIL.** `npm test -- rng`

- [ ] **Step 3: Implement `lib/rng.ts`:**

```ts
export interface Rng {
  next(): number;            // [0,1)
  int(min: number, max: number): number;  // inclusive
  pick<T>(arr: readonly T[]): T;
  shuffle<T>(arr: readonly T[]): T[];
}

export function makeRng(seed: number): Rng {
  let s = seed >>> 0;
  const next = () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  const pick = <T,>(arr: readonly T[]): T => arr[int(0, arr.length - 1)];
  const shuffle = <T,>(arr: readonly T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = int(0, i); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  return { next, int, pick, shuffle };
}

// Convenience for non-deterministic play; tests always pass an explicit seed.
export const randomSeed = () => Math.floor(Math.random() * 2 ** 31);
```

- [ ] **Step 4: Run, expect PASS.** `npm test -- rng`
- [ ] **Step 5: Commit.** `git commit -am "feat: seedable rng"`

### Task 1.2: `lib/types.ts`

**Files:** Create `lib/types.ts` (no test; consumed by everything)

- [ ] **Step 1: Write:**

```ts
import type { Rng } from "./rng";

export type Stage = "watch" | "together" | "lead" | "solo";
export const STAGES: Stage[] = ["watch", "together", "lead", "solo"];
export const STAGE_LABEL: Record<Stage, string> = {
  watch: "👀 Watch", together: "🤝 Together", lead: "🧭 Lead", solo: "🦋 Solo",
};

export type InputKind = "number" | "choice";
export interface Choice { label: string; value: number | string; }

export interface Step {
  id: string;
  ask: string;                 // the self-question with values filled in
  answer: number | string;     // expected answer
  input: InputKind;
  choices?: Choice[];          // when input === "choice"
  hint: string;                // nudge after a wrong attempt — never the answer
  decoyQuestions: string[];    // Lead stage: plausible-but-wrong "next questions"
}

export interface FigureSpec { kind: string; [k: string]: unknown; }

export interface Problem {
  promptText: string;
  figure?: FigureSpec;
  steps: Step[];
  finalAsk: string;
  finalAnswers: { label: string; value: number }[];
  data: Record<string, number>;   // structured numbers used by the self-test invariant
}

export interface Framework {
  id: string;
  title: string;
  emoji: string;
  family: string;
  blurb: string;
  source: "photo" | "added";
  generate(rng: Rng): Problem;
  invariant(data: Record<string, number>): boolean;  // test-only: must hold for every generated problem
}
```

- [ ] **Step 2: Commit.** `git commit -am "feat: core types"`

### Task 1.3: `lib/progress.ts` (TDD)

**Files:** Create `lib/progress.ts`, `lib/progress.test.ts`

- [ ] **Step 1: Failing test** (uses a localStorage shim):

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { readProgress, recordStageDone, recordSolo, PROGRESS_KEY } from "./progress";

const store: Record<string, string> = {};
beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { for (const k of Object.keys(store)) delete store[k]; },
    key: () => null, length: 0,
  } as Storage;
});

describe("progress", () => {
  it("starts empty", () => { expect(readProgress()["two-kinds"]).toBeUndefined(); });
  it("records highest stage reached", () => {
    recordStageDone("two-kinds", "watch");
    recordStageDone("two-kinds", "together");
    expect(readProgress()["two-kinds"].stageReached).toBe(2); // 1 watch,2 together,3 lead,4 solo
  });
  it("never lowers stageReached", () => {
    recordStageDone("two-kinds", "lead");      // 3
    recordStageDone("two-kinds", "watch");     // 1 — ignored
    expect(readProgress()["two-kinds"].stageReached).toBe(3);
  });
  it("counts solo passes", () => {
    recordSolo("fenceposts"); recordSolo("fenceposts");
    expect(readProgress()["fenceposts"].soloPasses).toBe(2);
    expect(readProgress()["fenceposts"].stageReached).toBe(4);
  });
  it("persists under the documented key", () => {
    recordStageDone("x", "watch");
    expect(JSON.parse(store[PROGRESS_KEY])["x"].stageReached).toBe(1);
  });
});
```

- [ ] **Step 2: Run, expect FAIL.** `npm test -- progress`
- [ ] **Step 3: Implement `lib/progress.ts`:**

```ts
import { Stage, STAGES } from "./types";

export const PROGRESS_KEY = "aoife-frameworks-progress";
export interface FwProgress { stageReached: number; soloPasses: number; lastPlayed: string; }
export type Progress = Record<string, FwProgress>;

const stageIndex = (s: Stage) => STAGES.indexOf(s) + 1; // 1..4

export function readProgress(): Progress {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "{}"); }
  catch { return {}; }
}
function write(p: Progress) { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); }
function entry(p: Progress, id: string): FwProgress {
  return p[id] ?? { stageReached: 0, soloPasses: 0, lastPlayed: "" };
}
const today = () => new Date().toISOString().slice(0, 10);

export function recordStageDone(id: string, stage: Stage) {
  const p = readProgress(); const e = entry(p, id);
  e.stageReached = Math.max(e.stageReached, stageIndex(stage));
  e.lastPlayed = today(); p[id] = e; write(p);
}
export function recordSolo(id: string) {
  const p = readProgress(); const e = entry(p, id);
  e.stageReached = Math.max(e.stageReached, 4);
  e.soloPasses += 1; e.lastPlayed = today(); p[id] = e; write(p);
}
export const isUnlocked = (p: Progress, id: string, stage: Stage) =>
  stageIndex(stage) <= entry(p, id).stageReached + 1; // next rung is always unlocked
```

> **Note on `new Date()`:** the sibling repo hit `react-hooks/purity` lint on `Date.now()` inside render. These calls live in event handlers / plain functions (never in render), so they are fine. Do not call `today()` during render.

- [ ] **Step 4: Run, expect PASS.** `npm test -- progress`
- [ ] **Step 5: Commit.** `git commit -am "feat: localStorage progress"`

---

## Phase 2 — Figures

Each figure is a pure presentational component taking a typed spec. Build the dispatcher + the seven figure kinds. These are visual; verify by eye in Phase 5, but keep them pure and trivial.

### Task 2.1: Figure dispatcher + components

**Files:** Create `lib/figures/Figure.tsx` and one component per kind.

- [ ] **Step 1: `lib/figures/Figure.tsx`** dispatches on `spec.kind`:

```tsx
import type { FigureSpec } from "../types";
import { NumberBond } from "./NumberBond";
import { Bars } from "./Bars";
import { DotArray } from "./DotArray";
import { PostRow } from "./PostRow";
import { Sequence } from "./Sequence";
import { Grid } from "./Grid";
import { Shapes } from "./Shapes";

export function Figure({ spec }: { spec?: FigureSpec }) {
  if (!spec) return null;
  switch (spec.kind) {
    case "numberBond": return <NumberBond spec={spec} />;
    case "bars": return <Bars spec={spec} />;
    case "dotArray": return <DotArray spec={spec} />;
    case "postRow": return <PostRow spec={spec} />;
    case "sequence": return <Sequence spec={spec} />;
    case "grid": return <Grid spec={spec} />;
    case "shapes": return <Shapes spec={spec} />;
    default: return null;
  }
}
```

- [ ] **Step 2:** Implement each figure component as a small SVG/flex render. Specs (the generator fills these):
  - `NumberBond`: `{ kind:"numberBond", circles:(number|null)[], squares:(number|null)[] }` — circles in a row, squares between, `null` shown as `?`.
  - `Bars`: `{ kind:"bars", bars:{label:string,value:number,known:boolean}[], unit?:string }` — horizontal bars scaled to max; unknown bars hatched.
  - `DotArray`: `{ kind:"dotArray", rows:number, cols:number }` — grid of ● (rows known, cols known).
  - `PostRow`: `{ kind:"postRow", posts:number, spacing:number, unit:string }` — `|—|—|` with one gap labeled.
  - `Sequence`: `{ kind:"sequence", terms:(number|null)[] }` — boxes left-to-right, `null` as `?`.
  - `Grid`: `{ kind:"grid", cells:(number|string|null)[][] }` — table; `null` cells render an input slot placeholder.
  - `Shapes`: `{ kind:"shapes", equations:string[] }` — renders the shape equations big (shapes are emoji 🔶🟣⭐ substituted in strings).

- [ ] **Step 3: Commit.** `git commit -am "feat: figure components"`

---

## Phase 3 — The shared stage engine

### Task 3.1: Numpad + ChoicePad

**Files:** Create `lib/engine/Numpad.tsx`, `lib/engine/ChoicePad.tsx`

- [ ] **Step 1: `Numpad.tsx`** — 3-col grid `1..9,0,C,✔︎` using `.btn-numpad*` classes from globals.css. Props: `value: string`, `onDigit(d)`, `onClear()`, `onSubmit()`, `disabled`. Min 44px targets. Submit disabled when empty.

- [ ] **Step 2: `ChoicePad.tsx`** — vertical list of big `.q-choice` buttons. Props: `choices:{label,value}[]`, `onPick(value)`. Used for `input:"choice"` steps and for the **Lead** question-selection (where each button is a candidate next-question).

- [ ] **Step 3: Commit.** `git commit -am "feat: numpad + choicepad"`

### Task 3.2: `useStageRunner` hook

**Files:** Create `lib/engine/useStageRunner.ts`

Drives progression through `problem.steps` for a given stage. Behavior matrix:
- **watch:** auto-reveal each step's `ask` + `answer`; user taps "Next"; no checking.
- **together:** show `step.ask`; user answers via numpad/choicepad; compare to `step.answer`; wrong → show `step.hint`, allow a 2nd try; 2nd wrong → reveal answer softly, advance.
- **lead:** first show a **question chooser** (correct `step.ask` + `step.decoyQuestions`, shuffled by rng) → on correct pick, fall through to the same answer flow as `together`; wrong question pick → gentle "not yet — that one comes later / that won't help" nudge.
- **solo:** skip per-step; show only `promptText` + `figure` + `finalAsk`; user enters each `finalAnswers[i].value` (one numpad field per answer, in order); all correct → done.

- [ ] **Step 1: Implement the hook** exposing `{ phase, currentStep, revealed, askChoices, submitNumber, pickChoice, next, isDone }`. Keep it a pure reducer over `{stepIdx, tries, mode}`; no timers except the existing app's 1.2s feedback pause (via `setTimeout` in an effect, cleared on unmount).

- [ ] **Step 2: Commit.** `git commit -am "feat: stage runner hook"`

### Task 3.3: `StageEngine.tsx`

**Files:** Create `lib/engine/StageEngine.tsx`

- [ ] **Step 1:** Component props: `{ framework: Framework }`. On mount, pick `stage = next unlocked` from progress (or a stage chosen via a top stage-picker), `generate` a problem with a fresh `randomSeed()`, render:
  - header: emoji + title + current stage label + a stage picker (only unlocked stages tappable)
  - the `promptText` card + `<Figure spec={problem.figure}/>`
  - the script area driven by `useStageRunner`
  - numpad/choicepad as the active input
  - on stage completion: `recordStageDone`/`recordSolo`, confetti (bundled `canvas-confetti`, dynamic import) on `solo`, then offer "Again" (new problem same stage) / "Next stage" (if unlocked) / "Home".

- [ ] **Step 2:** Reuse confetti exactly like sibling: `import confetti from "canvas-confetti"` (no CDN).

- [ ] **Step 3: Commit.** `git commit -am "feat: stage engine"`

### Task 3.4: Framework route

**Files:** Create `app/f/[id]/page.tsx`

- [ ] **Step 1:** `"use client"`; read `params.id`; `const fw = byId(id)`; if missing → link home; else `<StageEngine framework={fw} />`. (Dynamic params: use `use(params)` per Next 16.)

- [ ] **Step 2: Commit.** `git commit -am "feat: framework route"`

---

## Phase 4 — The 18 frameworks

### Task 4.0: Self-test harness (TDD — write FIRST, it guards every framework)

**Files:** Create `lib/frameworks/index.ts` (start with `[]`), `lib/frameworks/frameworks.test.ts`

- [ ] **Step 1: Write the harness** `lib/frameworks/frameworks.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { FRAMEWORKS } from "./index";
import { makeRng } from "../rng";

describe("every framework generator", () => {
  for (const fw of FRAMEWORKS) {
    it(`${fw.id}: 500 solvable, consistent problems`, () => {
      for (let seed = 1; seed <= 500; seed++) {
        const p = fw.generate(makeRng(seed));
        expect(p.steps.length, `${fw.id} has steps`).toBeGreaterThan(0);
        expect(p.finalAnswers.length).toBeGreaterThan(0);
        // every numeric step answer is a finite, whole, non-negative number
        for (const s of p.steps) {
          if (s.input === "number") {
            const v = s.answer as number;
            expect(Number.isInteger(v) && v >= 0, `${fw.id} step ${s.id}=${v}`).toBe(true);
          }
          // Lead needs at least 2 decoys, none equal to the real question
          expect(s.decoyQuestions.length).toBeGreaterThanOrEqual(2);
          expect(s.decoyQuestions).not.toContain(s.ask);
          expect(s.hint.length).toBeGreaterThan(0);
        }
        for (const fa of p.finalAnswers) {
          expect(Number.isInteger(fa.value) && fa.value >= 0).toBe(true);
        }
        // framework-specific truth
        expect(fw.invariant(p.data), `${fw.id} invariant @${seed}`).toBe(true);
      }
    });
  }
  it("registry has 18 unique ids", () => {
    expect(FRAMEWORKS.length).toBe(18);
    expect(new Set(FRAMEWORKS.map(f => f.id)).size).toBe(18);
  });
});
```

- [ ] **Step 2: Run, expect FAIL** (registry has 18-unique assertion failing / empty). `npm test -- frameworks`
- [ ] **Step 3: Commit.** `git commit -am "test: framework self-test harness"`

### Task 4.1: Reference framework `two-kinds` (full code — the template every other framework copies)

**Files:** Create `lib/frameworks/two-kinds.ts`; register in `index.ts`.

- [ ] **Step 1: Write `lib/frameworks/two-kinds.ts`:**

```ts
import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";

const SKINS = [
  { a: "ducks", b: "goats", la: 2, lb: 4, unit: "legs" },
  { a: "hens",  b: "cows",  la: 2, lb: 4, unit: "legs" },
  { a: "kids",  b: "dogs",  la: 2, lb: 4, unit: "legs" },
  { a: "bikes", b: "trikes", la: 2, lb: 3, unit: "wheels" },
];

export const twoKinds: Framework = {
  id: "two-kinds",
  title: "Two Kinds · Count & Legs",
  emoji: "🐐",
  family: "Reasoning to a Hidden Number",
  blurb: "Two kinds share a total and a total of legs/wheels — find how many of each.",
  source: "photo",
  invariant: (d) => d.la * d.countA + d.lb * d.countB === d.attr && d.countA + d.countB === d.total,
  generate(rng: Rng): Problem {
    const s = rng.pick(SKINS);
    const total = rng.int(8, 14);
    const countB = rng.int(2, total - 2);
    const countA = total - countB;
    const attr = s.la * countA + s.lb * countB;
    const allA = s.la * total;
    const extra = attr - allA;
    const perSwap = s.lb - s.la;

    const steps: Step[] = [
      { id: "kinds", input: "choice",
        ask: "What two kinds of things are in this problem?",
        choices: [
          { label: `${s.a} & ${s.b}`, value: `${s.a} & ${s.b}` },
          { label: `${s.unit} & legs`, value: "x1" },
          { label: `boxes & bags`, value: "x2" },
        ],
        answer: `${s.a} & ${s.b}`,
        hint: `Look at the very first sentence — the two animals/vehicles named.`,
        decoyQuestions: [`What is ${total} + ${attr}?`, `How many ${s.b} are there?`] },
      { id: "total", input: "number",
        ask: `How many ${s.a} and ${s.b} are there ALTOGETHER?`,
        answer: total,
        hint: `It's the "in all" number near the start.`,
        decoyQuestions: [`How many ${s.unit} altogether?`, `How many ${s.b}?`] },
      { id: "legs", input: "number",
        ask: `How many ${s.unit} does ONE ${s.b} have?`,
        answer: s.lb,
        hint: `A ${s.b} has ${s.lb} ${s.unit}.`,
        decoyQuestions: [`How many ${s.unit} does one ${s.a} have?`, `What is ${total} − ${attr}?`] },
      { id: "allA", input: "number",
        ask: `Pretend ALL ${total} were ${s.a} (the ${s.la}-${s.unit} kind). How many ${s.unit} is that?`,
        answer: allA,
        hint: `${total} ${s.a}, each with ${s.la} ${s.unit}: ${total} × ${s.la}.`,
        decoyQuestions: [`What is ${total} + ${attr}?`, `How many ${s.b} are there?`] },
      { id: "extra", input: "number",
        ask: `But there are really ${attr} ${s.unit}. How many EXTRA ${s.unit}?`,
        answer: extra,
        hint: `Real ${s.unit} minus the pretend ${s.unit}: ${attr} − ${allA}.`,
        decoyQuestions: [`What is ${attr} + ${allA}?`, `How many ${s.a}?`] },
      { id: "perSwap", input: "number",
        ask: `Each time we swap one ${s.a} for one ${s.b}, how many MORE ${s.unit}?`,
        answer: perSwap,
        hint: `A ${s.b} has ${s.lb}, a ${s.a} has ${s.la}: ${s.lb} − ${s.la}.`,
        decoyQuestions: [`How many ${s.b} are there?`, `What is ${s.lb} + ${s.la}?`] },
      { id: "countB", input: "number",
        ask: `So how many ${s.b} are there? (extra ÷ ${perSwap})`,
        answer: countB,
        hint: `${extra} extra ${s.unit}, ${perSwap} per swap: ${extra} ÷ ${perSwap}.`,
        decoyQuestions: [`How many ${s.a}?`, `What is ${extra} × ${perSwap}?`] },
      { id: "countA", input: "number",
        ask: `And how many ${s.a}? (${total} − ${countB})`,
        answer: countA,
        hint: `The rest of the ${total}: ${total} − ${countB}.`,
        decoyQuestions: [`What is ${total} + ${countB}?`, `How many ${s.unit}?`] },
    ];

    return {
      promptText: `There are ${total} ${s.a} and ${s.b} in all. If there are ${attr} ${s.unit}, how many ${s.a} and how many ${s.b} are there?`,
      steps,
      finalAsk: `How many ${s.a}? How many ${s.b}?`,
      finalAnswers: [{ label: s.a, value: countA }, { label: s.b, value: countB }],
      data: { total, attr, la: s.la, lb: s.lb, countA, countB },
    };
  },
};
```

- [ ] **Step 2: Register** in `lib/frameworks/index.ts`:

```ts
import type { Framework } from "../types";
import { twoKinds } from "./two-kinds";
// ...import the other 17 as they're added
export const FRAMEWORKS: Framework[] = [twoKinds /*, ...*/];
export const byId = (id: string) => FRAMEWORKS.find(f => f.id === id);
```

- [ ] **Step 3: Run** `npm test -- frameworks` — the `two-kinds` 500-seed test must PASS (the "18 unique ids" test will still fail until all are added; that's expected this task).
- [ ] **Step 4: Commit.** `git commit -am "feat(fw): two-kinds reference framework"`

### Tasks 4.2 – 4.18: the remaining 17 frameworks

> **Method:** copy `two-kinds.ts`, keep the same shape (skins → generated values → `steps[]` with `ask/answer/input/hint/decoyQuestions` → `promptText/finalAsk/finalAnswers/data` → `invariant`). One framework per task; register, run its 500-seed self-test green, commit `feat(fw): <id>`. Each framework's exact math, script, decoys, figure, and invariant are below. **Keep all arithmetic small/clean** so the thinking is the only challenge.

#### Framework Catalog (complete specs)

**`sharing-leftovers`** ⭐ (Counting & Grouping) · figure: none
Skins: (empanadas, boxes), (cookies, plates), (stickers, pages), (marbles, friends), (pencils, cups).
Gen: `g = rng.int(3,6)`, `q = rng.int(2,7)`, `r = rng.int(1,g-1)`, `N = q*g + r`; `variant = rng.pick(["leftover","groups","roundup"])`.
Script: (1) `How many fit in each ${box}?`→`g` · (2) choice `What is this question really asking?` choices=[“how many left over”, “how many full ${boxes}”, “how many ${boxes} to hold them ALL”]→ the variant’s phrase · (3) `What is the biggest number of ${items} that fills whole ${boxes}? (×${g})`→`q*g` · (4) `How many full ${boxes} is that?`→`q` · (5) `How many ${items} are left over?`→`r`.
finalAsk/Answer by variant: leftover→`r`; groups→`q`; roundup→`q + (r>0?1:0)`.
Decoys: e.g. step2 wrong asks "add them all?"; step3 "what is N + g?".
data: `{N,g,q,r}`. invariant: `q*g + r === N && r >= 1 && r < g`.

**`equal-groups`** ➕ (Counting & Grouping) · figure: `dotArray {rows:groups, cols:each}`
Skins: (bags, marbles), (boxes, crayons), (plates, cookies), (vases, flowers), (shelves, books).
Gen: `groups=rng.int(2,6)`, `each=rng.int(2,9)`, `total=groups*each`; `variant=rng.pick(["total","each"])`.
total: `${groups} ${bags}, ${each} ${marbles} each — how many in all?`→`total`. Script: `how many ${bags}?`→groups · `how many in each?`→each · `groups × each`→total.
each: `${total} ${marbles} shared equally into ${groups} ${bags} — how many each?`→`each`. Script: `how many in all?`→total · `how many ${bags}?`→groups · `total ÷ groups`→each.
data `{groups,each,total}`. invariant: `groups*each===total`.

**`fenceposts`** ⭐ (Counting & Grouping) · figure: `postRow {posts:gaps+1, spacing:s, unit}`
Skins: (stakes, line), (trees, path), (posts, fence), (lamp posts, street), (flags, track). unit = inches/feet/meters.
Gen: `s=rng.int(2,5)`, `gaps=rng.int(3,9)`, `D=s*gaps`. Both ends included.
Script: (1) choice `Are there ${stakes} at BOTH ends, or only in the gaps?`→“both ends” · (2) `How far apart are they (and how long is the whole line)?`→`s` · (3) `How many GAPS fit? (${D} ÷ ${s})`→`gaps` · (4) `Posts = gaps + 1. How many ${stakes}?`→`gaps+1`.
finalAnswer `gaps+1`. Decoys: offer “${D} ÷ ${s}” as the final (the classic off-by-one), “${D} + ${s}”.
data `{s,gaps,D,posts:gaps+1}`. invariant: `D===s*gaps && data.posts===gaps+1`.

**`how-many-different`** ⭐ (Counting & Grouping) · figure: `shapes`-style list of the number set (or none)
Variant `products`: `set = rng.shuffle([2,3,4,5,6]).slice(0,4)`. Compute distinct products of unordered distinct pairs; `answer = distinct.size`.
Script: (1) `How many pairs can you make?` (choice or number = C(4,2)=6) · (2) `Multiply each pair — write them all.` (informational; answer = list length 6) · (3) `Cross out any duplicates. How many DIFFERENT products?`→`answer`.
Because duplicates are the whole lesson, prefer sets that sometimes collide (e.g. {2,3,4,6}: 2·6=3·4=12). finalAnswer `answer`.
Decoys: “add the numbers”, “how many numbers are in the box?”.
data `{pairs:6, distinct:answer}`. invariant: `data.distinct>=1 && data.distinct<=6`.

**`more-fewer`** ➕ (Comparing & Parts) · figure: `bars` (two known bars)
Skins: (Aoife, her friend, stickers), (red, blue, marbles), (apples, oranges).
Gen: `big=rng.int(8,30)`, `small=rng.int(2,big-1)`, `diff=big-small`; `variant=rng.pick(["more","fewer"])` (same answer, different wording).
Script: (1) choice `Which is bigger?`→the bigger label · (2) `Line them up — what is bigger − smaller? (${big} − ${small})`→`diff` · (3) choice `Re-read: is it asking how many MORE, how many FEWER, or the TOTAL?`→“more/fewer”.
finalAnswer `diff`. data `{big,small,diff}`. invariant: `big-small===diff && diff>=1`.

**`part-part-whole`** ➕ (Comparing & Parts) · figure: `bars` one whole split, one part unknown
Skins: (flowers: red / rest), (kids: boys / girls), (fruit: apples / rest).
Gen: `whole=rng.int(10,30)`, `partA=rng.int(2,whole-2)`, `partB=whole-partA`.
Script: (1) `What is the WHOLE (the total)?`→`whole` · (2) `What part do you already know?`→`partA` · (3) `Missing part = whole − known. (${whole} − ${partA})`→`partB`.
finalAnswer `partB`. data `{whole,partA,partB}`. invariant: `partA+partB===whole`.

**`compare-bar`** ➕ (Comparing & Parts) · figure: `bars` two unknown bars + brace
Skins: (Sam / Mia, marbles), (red / blue, beads).
Gen: `smaller=rng.int(3,12)`, `m=rng.int(2,8)`, `bigger=smaller+m`, `total=bigger+smaller`.
Prompt: `${A} has ${m} more ${marbles} than ${B}. Together they have ${total}. How many does each have?`
Script: (1) `Who has more, and by how much?`→`m` · (2) `Take the extra off the total: ${total} − ${m}`→`total-m` · (3) `That leaves two equal bars. (${total-m}) ÷ 2 = ${B}'s amount`→`smaller` · (4) `${A} = ${B} + ${m}`→`bigger`.
finalAnswers A=bigger, B=smaller. data `{m,total,smaller,bigger}`. invariant: `bigger===smaller+m && bigger+smaller===total`.

**`two-clue`** ⭐ (Reasoning to a Hidden Number) · figure: none
Skins: (bees, flowers), (kids, chairs), (dogs, bones), (birds, nests).
Gen: `a=rng.int(1,2)`, `b=rng.int(1,2)`; `flowers=a+2*b`, `bees=flowers+a`. (Derivation: `bees=flowers+a` and `bees=2*(flowers-b)` ⇒ `flowers=a+2b`.)
Prompt: `If each ${bee} lands on its own ${flower}, ${a} ${bee(s)} have none. If ${bees} share, 2 on each ${flower}, ${b} ${flower(s)} are left out. How many ${flowers} and ${bees}?`
Script: (1) choice `Clue 1 as a relationship:`→“bees = flowers + ${a}” · (2) choice `Clue 2 as a relationship:`→“bees = 2 × (flowers − ${b})” · (3) `Guess flowers so BOTH are true… flowers = ${a} + 2×${b}`→`flowers` · (4) `Then bees = flowers + ${a}`→`bees`.
finalAnswers flowers, bees. Decoys: the wrong clue relationships. data `{a,b,flowers,bees}`. invariant: `bees===flowers+a && bees===2*(flowers-b)`.

**`guess-check`** ➕ (Reasoning to a Hidden Number) · figure: none
Skins: framed as "two secret numbers".
Gen: `x=rng.int(2,9)`, `y=rng.int(x+1,10)`, `P=x*y`, `S=x+y`.
Prompt: `Two whole numbers multiply to ${P} and add to ${S}. What are they?`
Script: (1) `Make a sensible first guess for the smaller number.` (choice of 3 candidates incl. x)→`x` · (2) `Check: does your pair multiply to ${P}?`→`P` (they compute x·y) · (3) `Check: does it add to ${S}?`→`S` · (4) `So the two numbers are…`→ final.
finalAnswers smaller=x, larger=y. Decoys: "add P and S", "subtract". data `{x,y,P,S}`. invariant: `x*y===P && x+y===S && x<y`.

**`working-backwards`** ➕ (Reasoning to a Hidden Number) · figure: optional `sequence`-style arrow chain (or none)
Skins: (stickers), (coins), (candies).
Gen: `g=rng.int(2,8)` (gave away), `bMore=rng.int(2,8)` (got more), `start=rng.int(12,25)`, `end=start-g+bMore` (ensure `start-g>=0`).
Prompt: `She had some ${stickers}. She gave away ${g}, then got ${bMore} more. Now she has ${end}. How many did she START with?`
Script: (1) `What is the amount at the END?`→`end` · (2) `What happened LAST? (got ${bMore} more) — UNDO it: ${end} − ${bMore}`→`end-bMore` · (3) `What happened before? (gave ${g}) — UNDO it: + ${g}`→`(end-bMore)+g`(=start) · .
finalAnswer `start`. Decoys: "do the steps forwards", "add everything". data `{g,bMore,start,end}`. invariant: `end===start-g+bMore`.

**`shape-equations`** ⭐ (Reasoning to a Hidden Number) · figure: `shapes {equations:[...]}` (🔶🟣⭐)
Gen: pick `d=rng.int(3,9)` (🔶), `c=rng.int(2,9)` (🟣), `st=rng.int(2,9)` (⭐). Equations: `🔶+🔶 = ${2d}`, `🔶+🟣 = ${d+c}`, `🟣+⭐ = ${c+st}`. Final ask: value of ⭐.
Script: (1) choice `Which equation has only ONE kind of shape?`→“🔶+🔶” · (2) `Solve it: 🔶 = ${2d} ÷ 2`→`d` · (3) `Put 🔶 into the 2nd equation. 🟣 = ${d+c} − ${d}`→`c` · (4) `Put 🟣 into the 3rd. ⭐ = ${c+st} − ${c}`→`st`.
finalAnswer ⭐ = st. Decoys: "add all the numbers", picking the two-shape equation first. data `{d,c,st}`. invariant: `Number.isInteger(d)&&Number.isInteger(c)&&Number.isInteger(st)`.

**`cross-number-grid`** ⭐ (Reasoning to a Hidden Number) · figure: `grid {cells}` (also shows the puzzle)
Use a 3×3 **addition** cross. Pick `a,b,d,e = rng.int(1,9)`. Derived: `c=a+b`, `f=d+e`, `g=a+d`, `h=b+e`, `i=c+f`. Layout:
```
a + b = c
+   +   =
d + e = f
=   =   =
g + h = i
```
Blank out exactly 2 cells that are each, at some point, the only unknown in their row or column (e.g. blank `c` and `g`): `c` solved from row1, `g` from col1.
Script: (1) choice `Find a row or column with only ONE empty box.`→“top row” · (2) `Solve it: ${a} + ${b}`→`c` · (3) `Now a column has one empty box. ${a} + ${d}`→`g`.
finalAnswers the two blanks. Decoys: pick a line with two blanks, "multiply the row". data `{a,b,c,d,e,f,g,h,i}`. invariant: `c===a+b && f===d+e && g===a+d && h===b+e && i===c+f`.

**`number-bonds`** ⭐ (Patterns & Structure) · figure: `numberBond {circles, squares}`
A chain of 3 circles `c1,c2,c3` with squares `s1=c1+c2`, `s2=c2+c3` between them.
Gen: `c1=rng.int(20,90)`, `c2=rng.int(20,90)`, `c3=rng.int(20,90)` (keep sums tidy; she's fine with these). Blank pattern (rng pick): blank `s1` (forward add) AND blank `c3` (so `s2` known, `c2` known → subtract back). i.e. show `c1,c2, s2`; ask `s1` and `c3`.
Script: (1) `Each square = its two circles. The first square = ${c1} + ${c2}`→`s1` · (2) `The second square is ${s2}, and one circle is ${c2}. Missing circle = ${s2} − ${c2}`→`c3`.
finalAnswers s1, c3. Decoys: "add all three circles", "subtract the squares". data `{c1,c2,c3,s1,s2}`. invariant: `s1===c1+c2 && s2===c2+c3`.

**`patterns-rules`** ➕ (Patterns & Structure) · figure: `sequence {terms}`
Gen: `variant=rng.pick(["add","mul"])`. add: `start=rng.int(2,9)`, `step=rng.int(2,6)`, terms `start, +step ×4`; blank the 5th. mul: `start=rng.int(1,3)`, `factor=2`, terms ×2 four times; blank the 5th.
Script: (1) choice `What changes from one number to the next?`→“+${step}” / “×2” · (2) `Say the rule and use it: last term ${...} ${op} ${k}`→ next term.
finalAnswer the blanked term. Decoys: wrong operation, "add the position number". data `{start, step, last}`. invariant (add): `data.last===data.start+3*data.step` (the 4th shown term) etc. Keep a simple checkable invariant.

**`multi-step-money`** ⭐ (Multi-Step & Real-World) · figure: none
Skins: (comics→notebooks), (toys→stickers), (books→pencils).
Gen: `q=rng.int(2,5)` (cheap item price), `k=rng.int(3,9)` (#cheap items), `total=q*k`; choose `p=rng.pick(divisorsOf(total) in 4..9)`, `n=total/p`. (Ensure `n` integer 2..8; resample if not.)
Prompt: `Clara has enough money for ${n} comics at $${p} each. Instead she spends the same on $${q} notebooks. How many notebooks?`
Script: (1) `What is the hidden TOTAL money? (${n} × $${p})`→`total` · (2) choice `What does the question want now?`→“notebooks at $${q}” · (3) `Total ÷ price: ${total} ÷ ${q}`→`k`.
finalAnswer `k`. Decoys: "n + p", "p ÷ q". data `{n,p,q,k,total}`. invariant: `n*p===total && total/q===k && Number.isInteger(k)`.

**`time-elapsed`** ➕ (Multi-Step & Real-World) · figure: none (clock optional later)
Gen: `startMin = rng.pick([0,15,30,45])`, `startHr = rng.int(1,8)`, `durSteps=rng.int(1,8)`, `dur=durSteps*15`; `endTotal=startHr*60+startMin+dur` (keep `endTotal < 12*60`). `variant=rng.pick(["end","duration"])`.
end: `Starts at ${start}, lasts ${dur} minutes. When does it end?`→ end time. Express answers in minutes-since-12 OR as choice of clock times (use **choice** with 3 clock-time options to avoid time formatting on numpad). 
Script: (1) `What do you know — start, how long, or end?` · (2) `start + duration = end` · (3) compute.
finalAnswer (choice) the end time. data `{startTotal:startHr*60+startMin, dur, endTotal}`. invariant: `data.startTotal+data.dur===data.endTotal`.

**`measure-units`** ➕ (Multi-Step & Real-World) · figure: none
Gen: `aFt=rng.int(2,5)`, `aIn=aFt*12`; `bIn=rng.int(aIn-10, aIn+10)` avoiding equality; `diff=Math.abs(aIn-bIn)`.
Prompt: `A ribbon is ${aFt} feet long. Another is ${bIn} inches long. Which is longer, and by how many inches?`
Script: (1) choice `Are both lengths in the SAME unit?`→“no” · (2) `Convert feet to inches: ${aFt} × 12`→`aIn` · (3) choice `Which is longer?`→ the longer · (4) `How much longer? (big − small)`→`diff`.
finalAnswer `diff`. Decoys: "add them", "feet × 10". data `{aIn,bIn,diff}`. invariant: `Math.abs(aIn-bIn)===diff`.

- [ ] For **each** of the 17: create `lib/frameworks/<id>.ts`, add its import+entry to `FRAMEWORKS` in `index.ts`, run `npm test -- frameworks` (its 500-seed block green), commit `feat(fw): <id>`.
- [ ] After the 18th, the `registry has 18 unique ids` assertion passes. Run full `npm test` — all green.
- [ ] **Commit.** `git commit -am "test: all 18 frameworks pass self-tests"`

---

## Phase 5 — Home, integration, polish

### Task 5.1: Home grid

**Files:** Create `app/page.tsx`

- [ ] **Step 1:** `"use client"`. Read `readProgress()` in an effect (not render). Render the 18 `FRAMEWORKS` grouped by `family`; each tile = `.card-tile`, emoji + title + a 4-pip ladder showing `stageReached` (filled pips) and a ⭐ if `soloPasses>0`. Tile links to `/f/${id}`. Big touch targets, 2-column on iPad width.
- [ ] **Step 2: Parent peek (optional):** 5 quick taps on the page title within 2s opens an overlay listing each framework's `stageReached`/`soloPasses` (mirror sibling gesture). Skippable if time-constrained.
- [ ] **Step 3: Commit.** `git commit -am "feat: home grid + progress pips"`

### Task 5.2: Build, lint, test gates

- [ ] **Step 1:** `npm run lint` → clean. (Watch for `react-hooks/purity`: never call `Date`/`Math.random` in render — only in handlers/effects. If a generator must seed at mount, do it in `useState(() => randomSeed())` initializer or an effect.)
- [ ] **Step 2:** `npm test` → all green (rng, progress, 18 frameworks).
- [ ] **Step 3:** `npm run build` → succeeds (isolated cache if needed: `npm run build` after the Phase-0 install). 
- [ ] **Step 4: Browser smoke test** (sibling used the `browse` skill / puppeteer): start `npm run dev`, drive `two-kinds` and one figure-heavy framework (`number-bonds`) through all 4 stages; confirm numpad, hints, Lead question-choice, confetti on solo, and progress pips updating on Home.
- [ ] **Step 5: Commit** any fixes.

### Task 5.3: AGENTS.md

**Files:** Create `AGENTS.md`

- [ ] **Step 1:** Write the single-source-of-truth doc: what the app is; the 4-stage ladder; the **generator contract** (always solvable, clean small numbers, deterministic given rng, `invariant` must hold, self-test guards it); "add a framework = copy `_template.ts`, write generator+script, register, green self-test"; no backend / no CDN (confetti bundled) / no audio / no visible timer; the `localStorage` key. Mirror the tone of the sibling `aoife-math/AGENTS.md`.
- [ ] **Step 2: Commit.** `git commit -am "docs: AGENTS.md source of truth"`

---

## Phase 6 — Ship

### Task 6.1: GitHub

- [ ] **Step 1:** `gh repo create jalalchowdhury1/aoife-frameworks --public --source . --remote origin --description "Aoife — Math Detective: learn the questions to ask for any math puzzle"` (confirm the exact owner/account; sibling lives at `jalalchowdhury1/aoife-math`).
- [ ] **Step 2:** `git push -u origin main`. Verify the push and that `node_modules`/`.superpowers`/caches are NOT tracked (`.gitignore` covers them).

### Task 6.2: Vercel

- [ ] **Step 1:** `vercel --prod` (zero-config Next.js). If the GitHub App link isn't authorized — known sibling gotcha — the CLI deploy is the working path.
- [ ] **Step 2:** Confirm the production URL returns HTTP 200 and renders the home grid; open one framework end-to-end. Capture the stable `*.vercel.app` domain.
- [ ] **Step 3:** Report the live URL to the owner.

---

## Self-Review

**Spec coverage:** ✓ 18 frameworks (Phase 4 catalog) · ✓ 4-stage ladder + Lead question-choice (Task 3.2/3.3) · ✓ generators vary story+numbers, always solvable (Task 4.0 harness + per-fw invariants) · ✓ figures for the visual frameworks (Phase 2, wired per-fw) · ✓ iPad/touch/numpad/text-only/offline (Tasks 0.2, 3.1, 3.3) · ✓ localStorage progress + home pips + optional parent peek (Tasks 1.3, 5.1) · ✓ same stack/look/Vercel (Phase 0, 6) · ✓ AGENTS.md + generator contract + self-tests (Tasks 4.0, 5.3) · ✓ no backend/CDN/audio/timer (Out-of-scope honored).

**Placeholder scan:** Framework specs give concrete formulas, script text, decoys, and invariants — no "implement later". The two soft spots are deliberately bounded: `cross-number-grid` (constrained to a 3×3 addition cross with exactly 2 blanks) and `time-elapsed` (answers via choice of clock times to avoid numpad time-formatting). Both are fully specified.

**Type consistency:** `Step`/`Problem`/`Framework` (Task 1.2) are used identically across engine and every framework; `recordStageDone`/`recordSolo`/`readProgress`/`isUnlocked` (Task 1.3) match their call sites (Tasks 3.3, 5.1); `FigureSpec.kind` values (Task 2.1) match what generators emit (Phase 4). `byId`/`FRAMEWORKS` (Task 4.1) match the route + home consumers.
