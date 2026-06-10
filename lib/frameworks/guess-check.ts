import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";

const SKINS = [
  {
    intro: (P: number, S: number) =>
      `Two whole numbers multiply to ${P} and add up to ${S}. What are the two numbers?`,
    why: "Detective puzzle: find the secret pair!",
  },
  {
    intro: (P: number, S: number) =>
      `Two whole numbers multiply to ${P} and add up to ${S}. What are the two numbers?`,
    why: "Two mystery numbers are hiding. Sniff them out!",
  },
  {
    intro: (P: number, S: number) =>
      `Two whole numbers multiply to ${P} and add up to ${S}. What are the two numbers?`,
    why: "A times-and-plus riddle to crack.",
  },
];

// List a few factor pairs of P (small numbers, kid-friendly) for the hint.
function factorPairs(P: number): string {
  const pairs: string[] = [];
  for (let a = 1; a * a <= P; a++) {
    if (P % a === 0) pairs.push(`${a}×${P / a}`);
  }
  return pairs.join(", ");
}

export const guessCheck: Framework = {
  id: "guess-check",
  title: "Guess · Check · Adjust",
  emoji: "🎯",
  family: "Reasoning to a Hidden Number",
  blurb:
    "Two whole numbers multiply to one total and add to another — guess a factor pair, then check the sum.",
  source: "added",
  invariant: (d) => d.x * d.y === d.P && d.x + d.y === d.S && d.x < d.y,
  generate(rng: Rng): Problem {
    rng.pick(SKINS); // vary nothing structural; keeps replays feeling fresh
    const x = rng.int(2, 9);
    const y = rng.int(x + 1, 10);
    const P = x * y;
    const S = x + y;

    const steps: Step[] = [
      {
        id: "smaller",
        input: "number",
        ask: `Find two numbers that multiply to ${P} AND add to ${S}. What is the SMALLER one?`,
        answer: x,
        hint: `Try factor pairs of ${P} and see which adds to ${S}. Factor pairs: ${factorPairs(
          P,
        )}.`,
        decoyQuestions: [
          `What is ${P} + ${S}?`,
          `What is ${P} × ${S}?`,
          `What is the LARGER number?`,
        ],
      },
      {
        id: "larger",
        input: "number",
        ask: `Its partner: ${P} ÷ ${x}`,
        answer: y,
        hint: `The two numbers multiply to ${P}, so divide: ${P} ÷ ${x}.`,
        decoyQuestions: [
          `What is ${P} × ${x}?`,
          `What is ${S} ÷ ${x}?`,
          `What is ${P} + ${x}?`,
        ],
      },
      {
        id: "check",
        input: "number",
        ask: `Check they add to ${S}: ${x} + ${y}`,
        answer: S,
        hint: `Add your two numbers together: ${x} + ${y}. It should equal ${S}.`,
        decoyQuestions: [
          `What is ${x} × ${y}?`,
          `What is ${y} − ${x}?`,
          `What is ${P} − ${S}?`,
        ],
      },
    ];

    return {
      promptText: `Two whole numbers multiply to ${P} and add up to ${S}. What are the two numbers?`,
      steps,
      finalAsk: `What are the two numbers?`,
      finalAnswers: [
        { label: "smaller", value: x },
        { label: "larger", value: y },
      ],
      data: { x, y, P, S },
    };
  },
};
