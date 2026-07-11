import type { FigureSpec } from "../types";

// spec: { kind:"clockFace",
//   hour: 1..12, ampm: "am" | "pm",              // where the hand points
//   ghostHour?: 1..12, ghostAmpm?: "am"|"pm",    // faint start hand for hop problems
//   pair?: { hour, ampm, label },                // second clock (Day 6)
//   label?: string }
// Rim is gold for a.m., purple for p.m. — the same colors as the chips and the
// day-line ribbons. Whole hours only; the minute hand always points at 12.

const R = 74;
const C = 80;

function handAngle(hour: number): number {
  return (hour % 12) * 30; // degrees clockwise from 12
}

export function OneClock({
  hour,
  ampm,
  ghostHour,
  label,
  sweep,
}: {
  hour: number;
  ampm: "am" | "pm";
  ghostHour?: number;
  label?: string;
  sweep?: boolean; // CSS-transition the hand when `hour` changes (inputs/watch demo)
}) {
  const am = ampm === "am";
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 160 176" className="w-40 max-w-full" role="img" aria-label={`clock showing ${hour} o'clock`}>
        <circle cx={C} cy={C} r={R} fill="#fff" stroke={am ? "#f59e0b" : "#a855f7"} strokeWidth={7} />
        <text x={C} y={22} textAnchor="middle" fontSize={13}>
          {am ? "☀️" : "🌙"}
        </text>
        {Array.from({ length: 12 }).map((_, i) => {
          const n = i + 1;
          const a = ((n * 30 - 90) * Math.PI) / 180;
          return (
            <text
              key={n}
              x={C + Math.cos(a) * (R - 16)}
              y={C + Math.sin(a) * (R - 16) + 5}
              textAnchor="middle"
              fontSize={14}
              fontWeight={700}
              fill="#6b21a8"
            >
              {n}
            </text>
          );
        })}
        {/* minute hand — parked at 12 forever (whole hours only) */}
        <line x1={C} y1={C} x2={C} y2={C - R + 26} stroke="#d8b4fe" strokeWidth={3} strokeLinecap="round" />
        {/* ghost hand — where the hop started */}
        {ghostHour !== undefined && (
          <line
            x1={C}
            y1={C}
            x2={C}
            y2={C - R + 34}
            stroke={am ? "#f59e0b" : "#a855f7"}
            strokeWidth={5}
            strokeLinecap="round"
            opacity={0.3}
            transform={`rotate(${handAngle(ghostHour)} ${C} ${C})`}
          />
        )}
        {/* hour hand */}
        <line
          x1={C}
          y1={C}
          x2={C}
          y2={C - R + 34}
          stroke={am ? "#d97706" : "#7e22ce"}
          strokeWidth={6}
          strokeLinecap="round"
          transform={`rotate(${handAngle(hour)} ${C} ${C})`}
          style={sweep ? { transition: "transform 500ms ease-in-out" } : undefined}
        />
        <circle cx={C} cy={C} r={5} fill={am ? "#d97706" : "#7e22ce"} />
        {label && (
          <text x={C} y={172} textAnchor="middle" fontSize={13} fontWeight={700} fill="#7e22ce">
            {label}
          </text>
        )}
      </svg>
    </div>
  );
}

export function ClockFace({ spec }: { spec: FigureSpec }) {
  const pair = spec.pair as { hour: number; ampm: "am" | "pm"; label: string } | undefined;
  return (
    <div className="flex justify-center gap-6 py-2">
      <OneClock
        hour={spec.hour as number}
        ampm={spec.ampm as "am" | "pm"}
        ghostHour={spec.ghostHour as number | undefined}
        label={spec.label as string | undefined}
      />
      {pair && <OneClock hour={pair.hour} ampm={pair.ampm} label={pair.label} />}
    </div>
  );
}
