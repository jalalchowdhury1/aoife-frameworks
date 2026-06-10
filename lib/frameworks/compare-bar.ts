import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";

const SKINS = [
  { a: "Sam", b: "Mia", item: "marbles" },
  { a: "the red box", b: "the blue box", item: "beads" },
  { a: "Tom", b: "Ben", item: "cards" },
];

export const compareBar: Framework = {
  id: "compare-bar",
  title: "Compare-Bar",
  emoji: "📊",
  family: "Comparing & Parts",
  blurb:
    "One has a few more than the other, and you know the total — peel off the extra and split what's left.",
  source: "added",
  invariant: (d) =>
    d.bigger === d.smaller + d.m && d.bigger + d.smaller === d.total,
  generate(rng: Rng): Problem {
    const s = rng.pick(SKINS);
    const smaller = rng.int(3, 12);
    const m = rng.int(2, 8);
    const bigger = smaller + m;
    const total = bigger + smaller;
    const left = total - m; // always 2*smaller, so even and non-negative

    const steps: Step[] = [
      {
        id: "extra",
        input: "number",
        ask: `How many MORE ${s.item} does ${s.a} have than ${s.b}?`,
        answer: m,
        hint: `Read the first sentence — it tells you how many MORE.`,
        decoyQuestions: [
          `How many ${s.item} are there in all?`,
          `What is ${total} + ${m}?`,
        ],
      },
      {
        id: "peel",
        input: "number",
        ask: `Take the extra off the total: ${total} − ${m}`,
        answer: left,
        hint: `Start at ${total} and count back ${m}.`,
        decoyQuestions: [
          `What is ${total} + ${m}?`,
          `How many does ${s.a} have?`,
        ],
      },
      {
        id: "split",
        input: "number",
        ask: `That leaves two equal parts. Split it: (${left}) ÷ 2 = ${s.b}'s amount`,
        answer: smaller,
        hint: `Cut ${left} into two fair halves — what's one half?`,
        decoyQuestions: [
          `What is ${left} × 2?`,
          `How many does ${s.a} have?`,
        ],
      },
      {
        id: "bigger",
        input: "number",
        ask: `${s.a} = ${s.b} + extra: ${smaller} + ${m}`,
        answer: bigger,
        hint: `${s.a} has ${s.b}'s amount plus the ${m} extra.`,
        decoyQuestions: [
          `What is ${smaller} − ${m}?`,
          `How many ${s.item} are there in all?`,
        ],
      },
    ];

    return {
      promptText: `${s.a} has ${m} more ${s.item} than ${s.b}. Together they have ${total} ${s.item}. How many does each have?`,
      figure: {
        kind: "bars",
        bars: [
          { label: s.a, value: bigger, known: false },
          { label: s.b, value: smaller, known: false },
        ],
      },
      steps,
      finalAsk: `How many does ${s.a} have? How many does ${s.b} have?`,
      finalAnswers: [
        { label: s.a, value: bigger },
        { label: s.b, value: smaller },
      ],
      data: { m, total, smaller, bigger },
    };
  },
};
