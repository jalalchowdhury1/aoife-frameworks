import type { Framework, Problem } from "../types";
import type { Rng } from "../rng";
import { greedy, greedySteps } from "../money";

const NAMES = ["Aoife", "Bron", "Santino", "Mayam", "Natalia"];
const SINGLE = new Set([1, 5, 10, 25]); // amounts a single coin already makes

// Make an amount with the FEWEST coins: take the biggest coin that fits, again
// and again. (US coins are canonical, so biggest-first really is fewest.)
export const fewestCoins: Framework = {
  id: "fewest-coins",
  title: "Fewest Coins",
  emoji: "🎯",
  family: "Money & Coins",
  blurb:
    "Make an amount with as FEW coins as possible — always take the biggest coin that fits.",
  source: "photo",
  invariant: (d) =>
    d.q * 25 + d.d * 10 + d.n * 5 + d.p === d.cents &&
    d.q + d.d + d.n + d.p === d.total,
  generate(rng: Rng): Problem {
    let cents = rng.int(6, 99);
    while (SINGLE.has(cents)) cents = rng.int(6, 99);
    const name = rng.pick(NAMES);
    const g = greedy(cents);
    const { steps, total } = greedySteps(cents);

    return {
      promptText: `${name} wants to make ${cents}¢ using quarters, dimes, nickels, and pennies. What is the LEAST number of coins ${name} can use?`,
      steps,
      finalAsk: "What is the fewest number of coins?",
      finalAnswers: [{ label: "coins", value: total }],
      data: { cents, q: g.q, d: g.d, n: g.n, p: g.p, total },
    };
  },
};
