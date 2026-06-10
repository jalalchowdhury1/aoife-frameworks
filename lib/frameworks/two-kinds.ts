import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";

const SKINS = [
  { a: "ducks", b: "goats", la: 2, lb: 4, unit: "legs" },
  { a: "hens", b: "cows", la: 2, lb: 4, unit: "legs" },
  { a: "kids", b: "dogs", la: 2, lb: 4, unit: "legs" },
  { a: "bikes", b: "trikes", la: 2, lb: 3, unit: "wheels" },
];

export const twoKinds: Framework = {
  id: "two-kinds",
  title: "Two Kinds · Count & Legs",
  emoji: "🐐",
  family: "Reasoning to a Hidden Number",
  blurb: "Two kinds share a total and a total of legs/wheels — find how many of each.",
  source: "photo",
  invariant: (d) =>
    d.la * d.countA + d.lb * d.countB === d.attr && d.countA + d.countB === d.total,
  generate(rng: Rng): Problem {
    const s = rng.pick(SKINS);
    const total = rng.int(8, 14);
    const countB = rng.int(2, total - 2);
    const countA = total - countB;
    const attr = s.la * countA + s.lb * countB;
    const allA = s.la * total;
    const extra = attr - allA;
    const perSwap = s.lb - s.la;

    const steps: Step[] = [
      {
        id: "kinds",
        input: "choice",
        ask: "What two kinds of things are in this problem?",
        choices: [
          { label: `${s.a} & ${s.b}`, value: `${s.a} & ${s.b}` },
          { label: `${s.unit} & numbers`, value: "x1" },
          { label: `boxes & bags`, value: "x2" },
        ],
        answer: `${s.a} & ${s.b}`,
        hint: `Look at the very first sentence — the two things it names.`,
        decoyQuestions: [`What is ${total} + ${attr}?`, `How many ${s.b} are there?`],
      },
      {
        id: "total",
        input: "number",
        ask: `How many ${s.a} and ${s.b} are there ALTOGETHER?`,
        answer: total,
        hint: `It's the "in all" number near the start.`,
        decoyQuestions: [`How many ${s.unit} altogether?`, `How many ${s.b}?`],
      },
      {
        id: "legs",
        input: "number",
        ask: `How many ${s.unit} does ONE ${s.b} have?`,
        answer: s.lb,
        hint: `A ${s.b} has ${s.lb} ${s.unit}.`,
        decoyQuestions: [
          `How many ${s.unit} does one ${s.a} have?`,
          `What is ${total} − ${attr}?`,
        ],
      },
      {
        id: "allA",
        input: "number",
        ask: `Pretend ALL ${total} were ${s.a} (the ${s.la}-${s.unit} kind). How many ${s.unit} is that?`,
        answer: allA,
        hint: `${total} ${s.a}, each with ${s.la} ${s.unit}: ${total} × ${s.la}.`,
        decoyQuestions: [`What is ${total} + ${attr}?`, `How many ${s.b} are there?`],
      },
      {
        id: "extra",
        input: "number",
        ask: `But there are really ${attr} ${s.unit}. How many EXTRA ${s.unit}?`,
        answer: extra,
        hint: `Real ${s.unit} minus the pretend ${s.unit}: ${attr} − ${allA}.`,
        decoyQuestions: [`What is ${attr} + ${allA}?`, `How many ${s.a}?`],
      },
      {
        id: "perSwap",
        input: "number",
        ask: `Each time we swap one ${s.a} for one ${s.b}, how many MORE ${s.unit}?`,
        answer: perSwap,
        hint: `A ${s.b} has ${s.lb}, a ${s.a} has ${s.la}: ${s.lb} − ${s.la}.`,
        decoyQuestions: [`How many ${s.b} are there?`, `What is ${s.lb} + ${s.la}?`],
      },
      {
        id: "countB",
        input: "number",
        ask: `So how many ${s.b} are there? (extra ÷ ${perSwap})`,
        answer: countB,
        hint: `${extra} extra ${s.unit}, ${perSwap} per swap: ${extra} ÷ ${perSwap}.`,
        decoyQuestions: [`How many ${s.a}?`, `What is ${extra} × ${perSwap}?`],
      },
      {
        id: "countA",
        input: "number",
        ask: `And how many ${s.a}? (${total} − ${countB})`,
        answer: countA,
        hint: `The rest of the ${total}: ${total} − ${countB}.`,
        decoyQuestions: [`What is ${total} + ${countB}?`, `How many ${s.unit}?`],
      },
    ];

    return {
      promptText: `There are ${total} ${s.a} and ${s.b} in all. If there are ${attr} ${s.unit}, how many ${s.a} and how many ${s.b} are there?`,
      steps,
      finalAsk: `How many ${s.a}? How many ${s.b}?`,
      finalAnswers: [
        { label: s.a, value: countA },
        { label: s.b, value: countB },
      ],
      data: { total, attr, la: s.la, lb: s.lb, countA, countB },
    };
  },
};
