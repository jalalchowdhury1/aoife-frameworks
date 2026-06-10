import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";

const SKINS = ["ribbon", "rope", "string", "paper strip"];

export const measureUnits: Framework = {
  id: "measure-units",
  title: "Measure & Units",
  emoji: "📐",
  family: "Multi-Step & Real-World",
  blurb:
    "Two lengths in different units — change to the same unit, then compare.",
  source: "added",
  invariant: (d) => Math.abs(d.aIn - d.bIn) === d.diff && d.diff >= 1,
  generate(rng: Rng): Problem {
    const item = rng.pick(SKINS);
    const aFt = rng.int(2, 5);
    const aIn = aFt * 12;
    let off = rng.int(-10, 10);
    if (off === 0) off = 4;
    let bIn = aIn + off;
    if (bIn < 1) bIn = aIn + 4;
    const diff = Math.abs(aIn - bIn);
    const aLonger = aIn > bIn;

    const steps: Step[] = [
      {
        id: "sameUnit",
        input: "choice",
        ask: "Are both lengths in the SAME unit?",
        choices: [
          { label: "No — one is feet, one is inches", value: "no" },
          { label: "Yes", value: "yes" },
        ],
        answer: "no",
        hint: `One ${item} is in FEET, the other is in INCHES. Those are different units.`,
        decoyQuestions: [
          `What is ${aFt} + ${bIn}?`,
          `How many inches longer is it?`,
        ],
      },
      {
        id: "feetToInches",
        input: "number",
        ask: `Change feet to inches: ${aFt} × 12`,
        answer: aIn,
        hint: `Every foot is 12 inches, so multiply: ${aFt} × 12.`,
        decoyQuestions: [
          `What is ${aFt} + 12?`,
          `Which ${item} is longer?`,
        ],
      },
      {
        id: "whichLonger",
        input: "choice",
        ask: "Which is longer?",
        choices: [
          { label: `The ${aFt}-foot one (${aIn} in)`, value: "a" },
          { label: `The ${bIn}-inch one`, value: "b" },
        ],
        answer: aLonger ? "a" : "b",
        hint: `Now both are in inches: compare ${aIn} and ${bIn}. The bigger number is longer.`,
        decoyQuestions: [
          `What is ${aIn} + ${bIn}?`,
          `Are both lengths in the same unit?`,
        ],
      },
      {
        id: "howMuchLonger",
        input: "number",
        ask: "How much longer? (bigger − smaller)",
        answer: diff,
        hint: `Take the bigger inches and subtract the smaller: ${Math.max(aIn, bIn)} − ${Math.min(aIn, bIn)}.`,
        decoyQuestions: [
          `What is ${aIn} + ${bIn}?`,
          `Which ${item} is longer?`,
        ],
      },
    ];

    return {
      promptText: `One ${item} is ${aFt} feet long. Another ${item} is ${bIn} inches long. Which is longer, and by how many inches?`,
      steps,
      finalAsk: "How many inches longer?",
      finalAnswers: [{ label: "inches longer", value: diff }],
      data: { aIn, bIn, diff },
    };
  },
};
