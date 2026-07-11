// Presentation-only metadata for the Time & Clocks 9-day ladder. The home page
// renders this family as two story chapters with Day badges; nothing is locked.
export const TIME_CHAPTERS = [
  {
    title: "🏠 Chapter 1 · Aoife's Day",
    ids: ["am-pm", "hop-hours", "past-noon", "clock-add", "clock-24"],
  },
  {
    title: "🌍 Chapter 2 · Around the World",
    ids: ["time-difference", "time-zones", "chained-zones", "flight-zones"],
  },
] as const;

export const TIME_DAY: Record<string, number> = {
  "am-pm": 1,
  "hop-hours": 2,
  "past-noon": 3,
  "clock-add": 4,
  "clock-24": 5,
  "time-difference": 6,
  "time-zones": 7,
  "chained-zones": 8,
  "flight-zones": 9,
};
