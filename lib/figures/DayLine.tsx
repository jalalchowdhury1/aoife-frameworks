import type { FigureSpec } from "../types";

// spec: { kind:"dayLine",
//   variant?: "single" | "double" | "stacked",
//   events?: { hour24:number, icon:string }[],   // icons drawn above their cells
//   hopFrom?: number, hopTo?: number,             // one small arc per hour (countable)
//   highlight?: number,                           // ring one cell
//   nowA?: number, offsetB?: number,              // stacked: one NOW moment, two clocks
//   cityA?: string, cityB?: string }
// All hours are hour-of-day 0..23. The strip is the family's shared mental model:
// gold ☀️ ribbon = before lunch (a.m.), purple 🌙 ribbon = after lunch (p.m.);
// cell colors tell the sun's story (night–dawn–day–dusk–night).

const CELL = 40;
const W = 24 * CELL;

function cellFill(h: number): string {
  if (h <= 4 || h >= 21) return "#4338ca"; // deep night
  if (h === 5 || h === 20) return "#818cf8"; // edges of night
  if (h === 6 || h === 19) return "#c4b5fd"; // dawn / dusk
  if (h === 7 || h === 18) return "#fdba74"; // sunrise / sunset
  return "#fef3c7"; // daylight
}

function isNight(h: number): boolean {
  return h <= 5 || h >= 20;
}

function h12Label(h: number): number {
  return h % 12 === 0 ? 12 : h % 12;
}

function Cells({ y, highlight }: { y: number; highlight?: number }) {
  return (
    <>
      {Array.from({ length: 24 }).map((_, h) => (
        <rect
          key={h}
          x={h * CELL + 1}
          y={y}
          width={CELL - 2}
          height={36}
          rx={6}
          fill={cellFill(h)}
          stroke={highlight === h ? "#ec4899" : "#e9d5ff"}
          strokeWidth={highlight === h ? 4 : 1}
        />
      ))}
      {/* noon divider */}
      <line x1={12 * CELL} y1={y - 4} x2={12 * CELL} y2={y + 40} stroke="#f59e0b" strokeWidth={3} />
    </>
  );
}

function NumberRow({ y, mode, highlight }: { y: number; mode: "h12" | "h24"; highlight?: number }) {
  return (
    <>
      {Array.from({ length: 24 }).map((_, h) => (
        <text
          key={h}
          x={h * CELL + CELL / 2}
          y={y}
          textAnchor="middle"
          fontSize={mode === "h24" && highlight === h ? 15 : 12}
          fontWeight={highlight === h ? 800 : 600}
          fill={mode === "h24" ? (highlight === h ? "#be185d" : "#7e22ce") : "#6b21a8"}
        >
          {mode === "h12" ? h12Label(h) : h}
        </text>
      ))}
    </>
  );
}

export function DayLine({ spec }: { spec: FigureSpec }) {
  const variant = (spec.variant as string) ?? "single";
  if (variant === "stacked") return <StackedDayLine spec={spec} />;

  const events = (spec.events as { hour24: number; icon: string }[]) ?? [];
  const hopFrom = spec.hopFrom as number | undefined;
  const hopTo = spec.hopTo as number | undefined;
  const highlight = spec.highlight as number | undefined;
  const double = variant === "double";

  const RIBBON_Y = 2;
  const ICON_Y = 46;
  const CELLS_Y = 54;
  const NUM_Y = 106;
  const NUM24_Y = 124;
  const height = double ? 132 : 114;

  return (
    <div className="py-2 overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        className="w-full min-w-[560px]"
        role="img"
        aria-label="day line from midnight to midnight"
      >
        {/* a.m. / p.m. ribbons */}
        <rect x={0} y={RIBBON_Y} width={12 * CELL - 2} height={18} rx={9} fill="#fde68a" />
        <rect x={12 * CELL + 2} y={RIBBON_Y} width={12 * CELL - 2} height={18} rx={9} fill="#d8b4fe" />
        <text x={6 * CELL} y={RIBBON_Y + 13} textAnchor="middle" fontSize={12} fontWeight={700} fill="#92400e">
          ☀️ before lunch (a.m.)
        </text>
        <text x={18 * CELL} y={RIBBON_Y + 13} textAnchor="middle" fontSize={12} fontWeight={700} fill="#6b21a8">
          🌙 after lunch (p.m.)
        </text>

        {/* landmarks */}
        <text x={12 * CELL} y={ICON_Y - 4} textAnchor="middle" fontSize={15}>🥪</text>
        <text x={CELL / 2} y={ICON_Y - 4} textAnchor="middle" fontSize={13}>💤</text>
        <text x={23 * CELL + CELL / 2} y={ICON_Y - 4} textAnchor="middle" fontSize={13}>💤</text>
        {events.map((e, i) => (
          <text key={i} x={e.hour24 * CELL + CELL / 2} y={ICON_Y - 4} textAnchor="middle" fontSize={15}>
            {e.icon}
          </text>
        ))}

        <Cells y={CELLS_Y} highlight={highlight} />

        {/* hop arcs — one per hour so she can count them; the dot marks the start */}
        {hopFrom !== undefined && hopTo !== undefined && hopTo !== hopFrom && (
          <>
            {Array.from({ length: Math.abs(hopTo - hopFrom) }).map((_, i) => {
              const x1 = (Math.min(hopFrom, hopTo) + i) * CELL + CELL / 2;
              const x2 = x1 + CELL;
              return (
                <path
                  key={i}
                  d={`M ${x1} ${CELLS_Y + 2} A ${CELL / 2} ${CELL / 2 + 4} 0 0 1 ${x2} ${CELLS_Y + 2}`}
                  fill="none"
                  stroke="#ec4899"
                  strokeWidth={3}
                  strokeLinecap="round"
                />
              );
            })}
            <circle cx={hopFrom * CELL + CELL / 2} cy={CELLS_Y + 18} r={6} fill="#ec4899" />
          </>
        )}

        <NumberRow y={NUM_Y} mode="h12" />
        {double && <NumberRow y={NUM24_Y} mode="h24" highlight={highlight} />}
      </svg>
    </div>
  );
}

function StackedDayLine({ spec }: { spec: FigureSpec }) {
  const nowA = (spec.nowA as number) ?? 0;
  const offsetB = (spec.offsetB as number) ?? 0;
  const cityA = (spec.cityA as string) ?? "";
  const cityB = (spec.cityB as string) ?? "";
  // Slide strip B so ONE vertical NOW line crosses both cities' current cells.
  const shift = -offsetB * CELL;
  const minX = Math.min(0, shift);
  const width = W + Math.abs(offsetB) * CELL;
  const A_Y = 22;
  const B_Y = 96;
  const nowX = nowA * CELL + CELL / 2;

  return (
    <div className="py-2 overflow-x-auto">
      <svg
        viewBox={`${minX} 0 ${width} 172`}
        className="w-full min-w-[560px]"
        role="img"
        aria-label={`day lines for ${cityA} and ${cityB} at the same moment`}
      >
        <text x={nowX} y={12} textAnchor="middle" fontSize={13} fontWeight={800} fill="#dc2626">
          NOW
        </text>
        <text x={minX + 4} y={A_Y - 5} fontSize={12} fontWeight={700} fill="#7e22ce">{cityA}</text>
        <Cells y={A_Y} highlight={nowA} />
        <NumberRow y={A_Y + 50} mode="h12" />

        <g transform={`translate(${shift} 0)`}>
          <text x={4} y={B_Y - 5} fontSize={12} fontWeight={700} fill="#7e22ce">{cityB}</text>
          <Cells y={B_Y} highlight={nowA + offsetB} />
          <NumberRow y={B_Y + 50} mode="h12" />
        </g>

        <line x1={nowX} y1={16} x2={nowX} y2={B_Y + 44} stroke="#dc2626" strokeWidth={3} strokeDasharray="6 4" />
      </svg>
    </div>
  );
}
