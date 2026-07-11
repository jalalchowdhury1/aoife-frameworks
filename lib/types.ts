import type { Rng } from "./rng";

export type Stage = "watch" | "together" | "lead" | "solo";
export const STAGES: Stage[] = ["watch", "together", "lead", "solo"];
export const STAGE_LABEL: Record<Stage, string> = {
  watch: "👀 Watch",
  together: "🤝 Together",
  lead: "🧭 Lead",
  solo: "🦋 Solo",
};
export const STAGE_BLURB: Record<Stage, string> = {
  watch: "Watch how it's done — read each question and answer.",
  together: "Your turn to answer each question. I'll give the questions.",
  lead: "Now YOU pick the right question to ask, then answer it.",
  solo: "All on your own! Solve it and tell me the answer.",
};

// "clock-set": she hops the hour hand around a ClockFace and submits the hour
//   it points at (1..12) — numeric answer semantics, identical to "number".
// "line-hop": she hops along a DayLine and submits the landing cell's number
//   (12-hour, or the bottom 0..23 row when inputSpec.row === "h24"), or the
//   COUNT of hops made when inputSpec.mode === "count". Numeric semantics too.
export type InputKind = "number" | "choice" | "clock-set" | "line-hop";
export interface Choice {
  label: string;
  value: number | string;
}

export interface Step {
  id: string;
  ask: string; // the self-question with values filled in
  answer: number | string; // expected answer
  input: InputKind;
  choices?: Choice[]; // when input === "choice"
  hint: string; // nudge after a wrong attempt — never the answer
  decoyQuestions: string[]; // Lead stage: plausible-but-wrong "next questions"
  warmup?: boolean; // "⭐ Warm-up" from yesterday's lesson; Lead skips question-picking
  inputSpec?: FigureSpec; // the figure a clock-set / line-hop step renders interactively
}

export interface FigureSpec {
  kind: string;
  [k: string]: unknown;
}

export interface FinalAnswer {
  label: string;
  value: number;
}

export interface Problem {
  promptText: string;
  figure?: FigureSpec;
  steps: Step[];
  finalAsk: string;
  finalAnswers: FinalAnswer[];
  data: Record<string, number>; // structured numbers used by the self-test invariant
}

export interface Framework {
  id: string;
  title: string;
  emoji: string;
  family: string;
  blurb: string;
  source: "photo" | "added";
  generate(rng: Rng): Problem;
  invariant(data: Record<string, number>): boolean; // test-only: must hold for every generated problem
}
