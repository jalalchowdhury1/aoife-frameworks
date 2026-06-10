import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";

export const crossNumberGrid: Framework = {
  id: "cross-number-grid",
  title: "Cross-Number Grid",
  emoji: "✖️",
  family: "Reasoning to a Hidden Number",
  blurb:
    "A 3-by-3 addition cross with two blank boxes — fill them so every row and column adds up.",
  source: "photo",
  invariant: (d) =>
    d.c === d.a + d.b &&
    d.f === d.d + d.e &&
    d.g === d.a + d.d &&
    d.h === d.b + d.e &&
    d.i === d.c + d.f,
  generate(rng: Rng): Problem {
    const a = rng.int(1, 9);
    const b = rng.int(1, 9);
    const dd = rng.int(1, 9);
    const e = rng.int(1, 9);
    const c = a + b;
    const f = dd + e;
    const g = a + dd;
    const h = b + e;
    const i = c + f;

    const steps: Step[] = [
      {
        id: "pick-line",
        input: "choice",
        ask: "Find a row or column with only ONE empty box. Which one is easiest to solve first?",
        choices: [
          { label: `The top row (${a} + ${b} = ?)`, value: "toprow" },
          { label: "The middle column", value: "midcol" },
        ],
        answer: "toprow",
        hint: "Look for a line where two numbers are already shown and only the answer box is blank.",
        decoyQuestions: [
          `What is ${a} + ${b} + ${dd}?`,
          `What number goes in the very bottom-right box (${i})?`,
        ],
      },
      {
        id: "toprow",
        input: "number",
        ask: `Solve the top row: ${a} + ${b}`,
        answer: c,
        hint: `Add the two top numbers together: ${a} + ${b}.`,
        decoyQuestions: [
          `What is ${a} + ${dd}?`,
          `What is ${a} + ${b} + ${dd} + ${e}?`,
        ],
      },
      {
        id: "leftcol",
        input: "number",
        ask: `Now the LEFT column has one empty box: ${a} + ${dd}`,
        answer: g,
        hint: `Add the top-left and middle-left numbers: ${a} + ${dd}.`,
        decoyQuestions: [
          `What is ${a} + ${b}?`,
          `What is ${a} − ${dd}?`,
        ],
      },
    ];

    const figure = {
      kind: "grid",
      cells: [
        [a, "+", b, "=", null],
        ["+", "", "+", "", "+"],
        [dd, "+", e, "=", f],
        ["=", "", "=", "", "="],
        [null, "+", h, "=", i],
      ],
    };

    return {
      promptText:
        "Fill the grid so every row and column adds up correctly. (Every + and = must be true.)",
      figure,
      steps,
      finalAsk: "Top-right box? Bottom-left box?",
      finalAnswers: [
        { label: "top-right", value: c },
        { label: "bottom-left", value: g },
      ],
      data: { a, b, c, d: dd, e, f, g, h, i },
    };
  },
};
