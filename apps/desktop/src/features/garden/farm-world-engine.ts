export type FarmPoint = { left: number; top: number };
export type FarmTimePhase = "morning" | "day" | "evening" | "night";
export type FarmSeason = "spring" | "summer" | "autumn" | "winter";
export type FarmWeather = "sunny" | "rain";
export type BuddyFarmActivity =
  | "sleeping"
  | "waking"
  | "watering"
  | "harvesting"
  | "resting"
  | "exploring"
  | "returning";

export type FarmWorldSnapshot = {
  day: number;
  hour: number;
  minute: number;
  phase: FarmTimePhase;
  season: FarmSeason;
  weather: FarmWeather;
};

export type BuddyRoutine = {
  activity: BuddyFarmActivity;
  label: string;
  line: string;
  destination: FarmPoint;
};

export type FarmPathNode = {
  id: string;
  point: FarmPoint;
};

const WORLD_BOUNDS = { left: 8, right: 92, top: 18, bottom: 89 } as const;
const PATH_WIDTH = 4.2;

export const FARM_PATH_NODES: FarmPathNode[] = [
  { id: "home_gate", point: { left: 42, top: 44 } },
  { id: "home_yard", point: { left: 45, top: 48 } },
  { id: "barn_lane", point: { left: 47, top: 39 } },
  { id: "pasture_gate", point: { left: 59, top: 44 } },
  { id: "east_lane", point: { left: 75, top: 48 } },
  { id: "river_upper", point: { left: 87, top: 54 } },
  { id: "field_cross", point: { left: 47, top: 57 } },
  { id: "west_lane", point: { left: 38, top: 62 } },
  { id: "west_south", point: { left: 40, top: 78 } },
  { id: "south_lane", point: { left: 51, top: 85 } },
  { id: "plot_west", point: { left: 63, top: 61 } },
  { id: "plot_north", point: { left: 73, top: 52 } },
  { id: "plot_east", point: { left: 84, top: 61 } },
  { id: "plot_south", point: { left: 84, top: 77 } },
  { id: "river_lower", point: { left: 89, top: 80 } },
  { id: "bridge", point: { left: 86, top: 87 } },
];

export const FARM_PATH_EDGES: Array<[string, string]> = [
  ["home_gate", "home_yard"],
  ["home_yard", "barn_lane"],
  ["barn_lane", "pasture_gate"],
  ["pasture_gate", "east_lane"],
  ["east_lane", "river_upper"],
  ["home_yard", "field_cross"],
  ["field_cross", "west_lane"],
  ["west_lane", "west_south"],
  ["west_south", "south_lane"],
  ["field_cross", "plot_west"],
  ["plot_west", "plot_north"],
  ["plot_north", "east_lane"],
  ["plot_north", "plot_east"],
  ["plot_east", "river_upper"],
  ["plot_east", "plot_south"],
  ["plot_south", "river_lower"],
  ["plot_south", "south_lane"],
  ["river_lower", "bridge"],
  ["south_lane", "bridge"],
];

const nodeById = new Map(FARM_PATH_NODES.map((node) => [node.id, node]));
const seasonNames = {
  spring: "春季",
  summer: "夏季",
  autumn: "秋季",
  winter: "冬季",
} as const;

const activityByHour: Array<{ start: number; routine: BuddyRoutine }> = [
  {
    start: 6,
    routine: {
      activity: "waking",
      label: "刚刚起床",
      line: "早安，我先打开窗户看看今天的农场。",
      destination: { left: 42, top: 44 },
    },
  },
  {
    start: 9,
    routine: {
      activity: "watering",
      label: "正在浇水",
      line: "早上的土壤有点干，我去照顾刚发芽的作物。",
      destination: { left: 63, top: 61 },
    },
  },
  {
    start: 11,
    routine: {
      activity: "harvesting",
      label: "查看收成",
      line: "我来看看今天有没有成熟的作物。",
      destination: { left: 47, top: 57 },
    },
  },
  {
    start: 14,
    routine: {
      activity: "resting",
      label: "花园休息",
      line: "午后的风很舒服，我在花园边休息一会儿。",
      destination: { left: 45, top: 48 },
    },
  },
  {
    start: 16,
    routine: {
      activity: "exploring",
      label: "河边探索",
      line: "河边好像有新的动静，我去看看。",
      destination: { left: 89, top: 80 },
    },
  },
  {
    start: 19,
    routine: {
      activity: "returning",
      label: "准备回家",
      line: "天色慢慢暗了，我把工具收好就回家。",
      destination: { left: 42, top: 44 },
    },
  },
  {
    start: 22,
    routine: {
      activity: "sleeping",
      label: "已经入睡",
      line: "晚安，农场也要安静休息了。",
      destination: { left: 42, top: 44 },
    },
  },
];

const distance = (a: FarmPoint, b: FarmPoint) =>
  Math.hypot(a.left - b.left, a.top - b.top);

const projectPointToSegment = (
  point: FarmPoint,
  start: FarmPoint,
  end: FarmPoint,
) => {
  const horizontal = end.left - start.left;
  const vertical = end.top - start.top;
  const lengthSquared = horizontal * horizontal + vertical * vertical;
  const progress =
    lengthSquared === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            ((point.left - start.left) * horizontal +
              (point.top - start.top) * vertical) /
              lengthSquared,
          ),
        );
  return {
    left: start.left + horizontal * progress,
    top: start.top + vertical * progress,
  };
};

export function snapFarmPointToPath(point: FarmPoint): FarmPoint {
  let closest = FARM_PATH_NODES[0].point;
  let closestDistance = Number.POSITIVE_INFINITY;
  for (const [startId, endId] of FARM_PATH_EDGES) {
    const start = nodeById.get(startId)!.point;
    const end = nodeById.get(endId)!.point;
    const projected = projectPointToSegment(point, start, end);
    const projectedDistance = distance(point, projected);
    if (projectedDistance < closestDistance) {
      closest = projected;
      closestDistance = projectedDistance;
    }
  }
  return closest;
}

const closestNode = (point: FarmPoint) =>
  FARM_PATH_NODES.reduce((best, node) =>
    distance(point, node.point) < distance(point, best.point) ? node : best,
  );

const neighborsFor = (nodeId: string) =>
  FARM_PATH_EDGES.flatMap(([start, end]) =>
    start === nodeId ? [end] : end === nodeId ? [start] : [],
  );

export const getSeasonName = (season: FarmSeason) => seasonNames[season];

export function getFarmWorldSnapshot(date: Date): FarmWorldSnapshot {
  const hour = date.getHours();
  const month = date.getMonth();
  const day = Math.max(1, Math.min(28, date.getDate()));
  const phase: FarmTimePhase =
    hour < 6 || hour >= 22
      ? "night"
      : hour < 12
        ? "morning"
        : hour < 18
          ? "day"
          : "evening";
  const season: FarmSeason =
    month >= 2 && month <= 4
      ? "spring"
      : month >= 5 && month <= 7
        ? "summer"
        : month >= 8 && month <= 10
          ? "autumn"
          : "winter";
  const weatherSeed =
    date.getFullYear() * 372 + (month + 1) * 31 + date.getDate();
  const weather: FarmWeather = weatherSeed % 5 === 0 ? "rain" : "sunny";
  return { day, hour, minute: date.getMinutes(), phase, season, weather };
}

export function getBuddyRoutine(hour: number): BuddyRoutine {
  if (hour < 6) return activityByHour.at(-1)!.routine;
  return [...activityByHour].reverse().find((entry) => hour >= entry.start)!
    .routine;
}

export function isFarmPointWalkable(point: FarmPoint): boolean {
  if (
    point.left < WORLD_BOUNDS.left ||
    point.left > WORLD_BOUNDS.right ||
    point.top < WORLD_BOUNDS.top ||
    point.top > WORLD_BOUNDS.bottom
  ) {
    return false;
  }
  return distance(point, snapFarmPointToPath(point)) <= PATH_WIDTH;
}

export function findFarmPath(start: FarmPoint, target: FarmPoint): FarmPoint[] {
  const snappedStart = snapFarmPointToPath(start);
  const snappedTarget = snapFarmPointToPath(target);
  const startNode = closestNode(snappedStart);
  const targetNode = closestNode(snappedTarget);
  const unvisited = new Set(FARM_PATH_NODES.map((node) => node.id));
  const distances = new Map(
    FARM_PATH_NODES.map((node) => [node.id, Number.POSITIVE_INFINITY]),
  );
  const previous = new Map<string, string>();
  distances.set(startNode.id, 0);

  while (unvisited.size > 0) {
    const currentId = [...unvisited].sort(
      (a, b) => distances.get(a)! - distances.get(b)!,
    )[0];
    if (!currentId || distances.get(currentId) === Number.POSITIVE_INFINITY)
      break;
    unvisited.delete(currentId);
    if (currentId === targetNode.id) break;
    const current = nodeById.get(currentId)!;
    for (const neighborId of neighborsFor(currentId)) {
      if (!unvisited.has(neighborId)) continue;
      const neighbor = nodeById.get(neighborId)!;
      const tentative =
        distances.get(currentId)! + distance(current.point, neighbor.point);
      if (tentative < distances.get(neighborId)!) {
        distances.set(neighborId, tentative);
        previous.set(neighborId, currentId);
      }
    }
  }

  const nodePath = [targetNode.id];
  while (nodePath[0] !== startNode.id && previous.has(nodePath[0])) {
    nodePath.unshift(previous.get(nodePath[0])!);
  }
  const route = [
    snappedStart,
    ...nodePath.map((nodeId) => nodeById.get(nodeId)!.point),
    snappedTarget,
  ];
  return route.filter(
    (point, index) => index === 0 || distance(point, route[index - 1]) > 0.2,
  );
}

export function moveFarmPoint(
  point: FarmPoint,
  horizontal: number,
  vertical: number,
): FarmPoint {
  const intended = {
    left: point.left + horizontal,
    top: point.top + vertical,
  };
  const snapped = snapFarmPointToPath(intended);
  return distance(intended, snapped) <= PATH_WIDTH + 1 ? snapped : point;
}
