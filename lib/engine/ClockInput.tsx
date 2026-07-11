"use client";

import { useEffect, useRef, useState } from "react";
import type { FigureSpec } from "../types";
import { OneClock } from "../figures/ClockFace";

// Interactive clock for "clock-set" steps. She hops the hour hand one hour per
// tap (the wrap past 12 happens by itself — that IS the lesson), then submits
// the hour the hand points at. inputSpec fields used:
//   ghostHour (start, 1..12) · ampm ("am"|"pm", cosmetic rim color of the start)
//   dir (+1 forward / -1 back, default +1) · hops (true hop count — demo mode)

function wrap12(h: number): number {
  return ((h - 1) % 12 + 12) % 12 + 1;
}

export function ClockInput({
  spec,
  onSubmit,
  disabled,
  demo,
}: {
  spec: FigureSpec;
  onSubmit: (hour: number) => void;
  disabled?: boolean;
  demo?: boolean;
}) {
  const start = (spec.ghostHour as number) ?? 12;
  const dir = (spec.dir as number) ?? 1;
  const demoHops = (spec.hops as number) ?? 0;
  const [hops, setHops] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Watch-stage demo: hop automatically, one hour per beat, then stop.
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

  const hour = wrap12(start + dir * hops);
  // Cumulative angle: 30° per hop past the start, so the hand sweeps forward
  // THROUGH the 12 instead of snapping backward at the wrap.
  const angle = ((start % 12) + dir * hops) * 30;

  return (
    <div className="flex flex-col items-center gap-2">
      <OneClock
        hour={hour}
        ampm={(spec.ampm as "am" | "pm") ?? "am"}
        ghostHour={start}
        sweep
        angleOverride={angle}
      />
      <div className="text-lg font-bold text-pink-600 h-7">
        {hops > 0 ? `${hops} hop${hops === 1 ? "" : "s"}` : demo ? "watch the hand…" : "tap to hop!"}
      </div>
      {!demo && (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setHops((h) => h + 1)}
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
            onClick={() => onSubmit(hour)}
            className="bg-green-500 text-white rounded-2xl px-6 py-3 text-xl font-bold active:scale-95"
          >
            ✓
          </button>
        </div>
      )}
    </div>
  );
}
