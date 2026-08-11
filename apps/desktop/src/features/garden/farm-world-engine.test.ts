import { describe, expect, it } from "vitest";
import {
  findFarmPath,
  getBuddyRoutine,
  getFarmWorldSnapshot,
  isFarmPointWalkable,
  moveFarmPoint,
} from "./farm-world-engine";

describe("Farm World engine", () => {
  it("derives phase, season and deterministic weather from local time", () => {
    const morning = getFarmWorldSnapshot(new Date(2026, 3, 10, 8, 30));
    const night = getFarmWorldSnapshot(new Date(2026, 11, 10, 23, 5));

    expect(morning.phase).toBe("morning");
    expect(morning.season).toBe("spring");
    expect(getFarmWorldSnapshot(new Date(2026, 3, 9, 8, 30)).weather).toBe(
      "rain",
    );
    expect(night.phase).toBe("night");
    expect(night.season).toBe("winter");
    expect(getFarmWorldSnapshot(new Date(2026, 3, 10, 8, 30))).toEqual(morning);
  });

  it("selects Buddy autonomous routines by hour", () => {
    expect(getBuddyRoutine(9).activity).toBe("watering");
    expect(getBuddyRoutine(16).activity).toBe("exploring");
    expect(getBuddyRoutine(23).activity).toBe("sleeping");
  });

  it("plans a collision-free route around buildings and crop fields", () => {
    const path = findFarmPath({ left: 45, top: 42 }, { left: 88, top: 77 });

    expect(path.length).toBeGreaterThan(2);
    expect(path.every(isFarmPointWalkable)).toBe(true);
  });

  it("blocks keyboard movement into a building collider", () => {
    const start = { left: 43, top: 40 };
    const next = moveFarmPoint(start, -4, 0);

    expect(next).toEqual(start);
  });
});
