export type TimeOfDay = "day" | "night";

export function getTimeOfDay(date: Date): TimeOfDay {
  const hour = date.getHours();
  return hour >= 6 && hour < 18 ? "day" : "night";
}
