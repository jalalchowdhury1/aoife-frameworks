# Design — Money & Time frameworks (2026-06-23)

Adds **12 new reasoning frameworks** covering two unit-based domains the original
18 don't touch: **money/coins** and **time/clocks**. Source: four workbook
"Challenge" pages (coins & change, equal bills, coin combos; a.m./p.m., time
zones, flight times, 24-hour clock).

Two **new home-grid families** are added so each reads as its own learning track:
`Money & Coins` and `Time & Clocks`.

All new frameworks are **text-only** (no `Problem.figure`) — the shared figure
system is untouched. Every generator is **deterministic** and must pass the
existing 500-seed `frameworks.test.ts` contract (non-negative integer number
steps; ≥2 decoys per step, none equal to the ask, no "What is A op B?" decoy that
evaluates to a real answer; every final answer derived by a number step; last
step's answer is a final answer; `invariant(data)` holds).

## Family: Money & Coins (5, smallest-concept-first)

1. **Coin Counter** `coin-counter` 🪙 — add a handful of coins by value
   (quarter 25¢, dime 10¢, nickel 5¢, penny 1¢). *Foundation: coin values.*
2. **Fewest Coins** `fewest-coins` 🎯 — make an amount with the **least** coins
   (greedy: biggest coin that fits, repeat). Builds on #1.
3. **Making Change** `making-change` 🛒 — cost X, pay Y → change = Y−X, then
   fewest coins. **= workbook Q6.** Capstone for #1–3.
4. **Equal Bills** `equal-bills` 💵 — same number of \$5 and \$1 bills total \$T →
   how many of each (value of one pair, T ÷ pair). **= Q5** (hidden number).
5. **Two Coins** `two-coins` ⚖️ — N coins of two types worth total C → how many
   of each. **= Q7.** Structurally identical to the proven `two-kinds`
   swap-reasoning (coin value plays the role of "legs"), so `extra ÷ perSwap`
   is always an integer by construction.

## Family: Time & Clocks (7, finely broken down)

Each teaches one atomic skill the next reuses. **Whole-hour offsets only** so
minutes never change; the final numeric answer is the **hour** (1–12, or the
24-hour value for #3), with **a.m./p.m. carried as a `choice` step** (the engine's
final answer must be a number).

1. **A.M. or P.M.?** `am-pm` 🌅 — meaning of a.m./p.m.; classify an event;
   midnight = 12 a.m., noon = 12 p.m. *Pure foundation.*
2. **Clock Add** `clock-add` 🕒 — "10 p.m. + 6 h → 4 a.m." Wrap past 12 + flip
   a.m./p.m. The mechanic every zone puzzle reuses.
3. **24-Hour Clock** `clock-24` 🕓 — 1 p.m. = 13:00, so 6 p.m. = 18:00. **= Q13.**
4. **Find the Time Difference** `time-difference` 🌍 — two cities' clocks → hours
   apart + ahead/behind. **= Q8 part 1.**
5. **Convert Across Time Zones** `time-zones` 🌎 — given offset + direction,
   convert a specific time (reuses #2). **= Q8 part 2.**
6. **Chained Time Zones** `chained-zones` 🧭 — two offsets, three cities. **= Q11.**
7. **Flight + Time Zones** `flight-zones` ✈️ — flight duration **and** a zone
   offset together. **= Q12, capstone.**

## Registration & test

- `lib/frameworks/index.ts`: import + register all 12 (in family order); append
  the two new family names to `FAMILIES`.
- `frameworks.test.ts`: bump the count assertion `18 → 30`.

## Verification

After build: `npm test` (500 seeds × 30), `npm run lint`, `npm run build`, then
open every new puzzle in a browser and walk each stage for logical correctness.
