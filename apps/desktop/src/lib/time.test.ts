import { describe, expect, it } from "vitest";
import { getTimeOfDay } from "./time";

describe("getTimeOfDay", () => {
  it.each([
    [0, "night"],
    [5, "night"],
    [6, "day"],
    [12, "day"],
    [17, "day"],
    [18, "night"],
    [23, "night"],
  ] as const)("maps hour %i to %s", (hour, expected) => {
    const date = new Date(2026, 7, 9, hour, 0, 0);
    expect(getTimeOfDay(date)).toBe(expected);
  });
});
