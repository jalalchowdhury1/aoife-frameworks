import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";

const SKINS = [
  { thing: "stepping stones", actor: "a frog" },
  { thing: "train cars", actor: "the engine" },
  { thing: "garden beads", actor: "a bee" },
  { thing: "magic lily pads", actor: "a frog" },
];

export const numberBonds: Framework = {
  id: "number-bonds",
  title: "Number Bonds / Chains",
  emoji: "⭕",
  family: "Patterns & Structure",
  blurb:
    "A chain of circles with squares between them — each square is the sum of its two circles. Find the missing numbers.",
  source: "photo",
  invariant: (d) => d.s1 === d.c1 + d.c2 && d.s2 === d.c2 + d.c3,
  generate(rng: Rng): Problem {
    const s = rng.pick(SKINS);
    const c1 = rng.int(20, 90);
    const c2 = rng.int(20, 90);
    const c3 = rng.int(20, 90);
    const s1 = c1 + c2;
    const s2 = c2 + c3;

    const steps: Step[] = [
      {
        id: "rule",
        input: "choice",
        ask: "What does each square equal?",
        choices: [
          { label: "the sum of the two circles next to it", value: "sum" },
          { label: "the bigger circle next to it", value: "max" },
          { label: "the two circles multiplied", value: "times" },
        ],
        answer: "sum",
        hint: `Read the rule at the top — a square ADDS its two circle neighbours.`,
        decoyQuestions: [
          `What is ${c1} × ${c2}?`,
          `What is the missing circle?`,
        ],
      },
      {
        id: "s1",
        input: "number",
        ask: `The first square = its two circles: ${c1} + ${c2}`,
        answer: s1,
        hint: `Add the two known circles: ${c1} + ${c2}.`,
        decoyQuestions: [
          `What is ${c1} − ${c2}?`,
          `What is the missing circle?`,
        ],
      },
      {
        id: "c3",
        input: "number",
        ask: `The second square is ${s2}, and one circle is ${c2}. Missing circle = ${s2} − ${c2}`,
        answer: c3,
        hint: `A square minus one of its circles gives the other circle: ${s2} − ${c2}.`,
        decoyQuestions: [
          `What is ${s2} + ${c2}?`,
          `What is the first square?`,
        ],
      },
    ];

    return {
      promptText: `Follow ${s.actor} along the ${s.thing}. Each square is the sum of the two circles next to it. Find the missing numbers.`,
      figure: {
        kind: "numberBond",
        circles: [c1, c2, null],
        squares: [null, s2],
      },
      steps,
      finalAsk: `The missing square? The missing circle?`,
      finalAnswers: [
        { label: "square", value: s1 },
        { label: "circle", value: c3 },
      ],
      data: { c1, c2, c3, s1, s2 },
    };
  },
};
