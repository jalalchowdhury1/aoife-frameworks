import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";

const POOL = [2, 3, 4, 5, 6, 8] as const;

const SKINS = [
  {
    intro: "Aoife wrote these number cards on the table",
    thing: "number cards",
  },
  {
    intro: "These number balloons are floating in the room",
    thing: "balloons",
  },
  {
    intro: "Aoife found these number stickers in her book",
    thing: "stickers",
  },
  {
    intro: "These magnet numbers are stuck on the fridge",
    thing: "magnets",
  },
];

export const howManyDifferent: Framework = {
  id: "how-many-different",
  title: "How Many Different…",
  emoji: "🔢",
  family: "Counting & Grouping",
  blurb:
    "Pick any two of four numbers and multiply — then count how many DIFFERENT answers you can make.",
  source: "photo",
  invariant: (d) => d.pairs === 6 && d.distinct >= 1 && d.distinct <= 6,
  generate(rng: Rng): Problem {
    const s = rng.pick(SKINS);
    const nums = rng.shuffle(POOL).slice(0, 4);

    // All unordered distinct pairs (i < j) -> exactly 6 pairs.
    const products: number[] = [];
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        products.push(nums[i] * nums[j]);
      }
    }
    const pairs = products.length; // always 6 for 4 numbers
    const distinct = new Set(products).size; // 1..6

    const numList = nums.join(", ");

    const steps: Step[] = [
      {
        id: "pairs",
        input: "number",
        ask: "How many pairs can you make from 4 numbers (choosing 2)?",
        answer: pairs,
        hint: "Pick the first number, then each of the other 3 — count carefully without repeating a pair: it comes to 6.",
        decoyQuestions: [
          `What is ${nums[0]} + ${nums[1]}?`,
          "How many DIFFERENT products are left at the end?",
        ],
      },
      {
        id: "products",
        input: "number",
        ask: "Multiply each pair — how many products did you write down?",
        answer: pairs,
        hint: "One product for every pair, so this is the same as the number of pairs you just found.",
        decoyQuestions: [
          `What is ${nums[0]} × ${nums[1]} × ${nums[2]}?`,
          "How many of the products are duplicates?",
        ],
      },
      {
        id: "distinct",
        input: "number",
        ask: "Cross out the duplicates. How many DIFFERENT products are left?",
        answer: distinct,
        hint: "Look down your list of 6 products. Each time you see a number that already appeared, cross it out — then count what is left.",
        decoyQuestions: [
          "How many pairs did you start with?",
          `What is ${nums[2]} + ${nums[3]}?`,
        ],
      },
    ];

    return {
      promptText: `${s.intro}: ${numList}. How many DIFFERENT products can you make by multiplying any two of these ${s.thing}?`,
      steps,
      finalAsk: "How many different products?",
      finalAnswers: [{ label: "different products", value: distinct }],
      data: { pairs, distinct },
    };
  },
};
