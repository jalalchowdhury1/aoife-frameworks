import type { Framework } from "../types";

// Family 1 · Counting & Grouping
import { sharingLeftovers } from "./sharing-leftovers";
import { equalGroups } from "./equal-groups";
import { fenceposts } from "./fenceposts";
import { howManyDifferent } from "./how-many-different";
// Family 2 · Comparing & Parts
import { moreFewer } from "./more-fewer";
import { partPartWhole } from "./part-part-whole";
import { compareBar } from "./compare-bar";
// Family 3 · Reasoning to a Hidden Number
import { twoKinds } from "./two-kinds";
import { twoClue } from "./two-clue";
import { guessCheck } from "./guess-check";
import { workingBackwards } from "./working-backwards";
import { shapeEquations } from "./shape-equations";
import { crossNumberGrid } from "./cross-number-grid";
// Family 4 · Patterns & Structure
import { numberBonds } from "./number-bonds";
import { patternsRules } from "./patterns-rules";
// Family 5 · Multi-Step & Real-World
import { multiStepMoney } from "./multi-step-money";
import { timeElapsed } from "./time-elapsed";
import { measureUnits } from "./measure-units";
// Family 6 · Money & Coins
import { coinCounter } from "./coin-counter";
import { fewestCoins } from "./fewest-coins";
import { makingChange } from "./making-change";
import { equalBills } from "./equal-bills";
import { twoCoins } from "./two-coins";
// Family 7 · Time & Clocks
import { amPm } from "./am-pm";
import { hopHours } from "./hop-hours";
import { pastNoon } from "./past-noon";
import { clockAdd } from "./clock-add";
import { clock24 } from "./clock-24";
import { timeDifference } from "./time-difference";
import { timeZones } from "./time-zones";
import { chainedZones } from "./chained-zones";
import { flightZones } from "./flight-zones";

// Registered in family order — drives the home grid grouping.
export const FRAMEWORKS: Framework[] = [
  sharingLeftovers,
  equalGroups,
  fenceposts,
  howManyDifferent,
  moreFewer,
  partPartWhole,
  compareBar,
  twoKinds,
  twoClue,
  guessCheck,
  workingBackwards,
  shapeEquations,
  crossNumberGrid,
  numberBonds,
  patternsRules,
  multiStepMoney,
  timeElapsed,
  measureUnits,
  coinCounter,
  fewestCoins,
  makingChange,
  equalBills,
  twoCoins,
  amPm,
  hopHours,
  pastNoon,
  clockAdd,
  clock24,
  timeDifference,
  timeZones,
  chainedZones,
  flightZones,
];

export const byId = (id: string): Framework | undefined =>
  FRAMEWORKS.find((f) => f.id === id);

export const FAMILIES: string[] = [
  "Counting & Grouping",
  "Comparing & Parts",
  "Reasoning to a Hidden Number",
  "Patterns & Structure",
  "Multi-Step & Real-World",
  "Money & Coins",
  "Time & Clocks",
];
