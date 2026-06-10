import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";

const SKINS = [
  { thing: "stakes", unit: "inches" },
  { thing: "trees", unit: "feet" },
  { thing: "fence posts", unit: "feet" },
  { thing: "lamp posts", unit: "meters" },
  { thing: "flags", unit: "feet" },
];

export const fenceposts: Framework = {
  id: "fenceposts",
  title: "Fenceposts & Spacing",
  emoji: "📏",
  family: "Counting & Grouping",
  blurb: "Things in a line at both ends — count the gaps, then add one for the posts.",
  source: "photo",
  invariant: (d) => d.D === d.s * d.gaps && d.posts === d.gaps + 1,
  generate(rng: Rng): Problem {
    const skin = rng.pick(SKINS);
    const things = skin.thing;
    const unit = skin.unit;
    const s = rng.int(2, 5);
    const gaps = rng.int(3, 9);
    const D = s * gaps;
    const posts = gaps + 1;

    const steps: Step[] = [
      {
        id: "ends",
        input: "choice",
        ask: `Are there ${things} at BOTH ends, or only in the gaps?`,
        choices: [
          { label: "At both ends", value: "both" },
          { label: "Only in the gaps", value: "gaps" },
        ],
        answer: "both",
        hint: `The first one and the last one are both ${things} — so they sit at both ends.`,
        decoyQuestions: [
          `How far apart are the ${things}?`,
          `What is ${D} × ${s}?`,
        ],
      },
      {
        id: "gaps",
        input: "number",
        ask: `How many GAPS fit between them? (${D} ÷ ${s})`,
        answer: gaps,
        hint: `Split the whole ${D} ${unit} into jumps of ${s}: ${D} ÷ ${s}.`,
        decoyQuestions: [
          `How many ${things} are there?`,
          `What is ${D} × ${s}?`,
        ],
      },
      {
        id: "posts",
        input: "number",
        ask: `Posts = gaps + 1. So how many ${things}? (${gaps} + 1)`,
        answer: posts,
        hint: `There's always one more ${things} than gaps: ${gaps} + 1.`,
        decoyQuestions: [
          `How many gaps are there?`,
          `What is ${D} × ${s}?`,
        ],
      },
    ];

    return {
      promptText: `Some ${things} are placed in a straight line, ${s} ${unit} apart. From the FIRST to the LAST is ${D} ${unit}. How many ${things} are there?`,
      figure: { kind: "postRow", posts, spacing: s, unit },
      steps,
      finalAsk: `How many ${things}?`,
      finalAnswers: [{ label: things, value: posts }],
      data: { s, gaps, D, posts },
    };
  },
};
