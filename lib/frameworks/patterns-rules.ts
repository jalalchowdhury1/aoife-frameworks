import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";

const SKINS = [
  { who: "the robot", verb: "counts out" },
  { who: "Lily", verb: "stacks" },
  { who: "the frog", verb: "hops to" },
  { who: "the train", verb: "stops at" },
];

export const patternsRules: Framework = {
  id: "patterns-rules",
  title: "Patterns & Rules",
  emoji: "🔁",
  family: "Patterns & Structure",
  blurb:
    "A line of numbers follows a secret rule — find the rule, then say what comes next.",
  source: "added",
  invariant: (d) => (d.isMul === 1 ? d.t4 === d.t3 * 2 : d.t4 === d.t3 + d.step),
  generate(rng: Rng): Problem {
    const s = rng.pick(SKINS);
    const variant = rng.pick(["add", "mul"]);
    const isMul = variant === "mul";

    let t0: number;
    let t1: number;
    let t2: number;
    let t3: number;
    let t4: number;
    let step: number; // add-step, or 0 for mul

    if (isMul) {
      const start = rng.int(1, 3);
      t0 = start;
      t1 = start * 2;
      t2 = start * 4;
      t3 = start * 8;
      t4 = start * 16;
      step = 0;
    } else {
      const start = rng.int(2, 9);
      step = rng.int(2, 6);
      t0 = start;
      t1 = start + step;
      t2 = start + 2 * step;
      t3 = start + 3 * step;
      t4 = start + 4 * step;
    }

    const shown = `${t0}, ${t1}, ${t2}, ${t3}, ___`;

    // The additive decoy must be a TEMPTING wrong rule. For a doubling pattern
    // the tempting mistake is "add the first gap" (e.g. 2,4,8,16 looks like +2),
    // never "add 0".
    const addStep = isMul ? t1 - t0 : step;
    const ruleChoices = [
      { label: `Add ${addStep} each time`, value: "add" },
      { label: "Multiply by 2 each time", value: "mul" },
    ];

    const steps: Step[] = [
      {
        id: "rule",
        input: "choice",
        ask: "What changes from one number to the next?",
        choices: ruleChoices,
        answer: variant,
        hint: isMul
          ? `Look at ${t0} then ${t1}, then ${t1} then ${t2}. Each number is double the one before.`
          : `Look at ${t0} then ${t1}. How much bigger? Check ${t1} to ${t2} too — it's the same jump.`,
        decoyQuestions: [
          `What is ${t3} − ${t0}?`,
          `What number comes after ${t4}?`,
        ],
      },
      {
        id: "next",
        input: "number",
        ask: `Use the rule on the last number shown (${t3}) to get the next one.`,
        answer: t4,
        hint: isMul
          ? `Double ${t3}: ${t3} × 2.`
          : `Add ${step} to ${t3}: ${t3} + ${step}.`,
        decoyQuestions: [
          `What is ${t3} − ${t0}?`,
          isMul ? `What is ${t3} + ${addStep}?` : `What is ${t3} × ${step}?`,
        ],
      },
    ];

    return {
      promptText: `What number comes next in the pattern?  ${s.who} ${s.verb}: ${shown}`,
      figure: { kind: "sequence", terms: [t0, t1, t2, t3, null] },
      steps,
      finalAsk: "What comes next?",
      finalAnswers: [{ label: "next", value: t4 }],
      data: { t3, t4, isMul: isMul ? 1 : 0, step },
    };
  },
};
