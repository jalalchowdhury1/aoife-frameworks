# Time & Clocks Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Time & Clocks family as 9 visual, hop-and-count lessons ("Aoife's Day" / "Around the World") per `docs/superpowers/specs/2026-07-11-time-clocks-redesign-design.md`.

**Architecture:** Two new SVG figures (`DayLine`, `ClockFace`) + two new interactive input kinds (`clock-set`, `line-hop`) slot into the existing 4-stage engine without changing its answer semantics (both submit numbers). A chip renderer turns `[[7|am]]` tokens into gold/purple time chips wherever the engine shows text. Nine framework files (2 new, 7 rewritten in place, same ids) share a `time-shared.ts` helper for anchors, cities, and warm-up steps.

**Tech Stack:** Next.js 16 / React 19 / Tailwind v4 / Vitest. No new dependencies.

**House rules that bind every task** (from AGENTS.md + frameworks.test.ts):
- All number-step answers and finalAnswers: non-negative integers. ≥2 decoyQuestions per step, none equal to the ask, no decoy that *evaluates* to a real answer. Non-empty hints. Choice steps have a matching choice.
- Every finalAnswer must be some step's answer AND the **last step's answer must be a final answer** → the landing-hour (number-valued) step is always LAST in every time framework.
- Never call `Date`/`Math.random` in render; client init in mount `useEffect`.
- `data` is `Record<string, number>` — encode booleans as 0/1; figure tests read only `data`.

---

### Task 1: Chip tokens + anchors in `lib/clock.ts`

**Files:** Modify `lib/clock.ts` · Create `lib/clock.test.ts`

- [ ] **Step 1: failing test** — `lib/clock.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { chip, chipText, to24, from24, addHours, ANCHORS } from "./clock";

describe("chip tokens", () => {
  it("chip() emits a [[h|half]] token", () => {
    expect(chip({ h12: 7, ampm: "a.m." })).toBe("[[7|am]]");
    expect(chip({ h12: 12, ampm: "p.m." })).toBe("[[12|pm]]");
  });
  it("chipText() renders the plain-text form", () => {
    expect(chipText("[[7|am]]")).toBe("7:00 ☀️ a.m.");
    expect(chipText("It lands at [[3|pm]] today")).toBe("It lands at 3:00 🌙 p.m. today");
  });
  it("round-trips with clock math", () => {
    expect(chip(addHours(from24(to24(11, "a.m.")), 2))).toBe("[[1|pm]]");
  });
  it("anchors exist at the taught hours", () => {
    expect(ANCHORS[12].icon).toBe("🥪");
    expect(Object.keys(ANCHORS).length).toBeGreaterThanOrEqual(6);
  });
});
```

- [ ] **Step 2:** `npx vitest run lib/clock.test.ts` → FAIL (chip not exported)
- [ ] **Step 3: implement** — append to `lib/clock.ts`:

```ts
// [[7|am]] chip token — the ONLY way times appear in Time & Clocks text.
// Rendered as a gold/purple chip by lib/engine/rich.tsx; chipText() is the
// plain-text fallback used in tests and non-engine contexts.
export function chip(c: Clock): string {
  return `[[${c.h12}|${c.ampm === "a.m." ? "am" : "pm"}]]`;
}
export const CHIP_RE = /\[\[(\d{1,2})\|(am|pm)\]\]/g;
export function chipText(text: string): string {
  return text.replace(CHIP_RE, (_, h, half) =>
    half === "am" ? `${h}:00 ☀️ a.m.` : `${h}:00 🌙 p.m.`,
  );
}
// Hours Aoife already knows — the day-line's landmarks (hour-of-day 0..23).
export const ANCHORS: Record<number, { icon: string; label: string }> = {
  7: { icon: "🌅", label: "wake up" },
  8: { icon: "🍳", label: "breakfast" },
  9: { icon: "🎒", label: "school" },
  12: { icon: "🥪", label: "lunch" },
  16: { icon: "🛝", label: "play" },
  18: { icon: "🍽️", label: "dinner" },
  20: { icon: "🛏️", label: "bed" },
};
```

- [ ] **Step 4:** `npx vitest run lib/clock.test.ts` → PASS
- [ ] **Step 5:** `git add lib/clock.ts lib/clock.test.ts && git commit -m "feat(time): chip tokens + day anchors in clock lib"`

### Task 2: Rich chip renderer wired into the engine

**Files:** Create `lib/engine/rich.tsx` · Modify `lib/engine/StageEngine.tsx`, `lib/engine/StageRunner.tsx`, `lib/engine/ChoicePad.tsx`, `app/globals.css`

- [ ] **Step 1: failing test** — extend `lib/clock.test.ts` (tokenizer is pure; the tsx wrapper is trivial):

```ts
import { splitRich } from "./engine/rich";
it("splitRich tokenizes text and chips", () => {
  expect(splitRich("Start at [[9|am]] now")).toEqual([
    { t: "text", v: "Start at " },
    { t: "chip", h: 9, half: "am" },
    { t: "text", v: " now" },
  ]);
});
```

- [ ] **Step 2:** run → FAIL. **Step 3: implement** `lib/engine/rich.tsx`:

```tsx
import type { ReactNode } from "react";
import { CHIP_RE } from "../clock";

export type RichPart = { t: "text"; v: string } | { t: "chip"; h: number; half: "am" | "pm" };

export function splitRich(text: string): RichPart[] {
  const parts: RichPart[] = [];
  let last = 0;
  for (const m of text.matchAll(CHIP_RE)) {
    if (m.index! > last) parts.push({ t: "text", v: text.slice(last, m.index) });
    parts.push({ t: "chip", h: Number(m[1]), half: m[2] as "am" | "pm" });
    last = m.index! + m[0].length;
  }
  if (last < text.length) parts.push({ t: "text", v: text.slice(last) });
  return parts;
}

// Gold ☀️ a.m. chip / purple 🌙 p.m. chip. Inline so it flows with sentence text.
export function renderRich(text: string): ReactNode {
  return splitRich(text).map((p, i) =>
    p.t === "text" ? (
      <span key={i}>{p.v}</span>
    ) : (
      <span key={i} className={p.half === "am" ? "chip-am" : "chip-pm"}>
        {p.h}:00 {p.half === "am" ? "☀️ a.m." : "🌙 p.m."}
      </span>
    ),
  );
}
```

globals.css additions:

```css
.chip-am { @apply inline-block whitespace-nowrap rounded-full bg-amber-100 border-2 border-amber-300 text-amber-800 font-bold px-2 py-0.5 text-[0.9em] mx-0.5; }
.chip-pm { @apply inline-block whitespace-nowrap rounded-full bg-purple-100 border-2 border-purple-400 text-purple-800 font-bold px-2 py-0.5 text-[0.9em] mx-0.5; }
```

Wire `renderRich(...)` around every engine text render site (all are plain `{string}` today): StageEngine `problem.promptText`; StageRunner completed-step `s.ask`, watch `step.ask`, active `step.ask`, hint `step.hint`, `displayAnswer` render sites (wrap where displayed, keep the function returning string), Solo `problem.finalAsk` and final `f.label`; ChoicePad option labels.

- [ ] **Step 4:** tests pass; `npm run lint` clean. **Step 5:** commit `feat(engine): render [[h|half]] time chips in all engine text`.

### Task 3: `DayLine` figure

**Files:** Create `lib/figures/DayLine.tsx` · Modify `lib/figures/Figure.tsx`

Spec (`FigureSpec` fields, all hours 0..23; every number here must equal the matching `data` field — enforced per-framework in figures.test.ts):

```ts
{ kind: "dayLine",
  variant?: "single" | "double" | "stacked",  // double = 0..23 row under the 12-hour row (Day 5)
  events?: { hour24: number; icon: string }[], // anchor icons to draw above cells
  hopFrom?: number, hopTo?: number,            // draw hop arcs from→to (never wraps past 23)
  highlight?: number,                          // ring one cell
  nowA?: number, offsetB?: number,             // stacked: NOW line at nowA on row A and nowA+offsetB on row B
  cityA?: string, cityB?: string }
```

Rendering rules: 24 cells; gold ribbon over 0–11 labeled "☀️ before lunch (a.m.)", purple ribbon over 12–23 labeled "🌙 after lunch (p.m.)"; cell fill = night–dawn–day–dusk–night gradient stops; 🥪 marker at 12, 💤 at 0 and 23; 12-hour numbers under cells (12 1 2 … 11 12 1 … 11); `double` adds 0..23 row beneath; hop arcs drawn as semicircles with a hop-count badge; `stacked` renders two strips + one vertical NOW line through both (offsetB shifts which cell the line crosses on row B). Pure presentational component — no state, no handlers (interactivity lives in Task 5's `DayLineInput`, which *wraps* this).

- [ ] Steps: implement component → register `case "dayLine"` in `Figure.tsx` → `npm run lint && npx tsc --noEmit` clean → visual smoke via `npm run dev` on a scratch page or Storybook-less temporary render inside an existing framework page → commit `feat(figures): DayLine strip (single/double/stacked)`.
(Figure-vs-data unit tests land with each framework task; component itself is covered by tsc + lint + the manual iPad smoke in Task 16.)

### Task 4: `ClockFace` figure

**Files:** Create `lib/figures/ClockFace.tsx` · Modify `lib/figures/Figure.tsx`

```ts
{ kind: "clockFace",
  hour: number, ampm: "am" | "pm",       // 1..12 — where the hand points
  ghostHour?: number, ghostAmpm?: "am" | "pm", // faint start-position hand (hops)
  pair?: { hour: number; ampm: "am" | "pm"; label: string }, // Day 6: second clock
  label?: string }
```

Rendering: SVG circle, 12 numerals, single hour hand; rim stroke gold when `ampm === "am"`, purple when `"pm"`; ☀️/🌙 badge at top center; ghost hand at 40% opacity; `pair` renders two clocks side by side with city labels. The hand position uses a CSS `transition: transform 600ms` so a mounted update (ghost → hour) sweeps visibly — Watch stage exploits this in Task 5.

- [ ] Steps: implement → register `case "clockFace"` → lint/tsc → commit `feat(figures): ClockFace with ghost hand + pair variant`.

### Task 5: Interactive inputs + warm-up steps in the engine

**Files:** Modify `lib/types.ts` · Create `lib/engine/ClockInput.tsx`, `lib/engine/DayLineInput.tsx` · Modify `lib/engine/StageRunner.tsx`

- [ ] **Step 1: types.** `InputKind = "number" | "choice" | "clock-set" | "line-hop"`; add to `Step`: `warmup?: boolean;` and `inputSpec?: FigureSpec;` (the figure the input renders — e.g. the clock with ghost hand, or the day-line to hop on; for `line-hop` add `{ mode?: "land" | "count", row?: "h12" | "h24" }` inside the spec).

- [ ] **Step 2: ClockInput.** Renders `ClockFace` from `step.inputSpec` starting at the ghost hour; each tap on the face (or a big "hop ➕" button beneath — the reliable touch target) advances the hand one hour with a running count bubble ("3 hops"); ↩️ resets to start; ✓ calls `onSubmit(hourShown)` (1..12). No a.m./p.m. logic here — the half is always its own choice step.

- [ ] **Step 3: DayLineInput.** Renders `DayLine`; tapping the next cell right (or left when the step's hop is backward — direction = sign of `inputSpec.dir` field, default +1) paints it and advances; ✓ submits per mode: `"land"` → the landing cell's 12-hour number, or the bottom-row 0..23 number when `row: "h24"` (Day 5); `"count"` → the number of hops made (Day 6). Same reset button.

- [ ] **Step 4: StageRunner wiring.**
  - In the active-step branch: `step.input === "clock-set"` → `<ClockInput spec={step.inputSpec!} onSubmit={(v) => checkAnswer(v)} disabled={locked} />`; same shape for `line-hop` → `DayLineInput`. `checkAnswer` already handles numeric comparison — treat both kinds as numbers in the `checkAnswer` ternary (`step.input === "choice" ? val === step.answer : Number(val) === Number(step.answer)`).
  - **Watch stage:** for the two interactive kinds render the input component in `demo` mode — mounts at ghost/start, then a `useEffect` timer steps it to the answer one hop per 500 ms (the CSS hand-sweep/cell-paint animates), then shows the existing answer text + Next button.
  - **Warm-up:** step header shows a "⭐ Warm-up" chip when `step.warmup`. Lead stage skips question-picking for warm-up steps: initial `qChosen` state and the `advance()` reset both become `stage !== "lead" || !!steps[nextIdx]?.warmup`.

- [ ] **Step 5: tests.** Pure logic only (components are exercised by lint/tsc + Task 16 smoke): extend `lib/progress.test.ts`-style pure test file `lib/engine/engine.test.ts` asserting `InputKind` accepts the new kinds via a `Step` literal, and that a warm-up-first steps array leaves the non-warm-up script intact (guards the frameworks.test.ts change in Task 7).

- [ ] **Step 6:** lint + tsc + full `npm test` → commit `feat(engine): clock-set & line-hop inputs, warm-up steps, watch auto-play`.

### Task 6: Home page — chapters, Day badges, start-here ring

**Files:** Create `lib/frameworks/time-ladder.ts` · Modify `app/page.tsx`

```ts
// lib/frameworks/time-ladder.ts — presentation-only ladder metadata.
export const TIME_CHAPTERS = [
  { title: "🏠 Chapter 1 · Aoife's Day", ids: ["am-pm", "hop-hours", "past-noon", "clock-add", "clock-24"] },
  { title: "🌍 Chapter 2 · Around the World", ids: ["time-difference", "time-zones", "chained-zones", "flight-zones"] },
] as const;
export const TIME_DAY: Record<string, number> = { "am-pm": 1, "hop-hours": 2, "past-noon": 3, "clock-add": 4, "clock-24": 5, "time-difference": 6, "time-zones": 7, "chained-zones": 8, "flight-zones": 9 };
```

`app/page.tsx`: when `family === "Time & Clocks"` render the two chapter sub-sections (cards in ladder order via `TIME_CHAPTERS`) instead of the flat grid; each card gets a `Day N` badge (small pink pill, top-left) and the **first** card whose `soloPasses` is 0 gets a `ring-4 ring-amber-300` + "⭐ start here" pill. All other families render exactly as before. Nothing is locked.

- [ ] Steps: implement → lint/tsc → `npm run dev` visual check → commit `feat(home): Time & Clocks chapters with Day badges and start-here ring`.

### Task 7: Shared time helpers + warm-up factories

**Files:** Create `lib/frameworks/time-shared.ts` · Modify `lib/frameworks/frameworks.test.ts` (warm-up awareness + count)

`time-shared.ts` exports (complete):

```ts
import type { Step } from "../types";
import type { Rng } from "../rng";
import { chip, from24, to24, ANCHORS, type AmPm, type Clock } from "../clock";

export const CITIES = ["Dublin", "London", "New York", "Toronto", "Dhaka", "Singapore", "Honolulu", "Sydney"];
export const AM_ANCHORS = [7, 8, 9].map((h) => ({ h, ...ANCHORS[h] }));
export const PM_ANCHORS = [16, 18, 20].map((h) => ({ h, ...ANCHORS[h] }));
export const halfChoices = [
  { label: "☀️ before lunch (a.m.)", value: "a.m." },
  { label: "🌙 after lunch (p.m.)", value: "p.m." },
];
export const c = (h12: number, ampm: AmPm) => chip({ h12, ampm });

// One warm-up factory per day's core skill; Day N calls warmupDayN-1.
// Every factory returns a Step with warmup: true and its own decoys/hints.
export function warmupHalf(rng: Rng): Step { /* Day 1 skill: is this anchor ☀️ or 🌙? */ }
export function warmupHop(rng: Rng): Step { /* Day 2 skill: same-half hop, number answer */ }
export function warmupCross(rng: Rng): Step { /* Day 3 skill: will this hop pass 🥪? yes/no */ }
export function warmupClockAdd(rng: Rng): Step { /* Day 4 skill: tiny wrap-free clock add */ }
export function warmupRead24(rng: Rng): Step { /* Day 5 skill: 24-hour number of a p.m. chip */ }
export function warmupAhead(rng: Rng): Step { /* Day 6 skill: which chip time is further along the day? */ }
export function warmupDirection(rng: Rng): Step { /* Day 7 skill: ahead=hop forward / behind=hop back */ }
export function warmupCombine(rng: Rng): Step { /* Day 8 skill: x forward then y back = one jump of? */ }
```

Each factory body is ~10 lines following this normative exemplar (all others use the same shape with their own strings):

```ts
export function warmupHalf(rng: Rng): Step {
  const e = rng.pick([...AM_ANCHORS, ...PM_ANCHORS]);
  const ampm: AmPm = e.h < 12 ? "a.m." : "p.m.";
  return {
    id: "warmup", warmup: true, input: "choice",
    ask: `⭐ Warm-up — remember yesterday? Aoife's ${e.label} ${e.icon} time: is it before or after lunch?`,
    choices: halfChoices, answer: ampm,
    hint: ampm === "a.m." ? `${e.icon} happens before 🥪 lunchtime — the ☀️ half.` : `${e.icon} happens after 🥪 lunchtime — the 🌙 half.`,
    decoyQuestions: ["How many hours are in a whole day?", "What time is lunch?"],
  };
}
```

`frameworks.test.ts` changes: count assertion 30 → 32 (Task 15 flips it after both new ids register — flip when the suite demands it); the reachability rules ("finalAnswer is some step's answer", "last step's answer is a final answer") already hold with a warm-up FIRST step — verify no other rule assumes step 0 relates to the prompt; if any does, exempt `step.warmup` there.

- [ ] Steps: write factories (all 8, complete strings) → the file compiles → commit `feat(time): shared anchors, cities, and warm-up factories`.

### Tasks 8–15: the nine frameworks

Common shape for every framework task: rewrite/create `lib/frameworks/<id>.ts` → register in `lib/frameworks/index.ts` (import + FRAMEWORKS array, ladder order: amPm, hopHours, pastNoon, clockAdd, clock24, timeDifference, timeZones, chainedZones, flightZones) → add its figure-consistency block to `lib/figures/figures.test.ts` (300 seeds, assert every figure/inputSpec number equals its `data` twin) → `npx vitest run` green at 500 seeds → commit `feat(time): Day N — <title>`.

All prompt/ask/hint strings use `c(h,ampm)` chips — never raw times. All hints give the other lens (clock ↔ day-line ↔ anchor). "✨ magic shortcut" text appears ONLY inside Day 4/Day 5 hints exactly as specified below.

**Task 8 — Day 1 `am-pm` "Morning or After-Lunch?" 🌅 (rewrite).** Generator: pick 4 distinct events (amCount 1–3 from AM_ANCHORS ∪ extra am events, rest from PM side — reuse the current event lists but with anchor icons); figure `{ kind: "dayLine", events: [{hour24, icon}...] }`. Steps: per event a `choice` with `halfChoices` (ask: `Aoife ${label} ${icon} at ${c(h12, half)}. Is that before or after lunch?` — chip *contains* the half, and the hint points at the day-line: "Find ${icon} on the day-line — which ribbon is it under?"), then LAST a number step counting 🌙 events. finalAnswers `[{ label: "after lunch (p.m.)", value: pmCount }]`. data: `{ amCount, pmCount, e0, e1, e2, e3 }` (hour24 of each event, order as displayed). Figure test: events array hours = data.e0..e3, icons = ANCHORS lookups. blurb: "Before lunch is the ☀️ half, after lunch is the 🌙 half. Sort Aoife's day, then count."

**Task 9 — Day 2 `hop-hours` "Hop the Hours" 🐇 (new).** Generator: `ampm` random; start `s` 1..8, hop `k` 1..3 with `s + k ≤ 11`; land `= s + k`; `fig` = rng pick 0 (dayLine) | 1 (clockFace). Steps: (1) `warmupHalf(rng)`; (2) LAST landing step — `line-hop` (`inputSpec: { kind:"dayLine", hopFrom: to24(s,ampm), hopTo: to24(land,ampm), mode:"land" }`) or `clock-set` (`inputSpec: { kind:"clockFace", hour: land, ampm: half, ghostHour: s, ghostAmpm: half }`) — ask `Start at ${c(s,ampm)} and hop ${k} hour${k===1?"":"s"} forward. Where do you land?`, hint `Tap one hop at a time and count out loud — 1… 2… ${k===2?"":"3… "}you never pass 🥪 lunchtime, so the half stays the same.`, decoys `["Is the landing time before or after lunch?", "How many hours are in a whole day?"]`. Wait — LAST step must be the number-valued landing step, and a half-choice step is pedagogically wanted: order = warmup, half-check choice (`After hopping, is Aoife still in the same half of the day?` → choices same/different, answer "same", hint "The hops never reach 🥪 lunchtime — look at the day-line, every hop stays under the ${ampm==="a.m."?"gold ☀️":"purple 🌙"} ribbon."), landing step LAST. finalAnswers `[{ label: "o'clock", value: land }]`. invariant: `d.land === d.s + d.k && d.land <= 11 && d.k >= 1 && d.k <= 3`. data `{ s, k, land, isPm, fig }`. Figure test: when fig=0 inputSpec.hopFrom/hopTo match to24(s)/to24(land); when fig=1 ghostHour=s, hour=land. Problem-level `figure` = the same spec as inputSpec (so Watch/Together always SEE the scene; the input re-renders it interactively). blurb: "Adding hours = hopping forward. Count the hops — nothing tricky yet!"

**Task 10 — Day 3 `past-noon` "Past Lunchtime!" 🌞 (new).** Generator: variant crossing (3-in-4): start24 9..11, land24 12..15 with hop `1..4` (`hop = land24 - start24`, reject hop<1); variant no-cross (1-in-4): start24 8..9, hop 1..2 (land24 ≤ 11). Steps: (1) `warmupHop(rng)`; (2) choice `Will Aoife's hop go past 🥪 lunchtime?` yes/no (answer per variant; hint: `Start at ${c(...)} and look at the day-line — is the 🥪 marker inside your ${hop} hops?`); (3) choice halfChoices on the landing (hint crossing: `You stepped across 🥪 lunch — the gold half ends there and the purple 🌙 half begins.`; no-cross: `All ${hop} hops stay under the gold ☀️ ribbon.`); (4) LAST `line-hop` landing (mode "land", h12 row) — for land24 12..15 answer is `land24 === 12 ? 12 : land24 - 12`. finalAnswers `[{ label:"o'clock", value: landH12 }]`. invariant: `d.crossed === (d.land24 >= 12 ? 1 : 0) && d.land24 === d.s24 + d.hop`. data `{ s24, hop, land24, crossed }`. Narration line in promptText tail: `(The same flip happens at midnight, while you're fast asleep 💤.)` on crossing variant only. Figure/inputSpec: dayLine hopFrom s24, hopTo land24.

**Task 11 — Day 4 `clock-add` "Around the Clock" 🕒 (rewrite).** Generator: `ampm` random, `h12` 1..11, `add` 1..8 (any sum — crossing noon or midnight both possible; midnight variant is just start-pm). land = `addHours` result. Steps: (1) `warmupCross(rng)`; (2) choice `Will the hand go past the 12 at the top?` yes/no, answer `h12 + add >= 12 ? "yes" : "no"`, hint `Count how many numbers are left before 12: from ${h12} it's ${12 - h12}. Are you hopping more than that?`; (3) choice halfChoices, answer land.ampm, hint (flip: `You crossed 12 — on the day-line that's stepping past 🥪 lunch (or past 💤 midnight): the half flips.`; else `You never crossed 12, so the half stays the same.`); (4) LAST `clock-set` landing, ask `Hop ${add} hours around the clock from ${c(h12,ampm)}. Where does the hand stop?`, hint `Tap ${add} hops and count — after 12 comes 1, the clock starts over by itself. ✨ Magic shortcut for later: if your count passes 12, you can also take 12 away from ${h12 + add}.`. finalAnswers landing h12. invariant matches current file's (`sum`, `result`, `flip`) plus `d.result === ((d.h12 + d.add - 1) % 12) + 1`. data `{ h12, add, sum, result, flip, isPm }`. Figure/inputSpec clockFace ghost=start.

**Task 12 — Day 5 `clock-24` "The Keep-Counting Clock" 🕓 (rewrite).** Generator: isPm 3-in-4, h12 1..11; result = isPm ? h12+12 : h12. Steps: (1) `warmupClockAdd(rng)`; (2) LAST `line-hop` with `inputSpec { kind:"dayLine", variant:"double", highlight: result, mode:"land", row:"h24" }`, ask `Some clocks don't start over after lunch — they keep counting: 12, 13, 14… Find ${c(h12, ampm)} on the day-line. What number is written UNDER it?`, hint isPm ? `Find the ${h12} in the purple 🌙 half and read the bottom row. ✨ Magic shortcut for later: after lunch you can just add 12.` : `Morning numbers match — the keep-counting clock says the same ${h12} in the ☀️ half.`. finalAnswers `[{ label:"on the keep-counting clock", value: result }]`. invariant as current. data `{ h12, isPm, result }`. Figure test: highlight === result.

**Task 13 — Day 6 `time-difference` "Who's Ahead?" 🌍 (rewrite).** Generator: 2 cities; offset 1..5; bAhead random; a24 chosen so both fit 0..23 (`bAhead ? rng.int(0, 23-offset) : rng.int(offset, 23)`). Steps: (1) `warmupRead24(rng)`; (2) choice ahead/behind (`${b} is ahead` / `${b} is behind`), hint `Ahead means further along in the day — like being on a later page of the same book. Whose clock shows the later time?`; (3) LAST `line-hop` mode "count" over `inputSpec { kind:"dayLine", variant:"stacked", nowA: a24, offsetB: b24 - a24, cityA: a, cityB: b }`, ask `Count the hops between the two NOW marks. How many hours apart are ${a} and ${b}?`, hint `Start at the earlier mark (${c(...earlier)}) and hop to the later one (${c(...later)}), counting each hop.`. finalAnswers offset. invariant as current file. data `{ a24, b24, offset, ahead }`. Figure test: nowA===a24, offsetB===b24−a24.

**Task 14 — Day 7 `time-zones` "Jump to Another City" 🌎 (rewrite).** Generator: cities, offset 1..6, ahead random, ampm/h12 free; land = addHours(±offset). Steps: (1) `warmupAhead(rng)`; (2) choice `${b}'s clocks are ${offset} hour(s) ${ahead ? "ahead" : "behind"}. Which way do we hop on the day-line?` choices `⏩ forward (later)` / `⏪ back (earlier)`, hint `Ahead = further along their day = hop forward. Behind = earlier in their day = hop back.`; (3) choice halfChoices (answer land.ampm, hint references crossing 🥪/💤 or not); (4) LAST landing — `clock-set` when the hop crosses midnight (land24 wraps: `to24(h12,ampm) ± offset` outside 0..23), else rng pick of `clock-set`/`line-hop` (dir −1 for behind) — ask `Hop ${offset} hour(s) ${ahead?"forward":"back"} from ${c(h12,ampm)}. What does ${b}'s clock show?`. finalAnswers land h12. invariant as current file. data `{ a24, offset, ahead, result, fig }`.

**Task 15 — Day 8 `chained-zones` "Two Jumps, One Big Jump" 🧭 + Day 9 `flight-zones` "Aoife Flies Away" ✈️ (rewrites).**
- chained: x 2..6 ahead, y 1..x−1 back, net=x−y. Steps: (1) `warmupDirection(rng)`; (2) number `Hop ${x} forward, then ${y} back. How big is the ONE jump that does both?` answer net, hint `Try it on the day-line: ${x} hops forward, ${y} hops back — you end up ${net} ahead. (That's ${x} − ${y}.)`; (3) choice halfChoices on landing; (4) LAST `clock-set` landing from `c(h12,ampm)` + net. finalAnswers landing. data/invariant as current file (keep `net === x − y ≥ 1`). Figure: dayLine single, hopFrom a24, hopTo a24+net (a24 chosen so a24+net ≤ 23 — constrain h12/ampm pick; else clockFace fallback when it would wrap).
- flight: Aoife's family flies `Dublin → <city>` (dep fixed "Dublin", arr from CITIES minus Dublin — story continuity); dur 3..7, later random, off `later ? 1..4 : 1..dur-1`, net = dur ± off ≥ 1. Steps: (1) `warmupCombine(rng)`; (2) number big-jump `The flight takes ${dur} hours, AND ${arr}'s clocks are ${off} hour(s) ${later?"ahead":"behind"}. How big is the whole jump for the clock?` answer net, hint `Two jumps in one: ${dur} for flying ${later ? `plus ${off}` : `take away ${off}`} for the zone — just like yesterday.`; (3) choice halfChoices; (4) LAST `clock-set` landing. finalAnswers landing h12; celebration blurb `The last puzzle of the journey — you've used every single day!`. data/invariant as current file plus net.
- Both register; flip `frameworks.test.ts` count to 32 here.

### Task 16: Full verification, AGENTS.md, deploy

- [ ] `npm test` — full suite green (32 frameworks × 500 seeds, figures 300 seeds, clock/rich/engine units).
- [ ] `npm run lint && npx tsc --noEmit && npm run build` — clean.
- [ ] **Wording audit (house rule):** for each of the 9, read one generated problem aloud and confirm the finalAnswer answers the prompt's exact wording; confirm no naked time string (regex `\d:00 (a\.m\.|p\.m\.)` must not appear outside chipText output — grep the framework files for `:00` outside `chip`).
- [ ] Manual smoke `npm run dev`, iPad viewport: Day 2 line-hop tap flow; Day 4 clock-set wrap sweep in Watch; Day 5 double row; Day 6 stacked NOW; warm-up chip; Lead skips picking on warm-up; Solo shows prompt + figure only; home chapters + start-here ring; one legacy framework (number-bonds) unchanged.
- [ ] Update `AGENTS.md`: Time & Clocks section — the 9-day ladder table, chip token convention, the two figures, the two input kinds, warm-up rule, "counting beats rules" pedagogy note, updated count 32.
- [ ] `vercel --prod --yes` → live smoke on aoife-frameworks.vercel.app → update memory file `project_aoife_frameworks.md`.
- [ ] Final commit + push.
