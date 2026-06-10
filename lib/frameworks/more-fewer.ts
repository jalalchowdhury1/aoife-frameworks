import type { Framework, Problem, Step } from "../types";
import type { Rng } from "../rng";

interface Skin {
  whoBig: string;
  whoSmall: string;
  item: string; // unit word, "" when the names already say the thing (apples/oranges)
}

const SKINS: Skin[] = [
  { whoBig: "Aoife", whoSmall: "her friend", item: "stickers" },
  { whoBig: "the red jar", whoSmall: "the blue jar", item: "marbles" },
  { whoBig: "the apples", whoSmall: "the oranges", item: "" },
];

export const moreFewer: Framework = {
  id: "more-fewer",
  title: "How Many More / Fewer",
  emoji: "⚖️",
  family: "Comparing & Parts",
  blurb:
    "Two groups, two different sizes — line them up and find the difference (how many more or fewer).",
  source: "added",
  invariant: (d) => d.big - d.small === d.diff && d.diff >= 1,
  generate(rng: Rng): Problem {
    const s = rng.pick(SKINS);
    const big = rng.int(8, 30);
    const small = rng.int(2, big - 1);
    const diff = big - small;
    const variant = rng.pick(["more", "fewer"] as const);

    // Item slot: include the unit word when there is one, otherwise leave it off.
    const itemTxt = s.item ? ` ${s.item}` : "";

    const question =
      variant === "more"
        ? `How many MORE does ${s.whoBig} have?`
        : `How many FEWER does ${s.whoSmall} have?`;

    const promptText = `${s.whoBig} has ${big}${itemTxt}. ${s.whoSmall} has ${small}. ${question}`;

    const steps: Step[] = [
      {
        id: "bigger",
        input: "choice",
        ask: "Which group is bigger?",
        choices: [
          { label: `${s.whoBig} (${big})`, value: "big" },
          { label: `${s.whoSmall} (${small})`, value: "small" },
        ],
        answer: "big",
        hint: `${big} is more than ${small}, so the one with ${big} is bigger.`,
        decoyQuestions: [
          `What is ${big} + ${small}?`,
          `How many${itemTxt} are there in all?`,
        ],
      },
      {
        id: "difference",
        input: "number",
        ask: `Line them up — bigger minus smaller: ${big} − ${small}`,
        answer: diff,
        hint: `Take away the ${small} that match, and count what's left over: ${big} − ${small}.`,
        decoyQuestions: [
          `What is ${big} + ${small}?`,
          `Which group is bigger?`,
        ],
      },
    ];

    return {
      promptText,
      figure: {
        kind: "bars",
        bars: [
          { label: "big", value: big, known: true },
          { label: "small", value: small, known: true },
        ],
      },
      steps,
      finalAsk: variant === "more" ? "How many more?" : "How many fewer?",
      finalAnswers: [{ label: "difference", value: diff }],
      data: { big, small, diff },
    };
  },
};
