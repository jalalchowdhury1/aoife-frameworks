# Time & Clocks Redesign — "Aoife's Day / Around the World"

**Date:** 2026-07-11 · **Status:** approved by owner (this conversation) · **Replaces** the
7 text-only Time & Clocks frameworks from the 2026-06-23 batch.

## 1. Problem

Aoife finds the Time & Clocks family difficult. Root causes identified in review:

1. **Text-only.** The family uses zero figures even though the app has a figure system and
   time is inherently visual.
2. **Rule-first teaching.** "Pass 12 → subtract 12 → flip a.m./p.m." bundles three abstract
   rules into one lesson (clock-add) that everything later depends on.
3. **No continuity.** Lessons don't reference each other; a.m./p.m. is a naked Latin
   abbreviation; problems jump between random names/cities with no anchor to her life.

Owner's brief: redo the whole section; expand/reduce freely; make it intuitive and visual;
one lesson per day should carry into the next; multiple explanations of the same idea are
welcome. Owner approved: gentle path (no locks) + interactive visuals.

## 2. Design principles (the contract every lesson must honor)

1. **See it / count it — never memorize it.** The taught method is always hop-and-count on
   a visual. Wrap-past-12 and the a.m./p.m. flip *happen on screen*; they are never rules.
   Arithmetic shortcuts (−12, +12) appear only as optional "✨ magic shortcut" hint content,
   never as the primary method or a required step.
2. **Her day is the coordinate system.** Hours are anchored to daily events (🍳 breakfast 8,
   🎒 school 9, 🥪 lunch 12, 🛝 play 4, 🍽️ dinner 6, 🛏️ bed 8, 💤 sleep). Noon = lunchtime.
   Midnight = the middle of sleep.
3. **a.m./p.m. = lunch + colors, everywhere.** a.m. = ☀️ before-lunch half (gold);
   p.m. = 🌙 after-lunch half (purple). Every time value in the family renders as a colored
   chip (see §5.3) — never naked text. Same gold/purple on the day-line ribbon, clock rim,
   and answer buttons.
4. **One new idea per day.** Each lesson adds exactly one concept on top of the previous.
5. **Tiny numbers at the frontier.** Hops of 1–3 when a concept debuts; grow only after.
   Whole hours only (existing `lib/clock.ts` constraint stands — minutes never change).
6. **Both lenses in every hint.** If a step is asked on the clock face, its hint re-explains
   on the day-line, and vice versa.

## 3. The ladder — 9 lessons in 2 chapters

Chapter badges and Day numbers appear on the home-page cards (§7). Nothing is locked.

### 🏠 Chapter 1 — Aoife's Day (Days 1–5, starring Aoife)

| Day | id | Title | Emoji | The ONE new idea |
|---|---|---|---|---|
| 1 | `am-pm` *(kept)* | Morning or After-Lunch? | 🌅 | a.m./p.m. = which half of the day-line an event lives in |
| 2 | `hop-hours` *(new)* | Hop the Hours | 🐇 | adding hours = hopping forward; never crosses 12 (no flip/wrap yet) |
| 3 | `past-noon` *(new)* | Past Lunchtime! | 🌞 | hop across the noon marker → the half flips (seen, not stated) |
| 4 | `clock-add` *(kept)* | Around the Clock | 🕒 | Day 2 + Day 3 together; the hand loops past 12 by itself |
| 5 | `clock-24` *(kept)* | The Keep-Counting Clock | 🕓 | some clocks don't start over after lunch — read 13…23 off the day-line's bottom row |

### 🌍 Chapter 2 — Around the World (Days 6–9)

| Day | id | Title | Emoji | The ONE new idea |
|---|---|---|---|---|
| 6 | `time-difference` *(kept)* | Who's Ahead? | 🌍 | same moment, two clocks; count hops between; further-along-in-their-day = ahead |
| 7 | `time-zones` *(kept)* | Jump to Another City | 🌎 | ahead = hop forward, behind = hop back |
| 8 | `chained-zones` *(kept)* | Two Jumps, One Big Jump | 🧭 | combine two jumps into one, then it's Day 7 |
| 9 | `flight-zones` *(kept)* | Aoife Flies Away | ✈️ | flight hours + zone jump = one big jump (capstone) |

Kept ids preserve her localStorage stars. `time-elapsed` (Measuring family) is untouched.
Framework count 30 → 32 (update the count assertion in `frameworks.test.ts`).

**Day 3 scope:** crossing **noon** is the lesson. Crossing midnight is introduced in a
"the same thing happens while you sleep 💤" narration line and appears as an occasional
variant from Day 4 on — never as Day 3's main event.

**Warm-up carry-over (Days 2–9):** each `generate()` prepends one step flagged
`warmup: true` exercising the *previous* day's core skill, phrased "⭐ Warm-up — remember
yesterday? …". Engine behavior in §6.3.

## 4. Per-lesson generator sketches

All generators keep the existing contract (500-seed self-test: integer non-negative
answers, ≥2 decoys/step, no decoy evaluates to a real answer, script reaches & ends on the
final answer, invariant holds). Numbers below are generation ranges.

- **Day 1 `am-pm`:** 4 events from the anchor set placed on a day-line figure; per-event
  choice step (☀️ before lunch / 🌙 after lunch), final count of 🌙 events (1–3). Figure:
  `dayLine` with event icons. Interactive: none needed (choice chips already carry the
  colors).
- **Day 2 `hop-hours`:** start hour 1–9 within one half; hop 1–3 (result ≤ 11, same half —
  generator guarantees no 12-crossing). Steps: hop-count on clock (`line-hop` input on the
  day-line variant or `clock-set` on the face — generator picks one per problem), then final
  hour. Warm-up: one Day-1 half-identification choice.
- **Day 3 `past-noon`:** start 9–11 a.m., hop 2–4 crossing exactly noon (result 12–3 p.m.).
  Steps: "will you hop past 🥪 lunchtime?" (choice yes/no — always yes on the main variant,
  a no-crossing decoy variant 1-in-4 keeps her honest), `line-hop` landing cell, then the
  half chip (☀️/🌙 choice). Warm-up: one Day-2 same-half hop.
- **Day 4 `clock-add`:** start any hour, hop 1–8, may or may not cross 12 (both halves,
  occasional midnight variant). Steps: cross-or-not choice → `clock-set` landing hour →
  half chip. "✨ magic shortcut" appears only inside the landing-hour hint (mentions
  taking 12 away *after* the counted answer). Warm-up: one Day-3 crossing question.
- **Day 5 `clock-24`:** a p.m. (or occasionally a.m.) chip; steps: find the hour's cell on
  the double-row day-line (`line-hop`), read the bottom-row number (number input). a.m.
  variant: bottom row shows the same number — idea reinforced, not exception-listed.
  Hint carries the +12 shortcut. Warm-up: one Day-4 hop.
- **Day 6 `time-difference`:** two cities, offset 1–5 (small — the counting is new), same
  half where possible; two clock faces + stacked day-lines with a NOW line. Steps: who's
  ahead (choice, hint = "whose day is further along?") → count hops between (`line-hop`
  along the gap). Warm-up: one Day-5 read-the-bottom-row.
- **Day 7 `time-zones`:** offset 1–6 with direction given in words ("Paris's clocks are
  2 hours ahead"); steps: hop forward or back? (choice) → `clock-set`/`line-hop` landing →
  half chip when it flips. Warm-up: one Day-6 who's-ahead.
- **Day 8 `chained-zones`:** offsets x (2–6 ahead) then y (1..x−1 back); steps: one-big-jump
  number (x − y, phrased "hop x forward then y back — how big is the whole jump?") → then
  exactly Day 7's two steps. Warm-up: one Day-7 direction choice.
- **Day 9 `flight-zones`:** flight 3–7 h, zone 1–4 either direction (net ≥ 1); steps:
  one-big-jump number → landing hour (`clock-set`) → half chip. Warm-up: one Day-8
  combine-jumps. Celebration copy references the whole journey.

City list for Days 6–9, trimmed to child-recognizable + story-relevant: Dublin, London,
New York, Toronto, Dhaka, Singapore, Honolulu, Sydney.

## 5. Visual system

### 5.1 `DayLine` figure (`lib/figures/DayLine.tsx`, FigureSpec kind `dayLine`)

A horizontal SVG strip of 24 hour cells, midnight → noon → midnight.

- **Ribbon:** top ribbon gold across cells 0–11 labeled "☀️ before lunch (a.m.)", purple
  across 12–23 labeled "🌙 after lunch (p.m.)". Cell backgrounds carry a subtle
  night–dawn–day–dusk–night gradient (the sun story); the ribbon is the a.m./p.m. anchor.
- **Markers:** 🥪 at noon, 💤 at both ends; anchor-event icons (🍳🎒🛝🍽️🛏️) at their hours
  when the problem references them.
- **Labels:** 12-hour numbers under each cell; `variant: "double"` (Day 5) adds the 0–23
  bottom row under the 12-hour row.
- **Props (all mirrored in problem `data` for the consistency test):** `highlight` cell,
  `hopFrom`/`hopTo` (rendered hop arcs), `events` (icon+hour list), `variant`
  (`single | double | stacked`), `stacked` second-line offset + NOW-line hour for
  Days 6–7.
- iPad-first sizing: full-width, ≥44 px touch cells.

### 5.2 `ClockFace` figure (`lib/figures/ClockFace.tsx`, kind `clockFace`)

Analog SVG clock, hour hand only (minutes :00). Rim tinted gold/purple by the current
half; small ☀️/🌙 badge at top. Props: `hour`, `ampm`, optional `ghostHour` (start position
shown faintly during hops), optional second clock for Day 6 (`pair` variant).

### 5.3 Time chips

Inline markup `[[7|am]]` inside `promptText` / `ask` / `hint` strings renders as a colored
chip — gold `7:00 ☀️ a.m.` or purple `7:00 🌙 p.m.` — via a tiny renderer used by
`StageEngine` wherever those strings are shown (Watch narration included). Plain-text
fallback (tests, non-engine contexts): the same string reads naturally when unrendered.
No time value in this family may appear outside a chip.

## 6. Engine extensions (small, bounded)

### 6.1 New input kinds

- `input: "clock-set"` — renders `ClockInput`: the problem's clock face; she taps (or
  drags) the hand around; each tap advances one hour with a running count bubble
  ("1… 2… 3…"); tapping ✓ submits the hour the hand points to. Answer semantics identical
  to a `number` step (validation, hints, Lead decoys unchanged).
- `input: "line-hop"` — renders `DayLineInput`: the day-line; she taps cells to hop
  (cells paint as she goes, count bubble); ✓ submits the landing cell's hour. Same number
  semantics. (Day 5 reads the *bottom-row* value of the tapped cell.)
- Watch stage auto-plays these inputs as a short animation (hand sweeping / cells
  painting) before showing the answer — the narration IS the demonstration.

### 6.2 Chip renderer

`renderRich(text)` — regex-parses `[[h|am]]`/`[[h|pm]]` tokens into chip spans; used by
StageEngine for prompt/ask/hint display. Unit-tested.

### 6.3 Warm-up steps

`Step.warmup?: boolean`. Behavior: rendered with a "⭐ Warm-up" chip header; in **Lead**,
warm-up steps are presented directly (no question-picking) before picking begins; **Solo**
is unaffected (Solo already shows only the problem + final answer). Self-test: warm-up
steps are exempt from the "answer must feed the final answer" reachability rule but must
still satisfy all other step rules; the *non-warm-up* script must still reach and end on
the final answer.

### 6.4 Home page

Time & Clocks cards render grouped under the two chapter headers with Day-N badges, in
ladder order; a "⭐ start here" ring marks the first day whose Solo star is unearned.
Pure presentation — progress storage unchanged; other families' rendering unchanged.

## 7. Testing & rollout

- `frameworks.test.ts`: count 32; all existing per-framework contract rules run over the
  new/rewritten generators (500 seeds each); warm-up exemption per §6.3.
- `figures.test.ts`: `dayLine` and `clockFace` consistency — every number/icon/hop shown
  must match `data` (300 seeds/framework), same standard as existing figures.
- New unit tests: `renderRich`, `ClockInput`/`DayLineInput` value semantics, warm-up Lead
  behavior.
- Manual audit pass per the house rule: every finalAnswer answers the prompt's *wording*.
- Deploy: `npm test` green → `vercel --prod --yes` → live smoke-check on iPad viewport.

## 8. Non-goals

Minutes, sound/audio, locking/gating, streaks, touching `time-elapsed` or any other
family, backend/analytics, timer display.
