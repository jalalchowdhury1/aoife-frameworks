"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Framework, Stage } from "../types";
import { STAGES, STAGE_LABEL, STAGE_BLURB } from "../types";
import { makeRng, randomSeed } from "../rng";
import {
  readProgress,
  recordStageDone,
  recordSolo,
  isUnlocked,
  type Progress,
} from "../progress";
import { Figure } from "../figures/Figure";
import { StageRunner } from "./StageRunner";

function startStageFor(progress: Progress, id: string): Stage {
  const reached = progress[id]?.stageReached ?? 0;
  return STAGES[Math.min(reached, STAGES.length - 1)];
}

export function StageEngine({ framework }: { framework: Framework }) {
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState<Progress>({});
  const [stage, setStage] = useState<Stage>("watch");
  const [seed, setSeed] = useState(1);
  const [finished, setFinished] = useState<Stage | null>(null);

  // Client-only init: read progress + pick the starting stage + a random problem.
  // localStorage/Math.random must run after mount (not in render) to avoid hydration
  // mismatch; this synchronous setState-in-effect is intentional.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const p = readProgress();
    setProgress(p);
    setStage(startStageFor(p, framework.id));
    setSeed(randomSeed());
    setReady(true);
  }, [framework.id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const problem = useMemo(
    () => framework.generate(makeRng(seed)),
    [framework, seed],
  );

  const stageIdx = STAGES.indexOf(stage);
  const nextStage = stageIdx < STAGES.length - 1 ? STAGES[stageIdx + 1] : null;

  const handleComplete = (completed: Stage) => {
    if (completed === "solo") recordSolo(framework.id);
    else recordStageDone(framework.id, completed);
    setProgress(readProgress());
    setFinished(completed);
  };

  const goStage = (s: Stage) => {
    setStage(s);
    setSeed(randomSeed());
    setFinished(null);
  };

  const again = () => {
    setSeed(randomSeed());
    setFinished(null);
  };

  if (!ready) {
    return <div className="p-8 text-center text-purple-400 font-bold">Loading…</div>;
  }

  return (
    <div className="w-full max-w-xl mx-auto px-3 pb-8">
      {/* Header */}
      <div className="flex items-center gap-2 py-3">
        <Link href="/" className="text-purple-500 text-2xl active:scale-95" aria-label="home">
          🏠
        </Link>
        <div className="flex-1 text-center">
          <div className="text-xl font-bold text-purple-800">
            {framework.emoji} {framework.title}
          </div>
        </div>
        <div className="w-8" />
      </div>

      {/* Stage picker */}
      <div className="grid grid-cols-4 gap-1 mb-3">
        {STAGES.map((s) => {
          const unlocked = isUnlocked(progress, framework.id, s);
          const active = s === stage && !finished;
          return (
            <button
              key={s}
              type="button"
              disabled={!unlocked}
              onClick={() => unlocked && goStage(s)}
              className={`rounded-xl py-2 text-xs font-bold transition-all ${
                active
                  ? "bg-purple-500 text-white"
                  : unlocked
                    ? "bg-purple-100 text-purple-700 active:scale-95"
                    : "bg-gray-100 text-gray-300"
              }`}
            >
              {STAGE_LABEL[s]}
            </button>
          );
        })}
      </div>

      {finished ? (
        <EndPanel
          stage={finished}
          frameworkTitle={framework.title}
          nextStage={nextStage}
          onAgain={again}
          onNext={nextStage ? () => goStage(nextStage) : undefined}
        />
      ) : (
        <>
          <div className="text-center text-sm text-purple-500 mb-2">{STAGE_BLURB[stage]}</div>

          {/* Problem statement + figure shown in EVERY stage, including Solo. */}
          <div className="bg-white border-4 border-pink-200 rounded-2xl p-4 mb-3 text-lg text-gray-800 leading-snug">
            {problem.promptText}
          </div>
          <Figure spec={problem.figure} />

          <StageRunner
            key={`${stage}:${seed}`}
            stage={stage}
            problem={problem}
            seed={seed}
            onComplete={handleComplete}
          />
        </>
      )}
    </div>
  );
}

function EndPanel({
  stage,
  frameworkTitle,
  nextStage,
  onAgain,
  onNext,
}: {
  stage: Stage;
  frameworkTitle: string;
  nextStage: Stage | null;
  onAgain: () => void;
  onNext?: () => void;
}) {
  const msg =
    stage === "solo"
      ? "You solved it all by yourself! 🦋"
      : stage === "lead"
        ? "Brilliant — you asked the right questions! 🧭"
        : "Nice work! 🌟";
  return (
    <div className="text-center py-6 animate-bounce-in">
      <div className="text-5xl mb-2">🎉</div>
      <div className="text-2xl font-bold text-purple-800 mb-1">{msg}</div>
      <div className="text-sm text-purple-400 mb-5">{frameworkTitle}</div>
      <div className="flex flex-col gap-2 max-w-xs mx-auto">
        {onNext && nextStage && (
          <button
            type="button"
            onClick={onNext}
            className="bg-purple-500 text-white rounded-2xl py-3 font-bold text-lg active:scale-95"
          >
            Next: {STAGE_LABEL[nextStage]} ▶
          </button>
        )}
        <button
          type="button"
          onClick={onAgain}
          className="bg-pink-400 text-white rounded-2xl py-3 font-bold text-lg active:scale-95"
        >
          🔁 Try another one
        </button>
        <Link
          href="/"
          className="bg-purple-100 text-purple-700 rounded-2xl py-3 font-bold text-lg active:scale-95"
        >
          🏠 Home
        </Link>
      </div>
    </div>
  );
}
