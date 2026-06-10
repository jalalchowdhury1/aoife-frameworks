import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";

const SKINS = [
  { moverS: "bee", moverP: "bees", spotS: "flower", spotP: "flowers" },
  { moverS: "child", moverP: "children", spotS: "chair", spotP: "chairs" },
  { moverS: "dog", moverP: "dogs", spotS: "bone", spotP: "bones" },
  { moverS: "bird", moverP: "birds", spotS: "nest", spotP: "nests" },
];

const count = (n: number, s: string, p: string) =>
  n === 1 ? `1 ${s} is` : `${n} ${p} are`;

export const twoClue: Framework = {
  id: "two-clue",
  title: "Two-Clue Puzzles",
  emoji: "🐝",
  family: "Reasoning to a Hidden Number",
  blurb:
    "Two clues hide one pair of numbers — turn each clue into a relationship, then find them.",
  source: "photo",
  invariant: (d) => d.bees === d.flowers + d.a && d.bees === 2 * (d.flowers - d.b),
  generate(rng: Rng): Problem {
    const s = rng.pick(SKINS);
    const a = rng.int(1, 2);
    const b = rng.int(1, 2);
    const flowers = a + 2 * b;
    const bees = flowers + a;

    const steps: Step[] = [
      {
        id: "clue1",
        input: "choice",
        ask: "Turn clue 1 into a relationship:",
        choices: [
          { label: `${s.moverP} = ${s.spotP} + ${a}`, value: "r1" },
          { label: `${s.moverP} = ${s.spotP} − ${a}`, value: "wrong1" },
        ],
        answer: "r1",
        hint: `If ${count(a, s.moverS, s.moverP)} left over with no ${s.spotS}, there are more ${s.moverP} than ${s.spotP}.`,
        decoyQuestions: [`How many ${s.spotP} are empty?`, `What is ${a} + ${b}?`],
      },
      {
        id: "clue2",
        input: "choice",
        ask: "Turn clue 2 into a relationship:",
        choices: [
          { label: `${s.moverP} = 2 × (${s.spotP} − ${b})`, value: "r2" },
          { label: `${s.moverP} = 2 × ${s.spotP}`, value: "wrong2" },
        ],
        answer: "r2",
        hint: `${count(b, s.spotS, s.spotP)} empty, so the other ${s.spotP} hold 2 ${s.moverP} each.`,
        decoyQuestions: [`How many ${s.moverP} are left over?`, `What is ${b} × 2?`],
      },
      {
        id: "spots",
        input: "number",
        ask: `Find the number of ${s.spotP} that fits BOTH clues: ${a} + 2 × ${b}`,
        answer: flowers,
        hint: `Add ${a} to two groups of ${b}: ${a} + ${2 * b}.`,
        decoyQuestions: [`How many ${s.moverP} are there?`, `What is ${a} × ${b}?`],
      },
      {
        id: "movers",
        input: "number",
        ask: `Then ${s.moverP} = ${s.spotP} + ${a}: ${flowers} + ${a}`,
        answer: bees,
        hint: `There are ${a} more ${s.moverP} than ${s.spotP}: ${flowers} + ${a}.`,
        decoyQuestions: [`What is ${flowers} − ${a}?`, `How many ${s.spotP} are empty?`],
      },
    ];

    return {
      promptText: `If every ${s.moverS} lands on its own ${s.spotS}, ${count(a, s.moverS, s.moverP)} left with none. If the ${s.moverP} share — 2 on each ${s.spotS} — ${count(b, s.spotS, s.spotP)} left empty. How many ${s.spotP} and ${s.moverP} are there?`,
      steps,
      finalAsk: `How many ${s.spotP}? How many ${s.moverP}?`,
      finalAnswers: [
        { label: s.spotP, value: flowers },
        { label: s.moverP, value: bees },
      ],
      data: { a, b, flowers, bees },
    };
  },
};
