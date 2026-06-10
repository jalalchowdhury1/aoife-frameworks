import { describe, it, expect } from "vitest";
import { FRAMEWORKS } from "./index";
import { makeRng } from "../rng";

describe("every framework generator", () => {
  for (const fw of FRAMEWORKS) {
    it(`${fw.id}: 500 solvable, consistent problems`, () => {
      for (let seed = 1; seed <= 500; seed++) {
        const p = fw.generate(makeRng(seed));
        expect(p.steps.length, `${fw.id} has steps`).toBeGreaterThan(0);
        expect(p.finalAnswers.length).toBeGreaterThan(0);
        expect(p.promptText.length).toBeGreaterThan(0);
        expect(p.finalAsk.length).toBeGreaterThan(0);
        for (const s of p.steps) {
          if (s.input === "number") {
            const v = s.answer as number;
            expect(Number.isInteger(v) && v >= 0, `${fw.id} step ${s.id}=${v}`).toBe(true);
          }
          if (s.input === "choice") {
            expect(s.choices && s.choices.length >= 2, `${fw.id} ${s.id} choices`).toBe(true);
            expect(
              s.choices!.some((c) => c.value === s.answer),
              `${fw.id} ${s.id} answer is a choice`,
            ).toBe(true);
          }
          // Lead needs at least 2 decoys, none equal to the real question
          expect(s.decoyQuestions.length, `${fw.id} ${s.id} decoys`).toBeGreaterThanOrEqual(2);
          expect(s.decoyQuestions).not.toContain(s.ask);
          expect(s.hint.length, `${fw.id} ${s.id} hint`).toBeGreaterThan(0);
        }
        // The question-script must actually REACH every final answer: each
        // finalAnswer.value has to be the answer of some number step (otherwise
        // the child is walked through a script that never computes the answer).
        const numberStepAnswers = new Set(
          p.steps.filter((s) => s.input === "number").map((s) => s.answer as number),
        );
        for (const fa of p.finalAnswers) {
          expect(
            Number.isInteger(fa.value) && fa.value >= 0,
            `${fw.id} final ${fa.label}=${fa.value}`,
          ).toBe(true);
          expect(
            numberStepAnswers.has(fa.value),
            `${fw.id} final ${fa.label}=${fa.value} is never derived by a step @${seed}`,
          ).toBe(true);
        }
        // The script must END on an answer: the last step's answer is a final answer.
        const last = p.steps[p.steps.length - 1];
        expect(
          p.finalAnswers.some((fa) => fa.value === last.answer),
          `${fw.id} last step "${last.id}" (=${String(last.answer)}) is not a final answer @${seed}`,
        ).toBe(true);
        // framework-specific truth
        expect(fw.invariant(p.data), `${fw.id} invariant @${seed}`).toBe(true);
      }
    });
  }
  it("registry has 18 unique ids", () => {
    expect(FRAMEWORKS.length).toBe(18);
    expect(new Set(FRAMEWORKS.map((f) => f.id)).size).toBe(18);
  });
});
