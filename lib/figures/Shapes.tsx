import type { FigureSpec } from "../types";

// spec: { kind:"shapes", equations:string[] }
// Each equation is a ready-to-render string with shape emoji already substituted.
export function Shapes({ spec }: { spec: FigureSpec }) {
  const equations = (spec.equations as string[]) ?? [];

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      {equations.map((eq, i) => (
        <div
          key={i}
          className="text-2xl font-bold text-purple-700 bg-white border-2 border-purple-200 rounded-xl px-4 py-1.5"
        >
          {eq}
        </div>
      ))}
    </div>
  );
}
