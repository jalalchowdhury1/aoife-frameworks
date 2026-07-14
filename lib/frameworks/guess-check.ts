import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";

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
    const x = rng.int(2, 9);
    const y = rng.int(x + 1, 10);
    const P = x * y;
    const S = x + y;

    const steps: Step[] = [
      {
        id: "smaller",
        input: "number",
        ask: `Guess two numbers that multiply to ${P} AND add to ${S}. What is the SMALLER one?`,
        answer: x,
        hint: `Try factor pairs of ${P} and see which one adds to ${S}. Factor pairs: ${factorPairs(
          P,
        )}.`,
        decoyQuestions: [
          `What is ${P} + ${S}?`,
          `What is ${P} × ${S}?`,
          `Can the two numbers be the same?`,
        ],
      },
      {
        id: "larger",
        input: "number",
        ask: `Its partner is ${P} ÷ ${x}. What is the LARGER number?`,
        answer: y,
        hint: `The two numbers multiply to ${P}, so share it out: what is ${P} ÷ ${x}? Then check — the pair should add up to ${S}.`,
        decoyQuestions: [
          `What is ${P} × ${x}?`,
          `What is ${P} + ${x}?`,
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
