import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";
import { greedy, greedySteps } from "../money";

const ITEMS = ["snack", "sticker pack", "pencil", "juice box", "eraser", "balloon"];
const NAMES = ["Aoife", "Bron", "Santino", "Mayam", "Natalia"];
const SINGLE = new Set([1, 5, 10, 25]);

// The Q6 capstone: pay with $1, find the change, then make that change with the
// FEWEST coins (= the least coins you could get back).
export const makingChange: Framework = {
  id: "making-change",
  title: "Making Change",
  emoji: "🛒",
  family: "Money & Coins",
  blurb:
    "Pay with $1, work out the change, then count the FEWEST coins that change could be.",
  source: "photo",
  invariant: (d) =>
    d.change === 100 - d.cost &&
    d.q * 25 + d.d * 10 + d.n * 5 + d.p === d.change &&
    d.q + d.d + d.n + d.p === d.total,
  generate(rng: Rng): Problem {
    let change = rng.int(6, 89);
    while (SINGLE.has(change)) change = rng.int(6, 89);
    const cost = 100 - change;
    const item = rng.pick(ITEMS);
    const name = rng.pick(NAMES);
    const g = greedy(change);
    const greedyPart = greedySteps(change);

    const changeStep: Step = {
      id: "change",
      input: "number",
      ask: `The ${item} costs ${cost}¢ and ${name} pays with $1 (that's 100¢). How much change? (100 − ${cost})`,
      answer: change,
      hint: `Take the cost away from the dollar: 100 − ${cost}.`,
      decoyQuestions: [
        "How many coins is the change?",
        `What does the ${item} cost?`,
      ],
    };

    const steps: Step[] = [changeStep, ...greedyPart.steps];

    return {
      promptText: `${name} buys a ${item} that costs ${cost}¢ and pays with $1. What is the LEAST number of coins ${name} could get as change?`,
      steps,
      finalAsk: "What is the fewest number of coins in the change?",
      finalAnswers: [{ label: "coins", value: greedyPart.total }],
      data: { cost, change, q: g.q, d: g.d, n: g.n, p: g.p, total: greedyPart.total },
    };
  },
};
