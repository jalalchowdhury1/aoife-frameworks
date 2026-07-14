import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";

const NAMES = ["Aoife", "Bron", "Santino", "Mayam", "Natalia"];

// Foundation: a coin is worth its VALUE, not 1. Add a handful of coins by value.
export const coinCounter: Framework = {
  id: "coin-counter",
  title: "Coin Counter",
  emoji: "🪙",
  family: "Money & Coins",
  blurb:
    "A handful of coins — turn each kind into its value, then add them up.",
  source: "added",
  invariant: (d) =>
    d.vq + d.vd + d.vn + d.p === d.total &&
    d.vq === d.q * 25 &&
    d.vd === d.d * 10 &&
    d.vn === d.n * 5,
  generate(rng: Rng): Problem {
    const name = rng.pick(NAMES);
    const q = rng.int(1, 2);
    const d = rng.int(1, 3);
    const n = rng.int(1, 3);
    const p = rng.int(1, 4);
    const vq = q * 25;
    const vd = d * 10;
    const vn = n * 5;
    const total = vq + vd + vn + p; // < 100, so it's a relatable amount of cents

    const steps: Step[] = [
      {
        id: "vq",
        input: "number",
        ask: `Each quarter is worth 25¢. What ${q === 1 ? "is" : "are"} the ${q} quarter${q === 1 ? "" : "s"} worth? (${q} × 25)`,
        answer: vq,
        hint: `${q} quarter${q === 1 ? "" : "s"} at 25¢ each: ${q} × 25.`,
        decoyQuestions: [
          "How many coins are there in all?",
          "What is one quarter worth?",
        ],
      },
      {
        id: "vd",
        input: "number",
        ask: `Each dime is worth 10¢. What ${d === 1 ? "is" : "are"} the ${d} dime${d === 1 ? "" : "s"} worth? (${d} × 10)`,
        answer: vd,
        hint: `${d} dime${d === 1 ? "" : "s"} at 10¢ each: ${d} × 10.`,
        decoyQuestions: [
          "What are the quarters worth?",
          "How many dimes are there?",
        ],
      },
      {
        id: "vn",
        input: "number",
        ask: `Each nickel is worth 5¢. What ${n === 1 ? "is" : "are"} the ${n} nickel${n === 1 ? "" : "s"} worth? (${n} × 5)`,
        answer: vn,
        hint: `${n} nickel${n === 1 ? "" : "s"} at 5¢ each: ${n} × 5.`,
        decoyQuestions: [
          "What are the dimes worth?",
          "How many nickels are there?",
        ],
      },
      {
        id: "total",
        input: "number",
        ask: `Pennies are 1¢ each, so the ${p} penn${p === 1 ? "y is" : "ies are"} ${p}¢. Now add it ALL up: ${vq} + ${vd} + ${vn} + ${p}`,
        answer: total,
        hint: `Put the four values together: ${vq} + ${vd} + ${vn} + ${p}.`,
        decoyQuestions: [
          "How many coins are there altogether?",
          "What are the quarters worth?",
        ],
      },
    ];

    return {
      promptText: `${name} has ${q} quarter${q === 1 ? "" : "s"}, ${d} dime${d === 1 ? "" : "s"}, ${n} nickel${n === 1 ? "" : "s"}, and ${p} penn${p === 1 ? "y" : "ies"}. How much money is that, in cents?`,
      steps,
      finalAsk: "How much money altogether, in cents?",
      finalAnswers: [{ label: "cents", value: total }],
      data: { q, d, n, p, vq, vd, vn, total },
    };
  },
};
