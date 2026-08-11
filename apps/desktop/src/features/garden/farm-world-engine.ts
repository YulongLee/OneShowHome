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

type FarmRect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

const WORLD_BOUNDS = { left: 8, right: 92, top: 18, bottom: 88 } as const;
const GRID_COLUMNS = 28;
const GRID_ROWS = 22;

const COLLIDERS: FarmRect[] = [
  { left: 9, right: 41, top: 17, bottom: 45 },
  { left: 48, right: 65, top: 14, bottom: 35 },
  { left: 62, right: 86, top: 24, bottom: 43 },
  { left: 80, right: 94, top: 31, bottom: 51 },
  { left: 8, right: 39, top: 52, bottom: 82 },
  { left: 40, right: 59, top: 50, bottom: 69 },
  { left: 52, right: 72, top: 42, bottom: 58 },
  { left: 53, right: 72, top: 64, bottom: 82 },
  { left: 66, right: 82, top: 55, bottom: 76 },
];

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
      destination: { left: 43, top: 42 },
    },
  },
  {
    start: 9,
    routine: {
      activity: "watering",
      label: "正在浇水",
      line: "早上的土壤有点干，我去照顾刚发芽的作物。",
      destination: { left: 61, top: 53 },
    },
  },
  {
    start: 11,
    routine: {
      activity: "harvesting",
      label: "查看收成",
      line: "我来看看今天有没有成熟的作物。",
      destination: { left: 48, top: 59 },
    },
  },
  {
    start: 14,
    routine: {
      activity: "resting",
      label: "花园休息",
      line: "午后的风很舒服，我在花园边休息一会儿。",
      destination: { left: 44, top: 47 },
    },
  },
  {
    start: 16,
    routine: {
      activity: "exploring",
      label: "河边探索",
      line: "河边好像有新的动静，我去看看。",
      destination: { left: 85, top: 78 },
    },
  },
  {
    start: 19,
    routine: {
      activity: "returning",
      label: "准备回家",
      line: "天色慢慢暗了，我把工具收好就回家。",
      destination: { left: 43, top: 42 },
    },
  },
  {
    start: 22,
    routine: {
      activity: "sleeping",
      label: "已经入睡",
      line: "晚安，农场也要安静休息了。",
      destination: { left: 43, top: 42 },
    },
  },
];

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

  return {
    day,
    hour,
    minute: date.getMinutes(),
    phase,
    season,
    weather,
  };
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
  return !COLLIDERS.some(
    (collider) =>
      point.left >= collider.left &&
      point.left <= collider.right &&
      point.top >= collider.top &&
      point.top <= collider.bottom,
  );
}

const cellToPoint = (column: number, row: number): FarmPoint => ({
  left:
    WORLD_BOUNDS.left +
    (column / (GRID_COLUMNS - 1)) * (WORLD_BOUNDS.right - WORLD_BOUNDS.left),
  top:
    WORLD_BOUNDS.top +
    (row / (GRID_ROWS - 1)) * (WORLD_BOUNDS.bottom - WORLD_BOUNDS.top),
});

const pointToCell = (point: FarmPoint) => ({
  column: Math.round(
    ((point.left - WORLD_BOUNDS.left) /
      (WORLD_BOUNDS.right - WORLD_BOUNDS.left)) *
      (GRID_COLUMNS - 1),
  ),
  row: Math.round(
    ((point.top - WORLD_BOUNDS.top) /
      (WORLD_BOUNDS.bottom - WORLD_BOUNDS.top)) *
      (GRID_ROWS - 1),
  ),
});

const cellKey = (column: number, row: number) => `${column}:${row}`;
const distance = (a: FarmPoint, b: FarmPoint) =>
  Math.hypot(a.left - b.left, a.top - b.top);

function closestWalkableCell(point: FarmPoint) {
  const origin = pointToCell(point);
  let best = origin;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let column = 0; column < GRID_COLUMNS; column += 1) {
      const candidate = cellToPoint(column, row);
      if (!isFarmPointWalkable(candidate)) continue;
      const candidateDistance = distance(candidate, point);
      if (candidateDistance < bestDistance) {
        best = { column, row };
        bestDistance = candidateDistance;
      }
    }
  }
  return best;
}

export function findFarmPath(start: FarmPoint, target: FarmPoint): FarmPoint[] {
  const startCell = closestWalkableCell(start);
  const targetCell = closestWalkableCell(target);
  const targetPoint = cellToPoint(targetCell.column, targetCell.row);
  const open = [startCell];
  const cameFrom = new Map<string, string>();
  const gScore = new Map([[cellKey(startCell.column, startCell.row), 0]]);
  const cells = new Map<string, { column: number; row: number }>([
    [cellKey(startCell.column, startCell.row), startCell],
  ]);

  while (open.length > 0) {
    open.sort((a, b) => {
      const aKey = cellKey(a.column, a.row);
      const bKey = cellKey(b.column, b.row);
      return (
        (gScore.get(aKey) ?? Number.POSITIVE_INFINITY) +
        distance(cellToPoint(a.column, a.row), targetPoint) -
        ((gScore.get(bKey) ?? Number.POSITIVE_INFINITY) +
          distance(cellToPoint(b.column, b.row), targetPoint))
      );
    });
    const current = open.shift()!;
    const currentKey = cellKey(current.column, current.row);
    if (
      current.column === targetCell.column &&
      current.row === targetCell.row
    ) {
      const path = [current];
      let cursor = currentKey;
      while (cameFrom.has(cursor)) {
        cursor = cameFrom.get(cursor)!;
        path.push(cells.get(cursor)!);
      }
      return path.reverse().map((cell) => cellToPoint(cell.column, cell.row));
    }

    for (const [columnDelta, rowDelta] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const neighbor = {
        column: current.column + columnDelta,
        row: current.row + rowDelta,
      };
      if (
        neighbor.column < 0 ||
        neighbor.column >= GRID_COLUMNS ||
        neighbor.row < 0 ||
        neighbor.row >= GRID_ROWS ||
        !isFarmPointWalkable(cellToPoint(neighbor.column, neighbor.row))
      ) {
        continue;
      }
      const neighborKey = cellKey(neighbor.column, neighbor.row);
      const tentative = (gScore.get(currentKey) ?? 0) + 1;
      if (tentative >= (gScore.get(neighborKey) ?? Number.POSITIVE_INFINITY)) {
        continue;
      }
      cameFrom.set(neighborKey, currentKey);
      gScore.set(neighborKey, tentative);
      cells.set(neighborKey, neighbor);
      if (
        !open.some((cell) => cellKey(cell.column, cell.row) === neighborKey)
      ) {
        open.push(neighbor);
      }
    }
  }

  return [cellToPoint(startCell.column, startCell.row)];
}

export function moveFarmPoint(
  point: FarmPoint,
  horizontal: number,
  vertical: number,
): FarmPoint {
  const direct = {
    left: point.left + horizontal,
    top: point.top + vertical,
  };
  if (isFarmPointWalkable(direct)) return direct;
  const horizontalOnly = { left: point.left + horizontal, top: point.top };
  if (isFarmPointWalkable(horizontalOnly)) return horizontalOnly;
  const verticalOnly = { left: point.left, top: point.top + vertical };
  return isFarmPointWalkable(verticalOnly) ? verticalOnly : point;
}
