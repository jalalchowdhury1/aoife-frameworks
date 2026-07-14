"use client";

import { useEffect, useRef, useState } from "react";
import type { FigureSpec } from "../types";

// Interactive strip for "line-hop" steps. A 🐇 marker starts on a cell; each
// tap of the hop button (or the next cell) moves it one hour, painting the
// trail. Submit sends, per inputSpec.mode:
//   "land" (default) → the landing cell's 12-hour number, or its 0..23 number
//                      when inputSpec.row === "h24" (the keep-counting clock)
//   "count"          → how many hops were made (Day 6: hours apart)
// inputSpec fields used: start (hour24 cell) · dir (+1/-1, default +1) ·
// hops (true count — Watch demo) · mode · row · target (hour24 cell to hop to,
// shown as 🚩 and the hop stops there — Day 6's "later mark")

function cellFill(h: number): string {
  if (h <= 4 || h >= 21) return "#4338ca";
  if (h === 5 || h === 20) return "#818cf8";
  if (h === 6 || h === 19) return "#c4b5fd";
  if (h === 7 || h === 18) return "#fdba74";
  return "#fef3c7";
}

function h12Label(h: number): number {
  return h % 12 === 0 ? 12 : h % 12;
}

export function DayLineInput({
  spec,
  onSubmit,
  disabled,
  demo,
}: {
  spec: FigureSpec;
  onSubmit: (value: number) => void;
  disabled?: boolean;
  demo?: boolean;
}) {
  const start = (spec.start as number) ?? 0;
  const dir = (spec.dir as number) ?? 1;
  const demoHops = (spec.hops as number) ?? 0;
  const mode = (spec.mode as string) ?? "land";
  const row = (spec.row as string) ?? "h12";
  const target = spec.target as number | undefined;
  const [hops, setHops] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const pos = start + dir * hops; // generators guarantee 0..23 stays in range

  useEffect(() => {
    if (!demo) return;
    timer.current = setInterval(() => {
      setHops((h) => {
        if (h + 1 >= demoHops && timer.current) clearInterval(timer.current);
        return h < demoHops ? h + 1 : h;
      });
    }, 600);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [demo, demoHops]);

  // Keep the marker in view as it hops.
  useEffect(() => {
    scroller.current
      ?.querySelector(`[data-cell="${pos}"]`)
      ?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [pos]);

  const trail = (h: number) =>
    dir === 1 ? h > start && h <= pos : h < start && h >= pos;

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div ref={scroller} className="w-full overflow-x-auto pb-1">
        <div className="flex min-w-fit mx-auto px-2">
          {Array.from({ length: 24 }).map((_, h) => (
            <button
              key={h}
              type="button"
              data-cell={h}
              disabled={disabled || demo || h !== pos + dir || pos === target}
              onClick={() => setHops((k) => k + 1)}
              className={`flex flex-col items-center shrink-0 w-11 rounded-lg border-2 py-1 ${
                h === pos
                  ? "border-pink-500 bg-pink-50"
                  : trail(h)
                    ? "border-pink-300"
                    : "border-transparent"
              }`}
            >
              <span
                className="w-9 h-9 rounded-md flex items-center justify-center text-lg"
                style={{ backgroundColor: cellFill(h) }}
              >
                {h === pos ? "🐇" : h === target ? "🚩" : h === 12 ? "🥪" : ""}
              </span>
              <span className="text-xs font-bold text-purple-800">{h12Label(h)}</span>
              {row === "h24" && (
                <span className={`text-xs font-extrabold ${h === pos ? "text-pink-600" : "text-purple-500"}`}>
                  {h}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="text-lg font-bold text-pink-600 h-7">
        {hops > 0 ? `${hops} hop${hops === 1 ? "" : "s"}` : demo ? "watch the bunny…" : "tap to hop!"}
      </div>
      {!demo && (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={disabled || pos + dir < 0 || pos + dir > 23 || pos === target}
            onClick={() => setHops((k) => k + 1)}
            className="bg-pink-400 text-white rounded-2xl px-6 py-3 text-xl font-bold active:scale-95"
          >
            🐇 hop {dir === 1 ? "➡️" : "⬅️"}
          </button>
          <button
            type="button"
            disabled={disabled || hops === 0}
            onClick={() => setHops(0)}
            className="bg-purple-100 text-purple-700 rounded-2xl px-4 py-3 font-bold active:scale-95"
            aria-label="start over"
          >
            ↩️
          </button>
          <button
            type="button"
            disabled={disabled || hops === 0}
            onClick={() =>
              onSubmit(mode === "count" ? hops : row === "h24" ? pos : h12Label(pos))
            }
            className="bg-green-500 text-white rounded-2xl px-6 py-3 text-xl font-bold active:scale-95"
          >
            ✓
          </button>
        </div>
      )}
    </div>
  );
}
