import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";

// knownPhrase is how we refer to the known part mid-sentence.
const SKINS = [
  { wholeNoun: "flowers", partAlabel: "red", partBlabel: "not red", knownPhrase: "the red ones" },
  { wholeNoun: "children", partAlabel: "boys", partBlabel: "girls", knownPhrase: "the boys" },
  { wholeNoun: "fruit", partAlabel: "apples", partBlabel: "not apples", knownPhrase: "the apples" },
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
    let partA = rng.int(2, whole - 2);
    // Keep the two parts different — if they're equal, a child who mixes up
    // "known part" and "missing part" would still look correct.
    if (partA * 2 === whole) partA += 1;
    const partB = whole - partA;

    const steps: Step[] = [
      {
        id: "whole",
        input: "number",
        ask: "What is the WHOLE (the total)?",
        answer: whole,
        hint: `The whole is the "There are…" number — all the ${s.wholeNoun} together.`,
        decoyQuestions: [
          `How many are ${s.partBlabel}?`,
          `What is ${partA} + ${whole}?`,
        ],
      },
      {
        id: "known",
        input: "number",
        ask: `What part do you already know? (${s.knownPhrase})`,
        answer: partA,
        hint: `It's the part the problem already counts for you — how many are ${s.partAlabel}.`,
        decoyQuestions: [
          `What is the WHOLE (the total)?`,
          `How many are ${s.partBlabel}?`,
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
      finalAsk: `How many are ${s.partBlabel}?`,
      finalAnswers: [{ label: s.partBlabel, value: partB }],
      data: { whole, partA, partB },
    };
  },
};
