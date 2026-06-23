import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";

const NAMES = ["Aoife", "Bron", "Santino", "Mayam", "Natalia"];
// Two bill kinds with an equal COUNT. value of one pair must divide the total.
const PAIRS = [
  { a: 5, b: 1 },
  { a: 10, b: 1 },
  { a: 10, b: 5 },
];

// The Q5 hidden-number puzzle: the SAME number of two bill kinds totals $T.
// Group them into pairs worth (a+b) each, then T ÷ (a+b) is how many of EACH.
export const equalBills: Framework = {
  id: "equal-bills",
  title: "Equal Bills",
  emoji: "💵",
  family: "Money & Coins",
  blurb:
    "Someone has the SAME number of two kinds of bills. Group them into pairs to find how many of each.",
  source: "photo",
  invariant: (d) =>
    d.a * d.k + d.b * d.k === d.total && (d.a + d.b) * d.k === d.total,
  generate(rng: Rng): Problem {
    const name = rng.pick(NAMES);
    const { a, b } = rng.pick(PAIRS);
    const k = rng.int(2, 8);
    const pair = a + b;
    const total = pair * k;

    const steps: Step[] = [
      {
        id: "pair",
        input: "number",
        ask: `Put one $${a} bill with one $${b} bill. How much is that pair worth? (${a} + ${b})`,
        answer: pair,
        hint: `One $${a} and one $${b} together: ${a} + ${b}.`,
        decoyQuestions: [
          `How many $${a} bills are there?`,
          "How much money is there in all?",
        ],
      },
      {
        id: "pairs",
        input: "number",
        ask: `How many of these $${pair} pairs make $${total}? (${total} ÷ ${pair})`,
        answer: k,
        hint: `Share $${total} into groups of $${pair}: ${total} ÷ ${pair}.`,
        decoyQuestions: [
          "How much is one pair worth?",
          "How much money is there in all?",
        ],
      },
      {
        id: "countA",
        input: "number",
        ask: `Each pair has one $${a} bill, so how many $${a} bills are there?`,
        answer: k,
        hint: `One $${a} bill per pair, and there are ${k} pairs.`,
        decoyQuestions: [
          `How much is one $${a} bill worth?`,
          "How many pairs are there left?",
        ],
      },
      {
        id: "countB",
        input: "number",
        ask: `And how many $${b} bills are there?`,
        answer: k,
        hint: `One $${b} bill per pair too, and there are ${k} pairs.`,
        decoyQuestions: [
          `How much is one $${b} bill worth?`,
          "How much money is there in all?",
        ],
      },
    ];

    return {
      promptText: `${name} has the same number of $${a} bills and $${b} bills. Altogether ${name} has $${total}. How many of each kind of bill does ${name} have?`,
      steps,
      finalAsk: `How many $${a} bills? How many $${b} bills?`,
      finalAnswers: [
        { label: `$${a} bills`, value: k },
        { label: `$${b} bills`, value: k },
      ],
      data: { a, b, k, total },
    };
  },
};
