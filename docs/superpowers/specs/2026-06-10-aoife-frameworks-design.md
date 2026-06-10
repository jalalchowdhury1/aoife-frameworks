# Aoife Frameworks — Design Doc

**Date:** 2026-06-10
**Repo (planned):** `aoife-frameworks` · kid-facing title: *Math Detective* (working name)
**Status:** Design approved in brainstorming; awaiting spec review before planning.

---

## 1. Purpose

Aoife (age ~7) is already strong at **operations** — four-digit addition, double-digit
multiplication — these are easy for her. Her gap is **reasoning**: facing a word problem
or challenge puzzle, she doesn't yet know *what to compute*. She freezes not because the
arithmetic is hard, but because she hasn't built the mental **frameworks** for asking the
right questions.

This app teaches those frameworks. For each *type* of problem it gives her a fixed
**question-script** — the same self-questions, in the same order, every time — and trains
her up a ladder until she can run that script herself on a problem she has never seen.

> **North-star goal (owner's words):** *"have Aoife ask the correct questions… once she
> has the correct questions she drills into it… and gets to the correct solutions by
> herself."* The whole design is bent toward making question-*asking* a habit, not just
> question-answering.

It is a sibling to the existing `aoife-math*` repos but **deliberately different**: those
drill operations; this builds reasoning schemas. There is no overlap in purpose.

### Success criteria
- Aoife can take a never-before-seen problem of a known type and, unprompted, ask herself
  the right sequence of questions and reach the answer.
- The arithmetic in every problem stays inside her comfort zone, so the *thinking* is
  always the challenge — never the computation.
- She can replay endlessly without memorizing answers, because both the numbers and the
  story change every time.

---

## 2. Core design decisions (settled in brainstorming)

| Decision | Choice |
|---|---|
| Structure | A **blend**: ~18 distinct frameworks; each gets the full ladder + a generator. |
| Learning loop | **4-stage ladder per framework:** Watch → Together → Lead → Solo. |
| "Ask the right questions" | The **Lead** stage: she *chooses which question to ask next* (not just answers it). |
| Replayability | Each framework is a **generator**: random story-skin + random numbers, always solvable. |
| Device | **iPad-first.** Big touch targets, on-screen numpad, tap over typing, works in Safari offline. |
| Reading | **Text only.** No audio / read-aloud (may revisit later). |
| Difficulty | Numbers kept **small and clean** so arithmetic never blocks the reasoning. |
| Backend | **None.** Static site, progress in `localStorage`, no accounts, no API. |
| Look & stack | Same as her current game — Next.js 16 / React 19 / Tailwind v4, Bubblegum Sans, pink-purple, deploys to Vercel. |
| Timer | **No timer, no speed pressure.** Concept mastery, not racing. |

---

## 3. The 4-stage ladder (the engine)

One **shared engine** renders all four stages from the same `Problem` object. The stages
differ only in *how much they reveal and what they ask of her*. This is the "I do → we do →
you do" gradual-release model, with an extra rung inserted for question-asking.

1. **👀 Watch (I do).** The app works the whole problem, showing each question *and* its
   answer, one step at a time. She taps "next" and reads the thinking. No input required.

2. **🤝 Together (we do).** The app presents each question; **she answers it** (numpad for
   numbers, tap for choices). A wrong answer triggers a **hint** (a nudge toward the right
   idea) — never the answer. Second wrong attempt reveals the step's answer in a soft
   colour and moves on, mirroring her current game's gentle two-attempt pattern.

3. **🧭 Lead (you ask — NEW).** The script is no longer handed to her. At each step the app
   asks **"What should you ask yourself next?"** and offers the correct next question mixed
   with 2 **decoy questions** (plausible-but-wrong: a nonsense computation, or jumping
   straight to the goal too early). She taps the right question, *then* answers it. This is
   the rung that builds the question-*asking* muscle.

4. **🦋 Solo (you do).** A fresh problem, blank script. She runs the whole thing in her head
   and enters only the **final answer**. Correct → celebration (confetti). This is the
   transfer test.

**Stage unlocking.** Stages unlock in order — completing a stage once unlocks the next —
but any unlocked stage can be replayed freely. All 18 frameworks are openly selectable from
the home screen at any time (parent and child both have full freedom to pick).

---

## 4. What a framework *is* — the data model

Adding a framework means writing exactly two things: a **generator** and a
**question-script**. The engine, numpad, hint logic, figures, and all four stages are
shared and never touched. Every framework is therefore isolated and independently testable.

```ts
type InputKind = 'number' | 'choice';

interface Step {
  id: string;
  ask: string;                 // the self-question, with this problem's values filled in
  answer: number | string;     // the expected answer to this step
  input: InputKind;
  choices?: { label: string; value: number | string }[];  // when input === 'choice'
  hint: string;                // shown after a wrong attempt — a nudge, not the answer
  decoyQuestions: string[];    // Lead stage: plausible-but-wrong "next questions"
}

interface Problem {
  promptText: string;          // the word problem, story + numbers filled in
  figure?: FigureSpec;         // optional inline diagram (see §6)
  steps: Step[];               // the question-script for THIS generated instance
  finalAsk: string;            // e.g. "How many ducks and how many goats?"
  finalAnswers: { label: string; value: number }[];   // checked in Solo
}

interface Framework {
  id: string;                  // 'two-kinds'
  title: string;               // 'Two Kinds · Count & Legs'
  emoji: string;
  family: string;              // one of the 5 families in §5
  blurb: string;               // one-line description of the schema
  source: 'photo' | 'added';
  generate(rng: Rng): Problem; // deterministic given a seeded rng
}
```

**Generator contract (must hold for every framework):**
- Every generated `Problem` is solvable with a clean whole-number answer.
- Every `Step.answer` is consistent with `promptText` and with `finalAnswers`.
- Arithmetic stays small (kept inside Aoife's comfort zone).
- `generate` is deterministic given its `rng`, so problems are reproducible and testable.

A dev-time **self-test** runs each generator hundreds of times and asserts the final-answer
check passes and the step answers are internally consistent (the existing `aoife-math` repo
stress-tested its generators the same way).

---

## 5. The 18 frameworks

⭐ = straight from the photos · ➕ = added to round out a curriculum. Each line shows the
**question-script** in brief; full scripts are written during implementation. Four are
fully worked in §5.6 to set the quality bar.

### 5.1 Family 1 — Counting & Grouping
- **⭐ Sharing with Leftovers** — *What am I sharing, into what groups? · Is the question the leftover, the groups, or round-up? · Biggest multiple of the group size that fits? · How many full groups? · How many left over?*
- **➕ Equal Groups & Arrays** — *How many groups (or rows)? · How many in each? · Groups × each = total · (inverse: total ÷ groups = each).*
- **⭐ Fenceposts & Spacing** — *Are things at the ENDS or only in the gaps? · How long, how far apart? · How many gaps (length ÷ spacing)? · Posts = gaps + 1.*
- **⭐ How Many Different…** — *List every pair in order · Compute each · Cross out duplicates · Count what's left.*

### 5.2 Family 2 — Comparing & Parts
- **➕ How Many More / Fewer** — *Which is bigger? · Line them up · Difference = big − small · Re-read: is it asking more, fewer, or the total?*
- **➕ Part · Part · Whole** — *What's the whole? · What part do I know? · Missing part = whole − known part.*
- **➕ Compare-Bar** — *Draw a bar for each · Who has more, by how much? · Mark the extra · Use the total/difference to fill both bars.*

### 5.3 Family 3 — Reasoning to a Hidden Number
- **⭐ Two Kinds · Count & Legs** — *Two kinds? · How many altogether? · How many legs/wheels each? · Pretend all the smaller kind · How many extra? · Each swap adds…? · How many of each?*
- **⭐ Two-Clue Puzzles** — *Turn clue 1 into a relationship · Turn clue 2 into a relationship · Find the number that makes both true (guess-check toward it).*
- **➕ Guess · Check · Adjust** — *Make a sensible first guess · Check it against the rule · Too big or too small? · Move the guess the right way · Repeat.*
- **➕ Working Backwards** — *What's the end amount? · What was the last thing that happened? · Undo it (opposite operation) · Keep undoing back to the start.*
- **⭐ Shape Equations** — *Which equation has only ONE kind of shape? Solve that shape · Substitute its value into the next · Repeat until every shape is known.*
- **⭐ Cross-Number Grid** — *Find the cell with only one unknown · Solve that cell · Let it unlock the next · Repeat across rows and columns.*

### 5.4 Family 4 — Patterns & Structure
- **⭐ Number Bonds / Chains** — *Each square = its two circles · Where both circles are known → add · Where one is missing → subtract back.*
- **➕ Patterns & Rules** — *What changes from one term to the next? · State the rule · Extend it step by step · (jump to a far term using the rule).*

### 5.5 Family 5 — Multi-Step & Real-World
- **⭐ Multi-Step Money** — *What's the hidden total I need first? · Compute it · Now what does the question actually ask? · Do the second operation on the total.*
- **➕ Time & Elapsed** — *What do I know — start, duration, or end? · Which is missing? · start + duration = end; rearrange for the missing one.*
- **➕ Measure & Units** — *What units am I in? · Are they the same? · Convert if needed · Then compare or combine.*

### 5.6 Four fully-worked frameworks (the template quality bar)

**A · Two Kinds · Count & Legs.**
Generated values: kinds `A` (fewer legs, e.g. ducks/2) and `B` (more, e.g. goats/4);
`total` animals; `legs`. Story skins rotate: ducks&goats, hens&cows, kids&dogs (legs);
bikes&trikes (wheels). Numbers chosen so counts are whole and positive.
Script:
1. What two kinds of things? → A & B
2. How many altogether? → `total`
3. How many legs/wheels does each kind have? → `legsA` & `legsB`
4. Pretend ALL were `A` (the smaller kind). How many legs? → `legsA × total`
5. But there are really `legs`. How many extra? → `legs − legsA×total`
6. Each swap of one A for one B adds how many legs? → `legsB − legsA`
7. So how many `B`? → `extra ÷ (legsB − legsA)`
8. And how many `A`? → `total − countB`
Final: How many A and how many B? · Check: `legsA·countA + legsB·countB = legs`.
Lead decoys for step 4: *"What is total + legs?"*, *"How many B are there?"* (the goal — too soon).

**B · Sharing with Leftovers.**
Generated: total `N`, group size `g`, `q = N div g`, `r = N mod g`. A variant flag picks
the *ask*: `leftover` (answer `r`), `groups` (answer `q`), `roundup` (answer `q + (r>0?1:0)`,
e.g. "how many boxes to hold them all"). Skins: empanadas/boxes, cookies/plates,
stickers/pages, marbles/friends, string/3-ft-pieces.
Script: identify what's shared and the group size → **identify which kind of ask this is**
(the pivotal step) → biggest multiple of g in N (`q×g`) → full groups (`q`) → leftover (`r`)
→ answer the actual ask.
Lead decoys: asking for the leftover when the question wanted round-up, etc.

**C · Fenceposts & Spacing.**
Generated: spacing `s`, gap count `gaps`, length `D = s×gaps`, `bothEnds` flag.
Skins: stakes along a line, trees along a path, fence posts, lamp posts. A "with-margins"
variant adds an edge inset (the seed-tray idea) once she's solid.
Script: are the ends included? → length & spacing → gaps = D ÷ s → posts = gaps + 1 (if
both ends) → answer. Check against the spacing.
Lead decoys: *"length ÷ spacing"* offered as the final answer (forgets the +1); *"length + spacing."*

**D · Shape Equations.**
Generated: 2–3 shapes with small secret values; equations built so at least one isolates a
single shape (e.g. `◆+◆=18`), the rest chain by substitution. Final ask may be a shape's
value or a small expression (e.g. `45 ÷ ★`).
Script: find the single-shape equation and solve it → substitute into the next equation →
repeat until all shapes known → answer the final ask.
Lead decoys: *"add all the numbers together"*, picking a two-unknown equation first.

---

## 6. Figures (some frameworks are inherently visual)

The engine supports an **optional inline figure** above the question-script, so frameworks
that need a picture render one. Figures are simple, generated SVG/HTML — no external assets:
- **Number Bonds / Chains** — circles and squares with connectors.
- **Compare-Bar** — two stacked bars.
- **Equal Groups & Arrays** — a dot array.
- **Fenceposts** — a row of posts with spacing labels.
- **Patterns & Rules** — the sequence laid out left-to-right.
- **Cross-Number Grid** — the operations grid.

`FigureSpec` is a small declarative shape (e.g. `{ kind: 'numberBond', nodes, edges }`)
rendered by a figure component, OR direct inline SVG for one-off cases. Frameworks that
need no figure simply omit it.

---

## 7. Pages & navigation

- **Home grid** (`/`): 18 framework tiles grouped by family. Each tile shows the framework's
  emoji, title, and **how far she's climbed** (Watch → Together → Lead → Solo) with a ⭐ once
  she has soloed it. Tap a tile to enter.
- **Framework screen** (`/f/[id]`): runs the 4-stage ladder for that framework. A stage
  picker at the top lets her (or a parent) jump to any *unlocked* stage; otherwise it
  auto-advances to her next rung.
- **Parent peek** (optional, low priority): mirror the current game's hidden **5-tap
  gesture** to reveal a progress overview — which frameworks are mastered, which rung each
  is on. The only place progress is shown in aggregate.

This is comfortably past "at least 20 pages": Home + 18 framework lessons, each a distinct
4-stage experience.

### localStorage schema
```jsonc
"aoife-frameworks-progress": {
  "two-kinds":  { "stageReached": 3, "soloPasses": 0, "lastPlayed": "2026-06-10" },
  "fenceposts": { "stageReached": 4, "soloPasses": 2, "lastPlayed": "2026-06-10" }
  // stageReached: 1 Watch · 2 Together · 3 Lead · 4 Solo (highest unlocked)
  // mastered = soloPasses >= 1
}
```

---

## 8. UX / iPad constraints

- **Touch targets** ≥ 44px; generous spacing; nothing relies on hover or fine drag.
- **On-screen numpad** reused from the existing game for number entry; **tap** for choice
  steps. **No word typing anywhere.**
- **Text-only** problems (no audio).
- **Offline-capable**: fully static, no runtime network calls; confetti bundled from npm
  (not a CDN), matching the sibling repo's deliberate choice.
- **Low-pressure**: no timer, no countdown, gentle two-attempt hinting, celebration on Solo.
- **Look**: pink/purple theme, Bubblegum Sans kid font, friendly rounded cards — visually a
  sibling of her current app.

---

## 9. Tech & deployment

- **Next.js 16 (App Router) + React 19 + Tailwind v4**, fully static client-side, same as
  `aoife-math`. `"use client"` framework screens; all logic in the browser.
- **Repo:** `github.com/jalalchowdhury1/aoife-frameworks` (public). Deploys to **Vercel**
  (manual `vercel --prod` if the GitHub App link isn't authorized, as with the sibling repo).
- **No env vars, no secrets, no backend, no database, no auth.**
- **AGENTS.md** at the repo root as the single source of truth (house convention), warning
  future agents about the generator contract and the no-CDN/no-backend rules.

### Suggested file layout
```
app/page.tsx              — home grid of 18 framework tiles + progress
app/f/[id]/page.tsx       — framework screen; mounts the stage engine
app/globals.css           — Tailwind v4 theme (pink/purple, Bubblegum Sans)
lib/engine/               — shared 4-stage engine (Watch/Together/Lead/Solo), numpad, hints
lib/figures/              — figure components (number bond, bars, array, posts, grid, pattern)
lib/frameworks/<id>.ts    — one file per framework: generator + question-script
lib/frameworks/index.ts   — registry of all 18
lib/progress.ts           — localStorage read/write
lib/rng.ts                — small seedable RNG for deterministic generators
lib/frameworks/__tests__  — generator self-tests (consistency + solvability)
```

---

## 10. Out of scope (YAGNI)

- No backend, accounts, sync, or leaderboards.
- No audio / read-aloud.
- No adaptive-difficulty ML engine. (Numbers may scale *mildly* with mastery; nothing more.)
- No visible timer or speed scoring.
- No attempt to reproduce the hairy 2-D seed-tray edge case exactly; the Fenceposts
  "with-margins" variant uses cleaner, guaranteed-solvable instances.

---

## 11. Risks & mitigations

- **Script quality is the product.** 18 question-scripts are the bulk of the value; a weak
  script teaches a weak framework. *Mitigation:* the §5.6 four set the bar; each remaining
  script is reviewed against the same shape before it ships.
- **Lead-stage decoys must be plausible yet clearly wrong on reflection.** *Mitigation:*
  standard decoy patterns (nonsense computation; jump-to-goal-too-early; right-idea-wrong-step)
  defined per framework.
- **Some frameworks need figures.** *Mitigation:* the engine supports optional generated
  figures (§6) from day one, so visual frameworks aren't bolted on later.
- **Generator bugs produce unsolvable problems.** *Mitigation:* per-framework self-tests
  asserting solvability and step-consistency, run in CI/dev before deploy.

---

## 12. Build order (high level — detailed plan comes next)

1. Scaffold the Next.js app, theme, and home shell (sibling of `aoife-math`).
2. Build the shared 4-stage engine + numpad + hint logic against **one** framework
   (Two Kinds), proving all four stages end-to-end.
3. Add the figure components.
4. Implement the remaining 17 frameworks (generator + script + self-test each), in family
   order, reusing the engine untouched.
5. Home grid + progress + optional parent peek.
6. Generator self-tests green; browser E2E of a couple of frameworks through all 4 stages.
7. AGENTS.md, commit, deploy to Vercel.
