# Practice Mode ("5 in a row") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 🔁 Practice button after 🦋 Solo on every framework: five fresh Solo-style problems back to back, with ⭐/✅ quality slots and additive progress tracking.

**Architecture:** Practice is a sibling mode inside `StageEngine` (NOT a new `STAGES` member — stage/unlock/test semantics untouched). A new `PracticeRunner` owns the 5-problem run and reuses the exported `SoloRunner` with two new optional props (`celebrate`, `onSolved`). Progress gains additive `practiceRuns`/`perfectRuns` via `recordPractice`.

**Tech Stack:** Next.js 16 / React 19 / Tailwind v4 / Vitest (existing — no new deps).

---

### Task 1: `recordPractice` in the progress store

**Files:** Modify `lib/progress.ts` · Test `lib/progress.test.ts`

- [ ] **Step 1 — failing tests** (append inside the existing `describe("progress")`):

```ts
it("records practice runs and perfect runs additively", () => {
  recordPractice("two-kinds", false);
  recordPractice("two-kinds", true);
  const e = readProgress()["two-kinds"];
  expect(e.practiceRuns).toBe(2);
  expect(e.perfectRuns).toBe(1);
  expect(e.stageReached).toBe(0); // untouched
});
it("practice fields default safely on old records", () => {
  recordSolo("two-kinds"); // creates a record without practice fields
  recordPractice("two-kinds", true);
  const e = readProgress()["two-kinds"];
  expect(e.practiceRuns).toBe(1);
  expect(e.perfectRuns).toBe(1);
  expect(e.soloPasses).toBe(1);
});
```

(also add `recordPractice` to the import line)

- [ ] **Step 2:** `npx vitest run lib/progress.test.ts` → FAIL (`recordPractice` not exported)
- [ ] **Step 3 — implement** in `lib/progress.ts`: extend the interface and add the recorder:

```ts
export interface FwProgress {
  stageReached: number;
  soloPasses: number;
  lastPlayed: string;
  practiceRuns?: number; // completed 5-in-a-row runs
  perfectRuns?: number; // runs where all five were first-try ⭐
}

export function recordPractice(id: string, perfect: boolean) {
  const p = readProgress();
  const e = entry(p, id);
  e.practiceRuns = (e.practiceRuns ?? 0) + 1;
  if (perfect) e.perfectRuns = (e.perfectRuns ?? 0) + 1;
  e.lastPlayed = today();
  p[id] = e;
  write(p);
}
```

- [ ] **Step 4:** `npx vitest run lib/progress.test.ts` → PASS
- [ ] **Step 5:** `git add lib/progress.ts lib/progress.test.ts && git commit -m "feat(progress): recordPractice with additive practiceRuns/perfectRuns"`

### Task 2: `SoloRunner` reuse props

**Files:** Modify `lib/engine/StageRunner.tsx`

- [ ] **Step 1:** Export `SoloRunner` (`export function SoloRunner`) and extend its props:

```ts
function SoloRunner({
  problem,
  onComplete,
  celebrate = true,          // false → no confetti (practice fires its own at run end)
  onSolved,                  // practice: called with firstTry instead of onComplete
}: {
  problem: Problem;
  onComplete: (stage: Stage) => void;
  celebrate?: boolean;
  onSolved?: (firstTry: boolean) => void;
}) {
```

Track first-try quality with a ref alongside the existing `wrong` state: add
`const everWrong = useRef(false);` — set `everWrong.current = true` in the wrong branch of
`submit()`. In the success branch replace the confetti/complete block with:

```ts
if (celebrate) void fireConfetti();
timer.current = setTimeout(() => {
  if (onSolved) onSolved(!everWrong.current);
  else onComplete("solo");
}, 400);
```

- [ ] **Step 2:** `npx tsc --noEmit && npm run lint` → clean (behavioral no-op for Solo: both new props defaulted). `npm test` → all pass.
- [ ] **Step 3:** `git add -A && git commit -m "refactor(engine): SoloRunner reusable — celebrate/onSolved props"`

### Task 3: `PracticeRunner` + StageEngine wiring

**Files:** Create `lib/engine/PracticeRunner.tsx` · Modify `lib/engine/StageEngine.tsx`

- [ ] **Step 1 — PracticeRunner** (complete file):

```tsx
"use client";

import { useMemo, useState } from "react";
import type { Framework } from "../types";
import { makeRng } from "../rng";
import { Figure } from "../figures/Figure";
import { renderRich } from "./rich";
import { SoloRunner } from "./StageRunner";

const RUN = 5;

// 🔁 Practice: five fresh Solo problems of the same framework, back to back.
// ⭐ = first try, ✅ = after a retry. A wrong answer never resets the run.
export function PracticeRunner({
  framework,
  baseSeed,
  onFinish,
}: {
  framework: Framework;
  baseSeed: number;
  onFinish: (perfect: boolean) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [slots, setSlots] = useState<("star" | "check")[]>([]);

  const problem = useMemo(
    () => framework.generate(makeRng(baseSeed + idx)),
    [framework, baseSeed, idx],
  );

  const solved = (firstTry: boolean) => {
    const next = [...slots, firstTry ? ("star" as const) : ("check" as const)];
    setSlots(next);
    if (next.length >= RUN) {
      onFinish(next.every((s) => s === "star"));
    } else {
      setIdx(idx + 1);
    }
  };

  return (
    <div>
      {/* run header: five quality slots + position */}
      <div className="flex items-center justify-center gap-2 mb-3">
        {Array.from({ length: RUN }).map((_, i) => (
          <span
            key={i}
            className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-lg ${
              i < slots.length
                ? "bg-amber-50 border-amber-300"
                : i === slots.length
                  ? "bg-white border-purple-400"
                  : "bg-gray-50 border-gray-200"
            }`}
          >
            {i < slots.length ? (slots[i] === "star" ? "⭐" : "✅") : i === slots.length ? "🐇" : ""}
          </span>
        ))}
        <span className="ml-2 text-sm font-bold text-purple-500">
          Problem {Math.min(slots.length + 1, RUN)} of {RUN}
        </span>
      </div>

      {/* the problem — PracticeRunner owns prompt + figure (it changes mid-run) */}
      <div className="bg-white border-4 border-pink-200 rounded-2xl p-4 mb-3 text-lg text-gray-800 leading-snug">
        {renderRich(problem.promptText)}
      </div>
      <Figure spec={problem.figure} />

      <SoloRunner
        key={idx}
        problem={problem}
        onComplete={() => {}}
        celebrate={false}
        onSolved={solved}
      />
    </div>
  );
}
```

- [ ] **Step 2 — StageEngine wiring** (all in `lib/engine/StageEngine.tsx`):
  1. Imports: `PracticeRunner`, `recordPractice` (from `../progress`), and `fireConfetti` — move `fireConfetti` out of `StageRunner.tsx` into a tiny shared `lib/engine/confetti.ts` (`export async function fireConfetti(big = false)` — `particleCount: big ? 250 : 120, spread: big ? 100 : 70`) and update StageRunner's import.
  2. State: `const [mode, setMode] = useState<"stages" | "practice">("stages");` and `const [practiceDone, setPracticeDone] = useState<null | { perfect: boolean }>(null);`
  3. Practice button after the 4 stage pills (the grid becomes `grid-cols-5`): same pill styling with amber accent, label `🔁 Practice`, `disabled={!isUnlocked(progress, framework.id, "solo")}`, onClick → `setMode("practice"); setPracticeDone(null); setSeed(randomSeed()); setFinished(null);`. Stage pills' onClick additionally `setMode("stages")`. Active styling: practice button gets `bg-amber-400 text-white` when `mode === "practice" && !practiceDone`.
  4. Render: when `mode === "practice"`, skip the shared prompt/figure/StageRunner entirely; render `practiceDone` ? a practice end panel : `<PracticeRunner framework={framework} baseSeed={seed} onFinish={(perfect) => { recordPractice(framework.id, perfect); setProgress(readProgress()); void fireConfetti(perfect); setPracticeDone({ perfect }); }} />`.
  5. Practice end panel (inline in StageEngine, mirrors EndPanel styling):

```tsx
<div className="text-center py-6 animate-bounce-in">
  <div className="text-5xl mb-2">{practiceDone.perfect ? "🏆" : "🎉"}</div>
  <div className="text-2xl font-bold text-purple-800 mb-1">
    {practiceDone.perfect ? "PERFECT — five stars in a row!" : "Five in a row — done!"}
  </div>
  <div className="text-sm text-purple-400 mb-5">{framework.title}</div>
  <div className="flex flex-col gap-2 max-w-xs mx-auto">
    <button type="button" onClick={() => { setSeed(randomSeed()); setPracticeDone(null); }}
      className="bg-amber-400 text-white rounded-2xl py-3 font-bold text-lg active:scale-95">
      🔁 Practice again
    </button>
    <Link href="/" className="bg-purple-100 text-purple-700 rounded-2xl py-3 font-bold text-lg active:scale-95">
      🏠 Home
    </Link>
  </div>
</div>
```

- [ ] **Step 3:** `npx tsc --noEmit && npm run lint && npm test && npm run build` → all clean.
- [ ] **Step 4:** `git add -A && git commit -m "feat(engine): 🔁 Practice mode — five Solo problems in a row with ⭐/✅ slots"`

### Task 4: Home page surfacing + verification + deploy

**Files:** Modify `app/page.tsx`

- [ ] **Step 1:** Tile: next to the mastered ⭐ add `{(p?.perfectRuns ?? 0) > 0 && <span title="Perfect practice!">🔁</span>}`. Parent-peek table: add a `Practice` header cell and per-row `<td className="text-amber-600">{p?.practiceRuns ?? 0}{(p?.perfectRuns ?? 0) > 0 ? ` (⭐${p.perfectRuns})` : ""}</td>`.
- [ ] **Step 2:** `npx tsc --noEmit && npm run lint && npm run build` → clean.
- [ ] **Step 3 — browser smoke** (`npm run dev` + browse CLI): unlock check (practice disabled on a fresh framework, enabled where Solo is reached — seed localStorage or click through Watch→…), enter Practice, solve problem 1 first-try (⭐), answer problem 2 wrong once then right (✅), complete all 5 → confetti + end panel; "Practice again" starts fresh; parent peek shows the run; tile shows 🔁 only after a perfect run.
- [ ] **Step 4:** `git add -A && git commit -m "feat(home): practice column in parent peek + 🔁 tile badge"` → `git push` → `npx vercel --prod --yes` → curl live smoke → update memory (`project_aoife_frameworks.md` + MEMORY.md line).
