import type { FigureSpec } from "../types";
import { NumberBond } from "./NumberBond";
import { Bars } from "./Bars";
import { DotArray } from "./DotArray";
import { PostRow } from "./PostRow";
import { Sequence } from "./Sequence";
import { Grid } from "./Grid";
import { Shapes } from "./Shapes";

export function Figure({ spec }: { spec?: FigureSpec }) {
  if (!spec) return null;
  switch (spec.kind) {
    case "numberBond":
      return <NumberBond spec={spec} />;
    case "bars":
      return <Bars spec={spec} />;
    case "dotArray":
      return <DotArray spec={spec} />;
    case "postRow":
      return <PostRow spec={spec} />;
    case "sequence":
      return <Sequence spec={spec} />;
    case "grid":
      return <Grid spec={spec} />;
    case "shapes":
      return <Shapes spec={spec} />;
    default:
      return null;
  }
}
