import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";

const SKINS = [
  { container: "bags", containerOne: "bag", item: "marbles" },
  { container: "boxes", containerOne: "box", item: "crayons" },
  { container: "plates", containerOne: "plate", item: "cookies" },
  { container: "vases", containerOne: "vase", item: "flowers" },
  { container: "shelves", containerOne: "shelf", item: "books" },
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
    const each = rng.int(2, 9);
    const total = groups * each;
    const variant = rng.pick(["total", "each"]);

    const figure = { kind: "dotArray", rows: groups, cols: each };

    if (variant === "total") {
      const steps: Step[] = [
        {
          id: "groups",
          input: "number",
          ask: `How many ${s.container} are there?`,
          answer: groups,
          hint: `Count the ${s.container} in the problem: ${groups}.`,
          decoyQuestions: [
            `How many ${s.item} in all?`,
            `What is ${groups} + ${each}?`,
          ],
        },
        {
          id: "each",
          input: "number",
          ask: `How many ${s.item} in each ${s.containerOne}?`,
          answer: each,
          hint: `Every ${s.containerOne} holds the same amount: ${each}.`,
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
            `How many ${s.item} are in one ${s.containerOne}?`,
          ],
        },
      ];

      return {
        promptText: `There are ${groups} ${s.container} with ${each} ${s.item} in each. How many ${s.item} in all?`,
        figure,
        steps,
        finalAsk: `How many ${s.item} in all?`,
        finalAnswers: [{ label: "in all", value: total }],
        data: { groups, each, total },
      };
    }

    // variant === "each"
    const steps: Step[] = [
      {
        id: "total",
        input: "number",
        ask: `How many ${s.item} in all?`,
        answer: total,
        hint: `It's the "shared equally" number: ${total}.`,
        decoyQuestions: [
          `How many ${s.container} to share into?`,
          `What is ${total} + ${groups}?`,
        ],
      },
      {
        id: "groups",
        input: "number",
        ask: `How many ${s.container} to share into?`,
        answer: groups,
        hint: `Count the ${s.container} you split them between: ${groups}.`,
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
      promptText: `${total} ${s.item} are shared equally into ${groups} ${s.container}. How many ${s.item} in each?`,
      figure,
      steps,
      finalAsk: `How many ${s.item} in each ${s.containerOne}?`,
      finalAnswers: [{ label: "in each", value: each }],
      data: { groups, each, total },
    };
  },
};
