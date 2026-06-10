import type { Framework } from "../types";
import { twoKinds } from "./two-kinds";

// Frameworks are registered here, in family order.
export const FRAMEWORKS: Framework[] = [twoKinds];

export const byId = (id: string): Framework | undefined =>
  FRAMEWORKS.find((f) => f.id === id);

export const FAMILIES: string[] = [
  "Counting & Grouping",
  "Comparing & Parts",
  "Reasoning to a Hidden Number",
  "Patterns & Structure",
  "Multi-Step & Real-World",
];
