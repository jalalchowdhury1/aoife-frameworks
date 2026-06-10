import type { Framework } from "../types";

// Frameworks are registered here. Phase 4 adds all 18 in family order.
export const FRAMEWORKS: Framework[] = [];

export const byId = (id: string): Framework | undefined =>
  FRAMEWORKS.find((f) => f.id === id);

export const FAMILIES: string[] = [
  "Counting & Grouping",
  "Comparing & Parts",
  "Reasoning to a Hidden Number",
  "Patterns & Structure",
  "Multi-Step & Real-World",
];
