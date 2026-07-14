import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";

const NAMES = ["Aoife", "Mayam", "Natalia", "Santino", "Bron"];
// (high-value coin, low-value coin). Same swap math as Two Kinds · Count & Legs:
// the coin VALUE plays the role of "legs", so extra ÷ perSwap is always whole.
const PAIRS = [
  { hi: { one: "quarter", pl: "quarters", v: 25 }, lo: { one: "nickel", pl: "nickels", v: 5 } },
  { hi: { one: "dime", pl: "dimes", v: 10 }, lo: { one: "nickel", pl: "nickels", v: 5 } },
  { hi: { one: "quarter", pl: "quarters", v: 25 }, lo: { one: "dime", pl: "dimes", v: 10 } },
  { hi: { one: "dime", pl: "dimes", v: 10 }, lo: { one: "penny", pl: "pennies", v: 1 } },
  { hi: { one: "nickel", pl: "nickels", v: 5 }, lo: { one: "penny", pl: "pennies", v: 1 } },
];

// The Q7 combo: N coins of two kinds are worth C¢ — how many of each? Pretend
// they're ALL the cheap coin, see how many cents short you are, then swap.
export const twoCoins: Framework = {
  id: "two-coins",
  title: "Two Coins",
  emoji: "⚖️",
  family: "Money & Coins",
  blurb:
    "A pile of two kinds of coins worth a known total — pretend they're all one kind, then swap to find each count.",
  source: "photo",
  invariant: (d) =>
    d.vhi * d.chi + d.vlo * d.clo === d.value &&
    d.chi + d.clo === d.coins &&
    d.allLow === d.coins * d.vlo &&
    d.extra === d.value - d.allLow &&
    d.perSwap === d.vhi - d.vlo &&
    d.extra === d.chi * d.perSwap,
  generate(rng: Rng): Problem {
    const name = rng.pick(NAMES);
    const { hi, lo } = rng.pick(PAIRS);
    const chi = rng.int(1, 5);
    const clo = rng.int(1, 8);
    const coins = chi + clo;
    const value = hi.v * chi + lo.v * clo;
    const allLow = coins * lo.v;
    const extra = value - allLow;
    const perSwap = hi.v - lo.v;

    const steps: Step[] = [
      {
        id: "kinds",
        input: "choice",
        ask: "What two kinds of coins are in the pile?",
        choices: rng.shuffle([
          { label: `${hi.pl} & ${lo.pl}`, value: `${hi.pl} & ${lo.pl}` },
          { label: "dimes & dollars", value: "x1" },
          { label: "coins & cents", value: "x2" },
        ]),
        answer: `${hi.pl} & ${lo.pl}`,
        hint: "Read the first sentence — it names the two kinds of coins.",
        decoyQuestions: [
          "How many cents are they worth in all?",
          `How many ${hi.pl} are there?`,
        ],
      },
      {
        id: "coins",
        input: "number",
        ask: "How many coins are there ALTOGETHER?",
        answer: coins,
        hint: "It's the count of coins, not their value — near the start of the problem.",
        decoyQuestions: [
          "How many cents are they worth?",
          `How much is one ${hi.one} worth?`,
        ],
      },
      {
        id: "allLow",
        input: "number",
        ask: `Pretend ALL ${coins} coins were ${lo.pl} (${lo.v}¢ each). How many cents is that? (${coins} × ${lo.v})`,
        answer: allLow,
        hint: `${coins} coins, each worth ${lo.v}¢: ${coins} × ${lo.v}.`,
        decoyQuestions: [
          `How many ${hi.pl} are there?`,
          "How many coins are there in all?",
        ],
      },
      {
        id: "extra",
        input: "number",
        ask: `But the pile is really worth ${value}¢. How many EXTRA cents? (${value} − ${allLow})`,
        answer: extra,
        hint: `Real cents minus the pretend cents: ${value} − ${allLow}.`,
        decoyQuestions: [
          "How many coins are there in all?",
          `How much is one ${lo.one} worth?`,
        ],
      },
      {
        id: "perSwap",
        input: "number",
        ask: `Swapping one ${lo.one} for one ${hi.one} adds how many cents? (${hi.v} − ${lo.v})`,
        answer: perSwap,
        hint: `A ${hi.one} is ${hi.v}¢ and a ${lo.one} is ${lo.v}¢: ${hi.v} − ${lo.v}.`,
        decoyQuestions: [
          `How many ${lo.pl} are there?`,
          "How many extra cents were there?",
        ],
      },
      {
        id: "countHi",
        input: "number",
        ask: `So how many ${hi.pl} are there? (${extra} ÷ ${perSwap})`,
        answer: chi,
        hint: `${extra} extra cents, ${perSwap}¢ added per swap: ${extra} ÷ ${perSwap}.`,
        decoyQuestions: [
          `How many ${lo.pl} are there?`,
          "How many coins are there in all?",
        ],
      },
      {
        id: "countLo",
        input: "number",
        ask: `And how many ${lo.pl}? (${coins} − ${chi})`,
        answer: clo,
        hint: `The rest of the ${coins} coins: ${coins} − ${chi}.`,
        decoyQuestions: [
          `How many ${hi.pl} are there?`,
          "How many cents are they worth?",
        ],
      },
    ];

    return {
      promptText: `${name} has ${coins} coins. Every coin is either a ${hi.one} or a ${lo.one}. Altogether they are worth ${value}¢. How many ${hi.pl} and how many ${lo.pl} does ${name} have?`,
      steps,
      finalAsk: `How many ${hi.pl}? How many ${lo.pl}?`,
      finalAnswers: [
        { label: hi.pl, value: chi },
        { label: lo.pl, value: clo },
      ],
      data: {
        vhi: hi.v,
        vlo: lo.v,
        chi,
        clo,
        coins,
        value,
        allLow,
        extra,
        perSwap,
      },
    };
  },
};
