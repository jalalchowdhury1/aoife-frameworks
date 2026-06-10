import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";

const SKINS = [
  { wholeNoun: "flowers", partAlabel: "red", partBlabel: "not red" },
  { wholeNoun: "children", partAlabel: "boys", partBlabel: "girls" },
  { wholeNoun: "fruit", partAlabel: "apples", partBlabel: "not apples" },
];

export const partPartWhole: Framework = {
  id: "part-part-whole",
  title: "Part · Part · Whole",
  emoji: "🧩",
  family: "Comparing & Parts",
  blurb:
    "A whole splits into two parts. You know the whole and one part — find the missing part.",
  source: "added",
  invariant: (d) => d.partA + d.partB === d.whole,
  generate(rng: Rng): Problem {
    const s = rng.pick(SKINS);
    const whole = rng.int(10, 30);
    const partA = rng.int(2, whole - 2);
    const partB = whole - partA;

    const steps: Step[] = [
      {
        id: "whole",
        input: "number",
        ask: "What is the WHOLE (the total)?",
        answer: whole,
        hint: `The whole is the "in all" number — every ${s.wholeNoun} together.`,
        decoyQuestions: [
          `How many ${s.partBlabel}?`,
          `What is ${partA} + ${whole}?`,
        ],
      },
      {
        id: "known",
        input: "number",
        ask: `What part do you already know? (the ${s.partAlabel})`,
        answer: partA,
        hint: `It's the number the problem already tells you — how many are ${s.partAlabel}.`,
        decoyQuestions: [
          `What is the WHOLE (the total)?`,
          `How many ${s.partBlabel}?`,
        ],
      },
      {
        id: "missing",
        input: "number",
        ask: `Missing part = whole − known: ${whole} − ${partA}`,
        answer: partB,
        hint: `Take the known part away from the whole: ${whole} − ${partA}.`,
        decoyQuestions: [
          `What is ${whole} + ${partA}?`,
          `What part do you already know?`,
        ],
      },
    ];

    return {
      promptText: `There are ${whole} ${s.wholeNoun}. ${partA} are ${s.partAlabel}. The rest are ${s.partBlabel}. How many are ${s.partBlabel}?`,
      figure: {
        kind: "bars",
        bars: [
          { label: "whole", value: whole, known: true },
          { label: s.partAlabel, value: partA, known: true },
          { label: s.partBlabel, value: partB, known: false },
        ],
      },
      steps,
      finalAsk: `How many ${s.partBlabel}?`,
      finalAnswers: [{ label: s.partBlabel, value: partB }],
      data: { whole, partA, partB },
    };
  },
};
