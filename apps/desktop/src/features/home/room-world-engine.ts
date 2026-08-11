import type { BuddyState } from "../../services/desktop-store";

export type LaunchRoom = Exclude<BuddyState["location"], "garden">;

export type RoomPoint = {
  x: number;
  y: number;
};

type WalkArea = {
  hub: RoomPoint;
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
  spawn: RoomPoint;
};

const walkAreas: Record<LaunchRoom, WalkArea> = {
  living_room: {
    minX: 35,
    maxX: 82,
    minY: 56,
    maxY: 82,
    hub: { x: 59, y: 72 },
    spawn: { x: 66, y: 74 },
  },
  kitchen: {
    minX: 27,
    maxX: 81,
    minY: 55,
    maxY: 82,
    hub: { x: 50, y: 68 },
    spawn: { x: 50, y: 68 },
  },
  bedroom: {
    minX: 45,
    maxX: 82,
    minY: 56,
    maxY: 82,
    hub: { x: 60, y: 72 },
    spawn: { x: 67, y: 74 },
  },
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const getRoomSpawn = (room: LaunchRoom): RoomPoint => ({
  ...walkAreas[room].spawn,
});

export const constrainRoomPoint = (
  room: LaunchRoom,
  point: RoomPoint,
): RoomPoint => {
  const area = walkAreas[room];
  const roomMaxY = room === "kitchen" && point.x > 60 ? 63 : area.maxY;
  const y = clamp(point.y, area.minY, roomMaxY);
  const perspectiveInset = Math.max(0, (area.minY + 7 - y) * 0.45);
  return {
    x: clamp(
      point.x,
      area.minX + perspectiveInset,
      area.maxX - perspectiveInset,
    ),
    y,
  };
};

const distance = (from: RoomPoint, to: RoomPoint) =>
  Math.hypot(to.x - from.x, to.y - from.y);

export const findRoomPath = (
  room: LaunchRoom,
  from: RoomPoint,
  target: RoomPoint,
): RoomPoint[] => {
  const destination = constrainRoomPoint(room, target);
  if (distance(from, destination) < 16) return [destination];

  const hub = walkAreas[room].hub;
  const crossesRoom = Math.abs(from.x - destination.x) > 22;
  return crossesRoom ? [{ ...hub }, destination] : [destination];
};

export const getRoomWalkDuration = (from: RoomPoint, to: RoomPoint) =>
  clamp(Math.round(distance(from, to) * 23), 260, 760);
