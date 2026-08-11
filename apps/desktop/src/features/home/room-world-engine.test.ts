import { describe, expect, it } from "vitest";
import {
  constrainRoomPoint,
  findRoomPath,
  getRoomSpawn,
  getRoomWalkDuration,
} from "./room-world-engine";

describe("room world engine", () => {
  it("keeps clicks inside each room walk area", () => {
    expect(constrainRoomPoint("living_room", { x: 2, y: 10 })).toEqual({
      x: 38.15,
      y: 56,
    });
    expect(constrainRoomPoint("kitchen", { x: 96, y: 96 })).toEqual({
      x: 81,
      y: 63,
    });
  });

  it("routes long movement through the room hub", () => {
    const path = findRoomPath(
      "living_room",
      { x: 36, y: 70 },
      { x: 80, y: 68 },
    );
    expect(path).toHaveLength(2);
    expect(path.at(-1)).toEqual({ x: 80, y: 68 });
  });

  it("provides safe spawn points and bounded walking durations", () => {
    expect(getRoomSpawn("bedroom")).toEqual({ x: 67, y: 74 });
    expect(getRoomWalkDuration({ x: 0, y: 0 }, { x: 1, y: 1 })).toBe(260);
    expect(getRoomWalkDuration({ x: 0, y: 0 }, { x: 100, y: 100 })).toBe(760);
  });
});
