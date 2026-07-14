// Pure money helpers shared by the Money & Coins frameworks. Cents only — never
// floats. US coins are canonical, so the greedy "biggest coin first" choice is
// always the FEWEST coins (this is what makes the lesson true).

export const COINS = [
  { name: "quarter", one: "quarter", plural: "quarters", value: 25 },
  { name: "dime", one: "dime", plural: "dimes", value: 10 },
  { name: "nickel", one: "nickel", plural: "nickels", value: 5 },
  { name: "penny", one: "penny", plural: "pennies", value: 1 },
] as const;

export interface Greedy {
  q: number;
  d: number;
  n: number;
  p: number;
  total: number; // total number of coins
}

// Fewest coins to make `cents`, biggest-first.
export function greedy(cents: number): Greedy {
  let r = cents;
  const counts: number[] = [];
  for (const c of COINS) {
    counts.push(Math.floor(r / c.value));
    r %= c.value;
  }
  const [q, d, n, p] = counts;
  return { q, d, n, p, total: q + d + n + p };
}

// 25¢ -> "25¢", 100¢ -> "$1.00", 415¢ -> "$4.15"
export function fmtMoney(cents: number): string {
  if (cents < 100) return `${cents}¢`;
  return `$${(cents / 100).toFixed(2)}`;
}

import type { Step } from "./types";

// Build the "fewest coins" question-script for an amount: one "how many <coin>
// fit?" step per coin actually used (biggest first), then a "count the coins"
// total step (which is the final answer). Shared by Fewest Coins and Making
// Change so the greedy lesson can never drift between them.
export function greedySteps(cents: number): { steps: Step[]; total: number } {
  const g = greedy(cents);
  const used = COINS.map((c, i) => ({ c, count: [g.q, g.d, g.n, g.p][i] })).filter(
    (x) => x.count > 0,
  );
  const steps: Step[] = [];
  let remaining = cents;
  used.forEach(({ c, count }, i) => {
    const left = remaining - count * c.value;
    // Honest framing: only call it "biggest coin first" when it IS the biggest
    // coin; if bigger coins were too big, say so — that's the greedy lesson.
    const lead =
      i > 0
        ? "Next size down."
        : c.value === 25
          ? "Biggest coin first."
          : `A quarter is too big for ${remaining}¢, so take the biggest coin that fits.`;
    steps.push({
      id: `fit-${c.name}`,
      input: "number",
      ask: `${lead} How many ${c.plural} (${c.value}¢) fit into ${remaining}¢?`,
      answer: count,
      hint: `How many ${c.value}s are in ${remaining}? That leaves ${left}¢ for smaller coins.`,
      // NOTE: never use "Which coin should you try next?" as a decoy here —
      // that IS the greedy lesson's own self-question (2026-07-15 audit).
      decoyQuestions: [
        `How much money is left over after the ${c.plural}?`,
        "How many coins are in the whole piggy bank?",
      ],
    });
    remaining = left;
  });
  // With a single coin type the "count them all" step would state its own
  // answer ("Count all the coins you used: 2" → 2), so skip it — the fit step
  // already IS the final answer.
  if (used.length > 1) {
    const sum = used.map((u) => `${u.count}`).join(" + ");
    steps.push({
      id: "coin-total",
      input: "number",
      ask: `Count all the coins you used: ${sum}`,
      answer: g.total,
      hint: `Add up how many of each coin you used: ${sum}.`,
      decoyQuestions: [
        "How much money was it in all?",
        "Which coin did you use the most of?",
      ],
    });
  }
  return { steps, total: g.total };
}
