import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";

// `on`/`onto` for flat surfaces (plates, shelves), `in`/`into` for containers.
const SKINS = [
  { container: "bags", containerOne: "bag", item: "marbles", on: "in", onto: "into" },
  { container: "boxes", containerOne: "box", item: "crayons", on: "in", onto: "into" },
  { container: "plates", containerOne: "plate", item: "cookies", on: "on", onto: "onto" },
  { container: "vases", containerOne: "vase", item: "flowers", on: "in", onto: "into" },
  { container: "shelves", containerOne: "shelf", item: "books", on: "on", onto: "onto" },
];

export const equalGroups: Framework = {
  id: "equal-groups",
  title: "Equal Groups & Arrays",
  emoji: "🍪",
  family: "Counting & Grouping",
  blurb: "Equal groups make a row-and-column array — multiply or share to find the missing number.",
  source: "added",
  invariant: (d) => d.groups * d.each === d.total,
  generate(rng: Rng): Problem {
    const s = rng.pick(SKINS);
    const groups = rng.int(2, 6);
    let each = rng.int(2, 9);
    // 2 groups of 2 is the one case where groups+each === groups×each, which
    // would make the "What is 2 + 2?" decoy compute the right answer. Skip it.
    if (groups === 2 && each === 2) each = 3;
    const total = groups * each;
    const variant = rng.pick(["total", "each"]);

    if (variant === "total") {
      const steps: Step[] = [
        {
          id: "groups",
          input: "number",
          ask: `How many ${s.container} are there?`,
          answer: groups,
          hint: `Look at the first sentence — it tells you the number of ${s.container}.`,
          decoyQuestions: [
            `How many ${s.item} in all?`,
            `What is ${groups} + ${each}?`,
          ],
        },
        {
          id: "each",
          input: "number",
          ask: `How many ${s.item} ${s.on} each ${s.containerOne}?`,
          answer: each,
          hint: `Every ${s.containerOne} holds the same amount — the problem says how many.`,
          decoyQuestions: [
            `How many ${s.container} are there?`,
            `What is ${groups} + ${each}?`,
          ],
        },
        {
          id: "total",
          input: "number",
          ask: `Groups × each: ${groups} × ${each}`,
          answer: total,
          hint: `${groups} equal groups of ${each}: ${groups} × ${each}.`,
          decoyQuestions: [
            `What is ${groups} + ${each}?`,
            `How many ${s.item} are ${s.on} one ${s.containerOne}?`,
          ],
        },
      ];

      return {
        promptText: `There are ${groups} ${s.container} with ${each} ${s.item} ${s.on} each. How many ${s.item} in all?`,
        figure: { kind: "dotArray", rows: groups, cols: each },
        steps,
        finalAsk: `How many ${s.item} in all?`,
        finalAnswers: [{ label: "in all", value: total }],
        data: { groups, each, total },
      };
    }

    // variant === "each" — sharing/division. No dot-array figure here: a full
    // array would let her read the answer straight off one row.
    const steps: Step[] = [
      {
        id: "total",
        input: "number",
        ask: `How many ${s.item} in all?`,
        answer: total,
        hint: `It's the number being shared out — the first number in the story.`,
        decoyQuestions: [
          `How many ${s.container} to share ${s.onto}?`,
          `What is ${total} + ${groups}?`,
        ],
      },
      {
        id: "groups",
        input: "number",
        ask: `How many ${s.container} to share ${s.onto}?`,
        answer: groups,
        hint: `The story says how many ${s.container} the ${s.item} are split between.`,
        decoyQuestions: [
          `How many ${s.item} in all?`,
          `What is ${total} + ${groups}?`,
        ],
      },
      {
        id: "each",
        input: "number",
        ask: `Total ÷ groups: ${total} ÷ ${groups}`,
        answer: each,
        hint: `Share ${total} into ${groups} equal groups: ${total} ÷ ${groups}.`,
        decoyQuestions: [
          `What is ${total} × ${groups}?`,
          `How many ${s.item} in all?`,
        ],
      },
    ];

    return {
      promptText: `${total} ${s.item} are shared equally ${s.onto} ${groups} ${s.container}. How many ${s.item} ${s.on} each ${s.containerOne}?`,
      steps,
      finalAsk: `How many ${s.item} ${s.on} each ${s.containerOne}?`,
      finalAnswers: [{ label: "in each", value: each }],
      data: { groups, each, total },
    };
  },
};
