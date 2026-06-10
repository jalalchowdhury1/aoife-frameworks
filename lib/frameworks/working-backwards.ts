import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";

const SKINS = ["stickers", "coins", "candies", "cards"];

export const workingBackwards: Framework = {
  id: "working-backwards",
  title: "Working Backwards",
  emoji: "⏪",
  family: "Reasoning to a Hidden Number",
  blurb:
    "We know how the story ENDS — rewind each step backwards to find the hidden START.",
  source: "added",
  invariant: (d) => d.end === d.start - d.g + d.bMore,
  generate(rng: Rng): Problem {
    const item = rng.pick(SKINS);
    const g = rng.int(2, 8);
    const bMore = rng.int(2, 8);
    const start = rng.int(12, 25);
    const end = start - g + bMore; // start>=12>g so start-g>=0; end-bMore = start-g >= 0
    const afterUndoGot = end - bMore; // = start - g, non-negative integer

    const steps: Step[] = [
      {
        id: "end",
        input: "number",
        ask: "What is the amount at the END (now)?",
        answer: end,
        hint: `It's the number Aoife has RIGHT NOW — the "now she has…" number.`,
        decoyQuestions: [
          `How many ${item} did she start with?`,
          `How many ${item} did she give away?`,
        ],
      },
      {
        id: "undoGot",
        input: "number",
        ask: `What happened LAST? She GOT ${bMore} more — UNDO it (take them away): ${end} − ${bMore}`,
        answer: afterUndoGot,
        hint: `Rewind the last step. Getting more means we take those ${bMore} back away: ${end} − ${bMore}.`,
        decoyQuestions: [
          `How many ${item} does she have now?`,
          `How many ${item} did she give away first?`,
        ],
      },
      {
        id: "undoGave",
        input: "number",
        ask: `Before that she GAVE AWAY ${g} — UNDO it (add them back): ${afterUndoGot} + ${g}`,
        answer: start,
        hint: `Rewind the giving step. Giving away means we put those ${g} back: ${afterUndoGot} + ${g}.`,
        decoyQuestions: [
          `How many ${item} does she have now?`,
          `How many ${item} did she get?`,
        ],
      },
    ];

    return {
      promptText: `Aoife had some ${item}. She gave away ${g}, then got ${bMore} more. Now she has ${end}. How many ${item} did she START with?`,
      steps,
      finalAsk: "How many did she start with?",
      finalAnswers: [{ label: "at the start", value: start }],
      data: { g, bMore, start, end },
    };
  },
};
