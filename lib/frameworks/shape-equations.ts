import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";

const D = "🔶";
const C = "🟣";
const ST = "⭐";

const SKINS = [
  "Each shape stands for a secret number.",
  "Every shape hides a number.",
  "These shapes are each worth a number.",
];

export const shapeEquations: Framework = {
  id: "shape-equations",
  title: "Shape Equations",
  emoji: "🔷",
  family: "Reasoning to a Hidden Number",
  blurb: "Each shape stands for a number — solve the simple equation first, then chain the clues to the star.",
  source: "photo",
  invariant: (data) => data.d > 0 && data.c > 0 && data.st > 0,
  generate(rng: Rng): Problem {
    const skin = rng.pick(SKINS);
    const d = rng.int(3, 9);
    const c = rng.int(2, 9);
    const st = rng.int(2, 9);

    const eq1 = `${D} + ${D} = ${2 * d}`;
    const eq2 = `${D} + ${C} = ${d + c}`;
    const eq3 = `${C} + ${ST} = ${c + st}`;

    const steps: Step[] = [
      {
        id: "pick-eq",
        input: "choice",
        ask: "Which equation has only ONE kind of shape? Solve that one first.",
        choices: [
          { label: eq1, value: "eq1" },
          { label: eq2, value: "eq2" },
          { label: eq3, value: "eq3" },
        ],
        answer: "eq1",
        hint: `Look for the equation that uses the SAME shape twice — that's ${eq1}.`,
        decoyQuestions: [
          "Add all the numbers together?",
          `What is ${ST} right away?`,
        ],
      },
      {
        id: "solve-d",
        input: "number",
        ask: `Solve it: ${D} = ${2 * d} ÷ 2`,
        answer: d,
        hint: `Two ${D} make ${2 * d}, so one ${D} is half of that.`,
        decoyQuestions: [
          `What is ${2 * d} × 2?`,
          `What is ${C} + ${ST}?`,
        ],
      },
      {
        id: "solve-c",
        input: "number",
        ask: `Put ${D} into the next equation. ${C} = ${d + c} − ${d}`,
        answer: c,
        hint: `You know ${D} = ${d}. Take it away from ${d + c}.`,
        decoyQuestions: [
          `What is ${d + c} + ${d}?`,
          `What is ${ST} now?`,
        ],
      },
      {
        id: "solve-st",
        input: "number",
        ask: `Put ${C} into the last equation. ${ST} = ${c + st} − ${c}`,
        answer: st,
        hint: `You know ${C} = ${c}. Take it away from ${c + st}.`,
        decoyQuestions: [
          `What is ${c + st} + ${c}?`,
          `What is ${D} + ${C}?`,
        ],
      },
    ];

    return {
      promptText: `${skin} ${eq1}.  ${eq2}.  ${eq3}.  What is ${ST}?`,
      figure: { kind: "shapes", equations: [eq1, eq2, eq3] },
      steps,
      finalAsk: `What is ${ST}?`,
      finalAnswers: [{ label: ST, value: st }],
      data: { d, c, st },
    };
  },
};
