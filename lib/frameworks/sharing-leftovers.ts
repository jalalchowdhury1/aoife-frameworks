import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";

const SKINS = [
  { item: "empanadas", one: "empanada", container: "box", containers: "boxes", who: "Mrs. Garcia" },
  { item: "cookies", one: "cookie", container: "plate", containers: "plates", who: "Mr. Patel" },
  { item: "stickers", one: "sticker", container: "page", containers: "pages", who: "Miss Ruiz" },
  { item: "marbles", one: "marble", container: "bag", containers: "bags", who: "Grandpa Joe" },
  { item: "pencils", one: "pencil", container: "cup", containers: "cups", who: "Aunt Mei" },
];

type Variant = "leftover" | "groups" | "roundup";

export const sharingLeftovers: Framework = {
  id: "sharing-leftovers",
  title: "Sharing with Leftovers",
  emoji: "📦",
  family: "Counting & Grouping",
  blurb:
    "Split a total equally into groups of a fixed size — figure out the leftovers, the full groups, or the groups needed for all.",
  source: "photo",
  invariant: (d) => d.q * d.g + d.r === d.N && d.r >= 1 && d.r < d.g,
  generate(rng: Rng): Problem {
    const s = rng.pick(SKINS);
    const g = rng.int(3, 6);
    const q = rng.int(2, 7);
    const r = rng.int(1, g - 1);
    const N = q * g + r;
    const variant: Variant = rng.pick(["leftover", "groups", "roundup"]);
    const whole = q * g; // biggest number that fills whole containers

    const finalQuestion =
      variant === "leftover"
        ? `How many ${s.item} are left over?`
        : variant === "groups"
          ? `How many FULL ${s.containers} does she fill?`
          : `How many ${s.containers} does she need to hold them ALL?`;

    const steps: Step[] = [
      {
        id: "perBox",
        input: "number",
        ask: `How many ${s.item} fit in each ${s.container}?`,
        answer: g,
        hint: `The problem says she puts ${g} in each ${s.container}.`,
        decoyQuestions: [
          `How many ${s.item} are there in all?`,
          `How many ${s.containers} does she need?`,
        ],
      },
      {
        id: "asking",
        input: "choice",
        ask: "What is this question really asking?",
        choices: [
          { label: "How many are LEFT OVER", value: "leftover" },
          { label: `How many FULL ${s.containers}`, value: "groups" },
          { label: `How many ${s.containers} to hold them ALL`, value: "roundup" },
        ],
        answer: variant,
        hint: `Read the very last line of the story again — that's the real question.`,
        decoyQuestions: [
          `What is ${N} + ${g}?`,
          `How many ${s.item} fit in each ${s.container}?`,
        ],
      },
      {
        id: "whole",
        input: "number",
        ask: `What is the biggest number of ${s.item} that fills whole ${s.containers}? (${q} × ${g})`,
        answer: whole,
        hint: `Count by ${g}s until you can't fit another full ${s.container}: ${q} × ${g}.`,
        decoyQuestions: [
          `What is ${q} + ${g}?`,
          `How many ${s.item} are left over?`,
        ],
      },
      {
        id: "fullCount",
        input: "number",
        ask: `How many full ${s.containers} is that?`,
        answer: q,
        hint: `${whole} ${s.item}, with ${g} in each ${s.container}: ${whole} ÷ ${g}.`,
        decoyQuestions: [
          `How many ${s.item} are left over?`,
          `What is ${whole} + ${g}?`,
        ],
      },
      {
        id: "leftover",
        input: "number",
        ask: `How many ${s.item} are left over? (${N} − ${whole})`,
        answer: r,
        hint: `Take the full-${s.container} ${s.item} away from all of them: ${N} − ${whole}.`,
        decoyQuestions: [
          `What is ${N} + ${whole}?`,
          `How many full ${s.containers} is that?`,
        ],
      },
    ];

    const finalAnswers =
      variant === "leftover"
        ? [{ label: "left over", value: r }]
        : variant === "groups"
          ? [{ label: `full ${s.containers}`, value: q }]
          : [{ label: `${s.containers} needed`, value: q + 1 }];

    return {
      promptText: `${s.who} has ${N} ${s.item}. She puts them equally into ${s.containers} with ${g} in each. ${finalQuestion}`,
      steps,
      finalAsk: finalQuestion,
      finalAnswers,
      data: { N, g, q, r },
    };
  },
};
