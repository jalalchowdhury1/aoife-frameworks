import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";

const SKINS = [
  { a: "comic books", b: "notebooks" },
  { a: "toy cars", b: "stickers" },
  { a: "story books", b: "pencils" },
];

export const multiStepMoney: Framework = {
  id: "multi-step-money",
  title: "Multi-Step Money",
  emoji: "💰",
  family: "Multi-Step & Real-World",
  blurb:
    "Aoife has money for one kind of item — find how many of a cheaper item she can buy instead.",
  source: "photo",
  invariant: (d) => d.n * d.p === d.total && d.q * d.k === d.total,
  generate(rng: Rng): Problem {
    const s = rng.pick(SKINS);

    // Find a clean combo: total of money divides evenly by the new price,
    // giving a small whole number k of cheaper items.
    let p = 6;
    let n = 4;
    let q = 3;
    let total = n * p;
    let k = total / q;
    for (let tries = 0; tries < 200; tries++) {
      p = rng.int(4, 9);
      n = rng.int(2, 6);
      total = n * p;
      // The swap item must be genuinely CHEAPER (q < p) so the "same money buys
      // more of a cheaper thing" premise holds.
      q = rng.int(2, Math.min(6, p - 1));
      if (total % q === 0) {
        k = total / q;
        if (k >= 2 && k <= 15) break;
      }
    }

    const steps: Step[] = [
      {
        id: "total",
        input: "number",
        ask: `What is the hidden TOTAL of money? (${n} × $${p})`,
        answer: total,
        hint: `She had enough for ${n} ${s.a} at $${p} each: ${n} × ${p}.`,
        decoyQuestions: [
          `How many ${s.b} can she buy?`,
          `What is ${n} + ${p}?`,
        ],
      },
      {
        id: "want",
        input: "choice",
        ask: "What does the question want now?",
        choices: [
          { label: `${s.b} at $${q} each`, value: "b" },
          { label: `More ${s.a}`, value: "a" },
        ],
        answer: "b",
        hint: `Read the last sentence — it asks about the ${s.b}.`,
        decoyQuestions: [
          `What is ${total} × ${q}?`,
          `How much money is left over?`,
        ],
      },
      {
        id: "count",
        input: "number",
        ask: `Total ÷ price: ${total} ÷ ${q}`,
        answer: k,
        hint: `Share the $${total} into groups of $${q}: ${total} ÷ ${q}.`,
        decoyQuestions: [
          `What is ${total} − ${q}?`,
          `What is ${total} × ${q}?`,
        ],
      },
    ];

    return {
      promptText: `Aoife has enough money for ${n} ${s.a} at $${p} each. Instead she spends the SAME money on ${s.b} that cost $${q} each. How many ${s.b} can she buy?`,
      steps,
      finalAsk: `How many ${s.b}?`,
      finalAnswers: [{ label: s.b, value: k }],
      data: { n, p, q, k, total },
    };
  },
};
