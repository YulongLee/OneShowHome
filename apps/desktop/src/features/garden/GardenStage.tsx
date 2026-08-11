import {
  Basket,
  Drop,
  Leaf,
  LockSimple,
  Plant,
  Sparkle,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import cropCarrot from "../../assets/garden/crop-carrot.png";
import cropLavender from "../../assets/garden/crop-lavender.png";
import cropLettuce from "../../assets/garden/crop-lettuce.png";
import cropStrawberry from "../../assets/garden/crop-strawberry.png";
import cropSunflower from "../../assets/garden/crop-sunflower.png";
import cropTomato from "../../assets/garden/crop-tomato.png";
import buddyGardening from "../../assets/house/buddy-gardening.png";
import gardenScene from "../../assets/house/garden.png";
import {
  harvestGardenPlot,
  plantGardenCrop,
  waterGardenPlot,
  type DesktopSnapshot,
  type GardenCropId,
  type GardenPlot,
} from "../../services/desktop-store";

type CropMeta = {
  id: GardenCropId;
  name: string;
  image: string;
  minutes: number;
  unlockLevel: number;
};

const crops: CropMeta[] = [
  {
    id: "tomato",
    name: "番茄",
    image: cropTomato,
    minutes: 30,
    unlockLevel: 1,
  },
  {
    id: "carrot",
    name: "胡萝卜",
    image: cropCarrot,
    minutes: 45,
    unlockLevel: 1,
  },
  {
    id: "lettuce",
    name: "生菜",
    image: cropLettuce,
    minutes: 60,
    unlockLevel: 1,
  },
  {
    id: "strawberry",
    name: "草莓",
    image: cropStrawberry,
    minutes: 90,
    unlockLevel: 2,
  },
  {
    id: "lavender",
    name: "薰衣草",
    image: cropLavender,
    minutes: 120,
    unlockLevel: 2,
  },
  {
    id: "sunflower",
    name: "向日葵",
    image: cropSunflower,
    minutes: 180,
    unlockLevel: 3,
  },
];
const initialNow = Date.now();

const plotPositions = [
  { left: 34, top: 49 },
  { left: 45, top: 44 },
  { left: 56, top: 49 },
  { left: 45, top: 58 },
];

const cropById = (cropId: GardenCropId | null) =>
  crops.find((crop) => crop.id === cropId);

const progressFor = (plot: GardenPlot, now: number) => {
  if (!plot.plantedAt || !plot.readyAt) return 0;
  return Math.min(
    1,
    Math.max(0, (now - plot.plantedAt) / (plot.readyAt - plot.plantedAt)),
  );
};

const remainingLabel = (readyAt: number | null, now: number) => {
  if (!readyAt || readyAt <= now) return "可以收获";
  const minutes = Math.ceil((readyAt - now) / 60_000);
  if (minutes < 60) return `约 ${minutes} 分钟`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `约 ${hours} 小时 ${rest} 分钟` : `约 ${hours} 小时`;
};

const errorText = (error: unknown) =>
  typeof error === "string" ? error : "刚才没有照料成功，请再试一次。";

export function GardenStage({
  snapshot,
  onSnapshot,
  onNotice,
  onBuddyLine,
}: {
  snapshot: DesktopSnapshot;
  onSnapshot: (snapshot: DesktopSnapshot) => void;
  onNotice: (notice: string | null) => void;
  onBuddyLine: (line: string) => void;
}) {
  const [selectedCrop, setSelectedCrop] = useState<GardenCropId>("tomato");
  const [selectedPlotId, setSelectedPlotId] = useState<number | null>(null);
  const [busyPlotId, setBusyPlotId] = useState<number | null>(null);
  const [now, setNow] = useState(initialNow);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 10_000);
    return () => window.clearInterval(timer);
  }, []);

  const selectedPlot = snapshot.garden.plots.find(
    (plot) => plot.plotId === selectedPlotId,
  );
  const inventoryTotal = useMemo(
    () =>
      snapshot.garden.inventory.reduce((sum, item) => sum + item.quantity, 0),
    [snapshot.garden.inventory],
  );
  const currentLevelStart =
    snapshot.garden.level === 1
      ? 0
      : snapshot.garden.level === 2
        ? 60
        : snapshot.garden.level === 3
          ? 160
          : 320;
  const levelProgress =
    snapshot.garden.level >= 4
      ? 1
      : (snapshot.garden.xp - currentLevelStart) /
        (snapshot.garden.nextLevelXp - currentLevelStart);

  const runPlotAction = async (plot: GardenPlot) => {
    if (busyPlotId !== null) return;
    setSelectedPlotId(plot.plotId);
    if (plot.cropId && (plot.readyAt ?? Number.MAX_SAFE_INTEGER) > now) return;
    setBusyPlotId(plot.plotId);
    onNotice(null);
    try {
      const next = plot.cropId
        ? await harvestGardenPlot(plot.plotId)
        : await plantGardenCrop(plot.plotId, selectedCrop);
      onSnapshot(next);
      if (plot.cropId) {
        const crop = cropById(plot.cropId);
        onNotice(`收获了 ${crop?.name ?? "作物"}，已经放进厨房食材篮。`);
        onBuddyLine("今天的收成真好。晚上可以用它做点新鲜料理。");
      } else {
        const crop = cropById(selectedCrop);
        onNotice(`${crop?.name ?? "种子"}已经种下，会在离线时继续生长。`);
        onBuddyLine("种子住进泥土里了，我们过一会儿再来看它吧。");
      }
    } catch (error) {
      onNotice(errorText(error));
    } finally {
      setBusyPlotId(null);
    }
  };

  const waterSelected = async () => {
    if (!selectedPlot || busyPlotId !== null) return;
    setBusyPlotId(selectedPlot.plotId);
    onNotice(null);
    try {
      const next = await waterGardenPlot(selectedPlot.plotId);
      onSnapshot(next);
      onNotice("浇水完成，成熟时间提前了 15%。");
      onBuddyLine("喝到水以后，它好像一下子更有精神了。");
    } catch (error) {
      onNotice(errorText(error));
    } finally {
      setBusyPlotId(null);
    }
  };

  return (
    <section aria-label="可种植的花园" className="room-stage garden-stage">
      <img
        alt="阳光下的 OneShow Home 花园"
        className="home-scene"
        src={gardenScene}
      />
      <div aria-hidden="true" className="scene-shade" />

      <div className="garden-level-card">
        <span>
          <Leaf weight="fill" /> 园艺 Lv.{snapshot.garden.level}
        </span>
        <div
          aria-label={`园艺经验 ${snapshot.garden.xp}`}
          className="garden-xp-track"
        >
          <i style={{ width: `${Math.max(3, levelProgress * 100)}%` }} />
        </div>
        <small>
          {snapshot.garden.level >= 4
            ? "满级花园"
            : `${snapshot.garden.xp} / ${snapshot.garden.nextLevelXp} XP`}
        </small>
      </div>

      <div className="garden-pantry">
        <Basket weight="fill" />
        <span>厨房食材</span>
        <strong>{inventoryTotal}</strong>
      </div>

      {snapshot.garden.plots.map((plot, index) => {
        const crop = cropById(plot.cropId);
        const progress = progressFor(plot, now);
        const ready = Boolean(plot.cropId && (plot.readyAt ?? 0) <= now);
        return (
          <button
            aria-label={
              crop
                ? `${crop.name}，${remainingLabel(plot.readyAt, now)}`
                : `空花圃 ${plot.plotId}，种下${cropById(selectedCrop)?.name}`
            }
            className={`garden-plot${ready ? " is-ready" : ""}${selectedPlotId === plot.plotId ? " is-selected" : ""}`}
            disabled={busyPlotId !== null}
            key={plot.plotId}
            onClick={() => void runPlotAction(plot)}
            style={{
              left: `${plotPositions[index].left}%`,
              top: `${plotPositions[index].top}%`,
            }}
            type="button"
          >
            <span className="garden-soil" />
            {crop ? (
              <img
                alt=""
                className={
                  progress < 0.34
                    ? "is-sprout"
                    : progress < 0.78
                      ? "is-growing"
                      : "is-grown"
                }
                src={crop.image}
              />
            ) : (
              <span className="garden-plant-plus">
                <Plant weight="fill" />
              </span>
            )}
            {ready ? (
              <span className="garden-ready">
                <Sparkle weight="fill" /> 收获
              </span>
            ) : null}
          </button>
        );
      })}

      <div
        aria-hidden="true"
        className={`garden-buddy${busyPlotId ? " is-acting" : ""}`}
      >
        <img alt="" src={buddyGardening} />
      </div>

      {selectedPlot?.cropId ? (
        <aside className="garden-plot-detail">
          <img alt="" src={cropById(selectedPlot.cropId)?.image} />
          <div>
            <strong>{cropById(selectedPlot.cropId)?.name}</strong>
            <span>{remainingLabel(selectedPlot.readyAt, now)}</span>
            <small>已浇水 {selectedPlot.waterCount}/2 次</small>
          </div>
          {(selectedPlot.readyAt ?? 0) > now ? (
            <button
              disabled={busyPlotId !== null || selectedPlot.waterCount >= 2}
              onClick={() => void waterSelected()}
              type="button"
            >
              <Drop weight="fill" /> 浇水加速
            </button>
          ) : (
            <button
              onClick={() => void runPlotAction(selectedPlot)}
              type="button"
            >
              <Basket weight="fill" /> 收获
            </button>
          )}
        </aside>
      ) : null}

      <div className="seed-tray" role="group" aria-label="选择种子">
        <div className="seed-tray-title">
          <span>
            <Plant weight="fill" /> 选择种子
          </span>
          <small>点击空花圃种下</small>
        </div>
        <div className="seed-list">
          {crops.map((crop) => {
            const locked = snapshot.garden.level < crop.unlockLevel;
            return (
              <button
                aria-pressed={selectedCrop === crop.id}
                className={selectedCrop === crop.id ? "is-selected" : ""}
                disabled={locked}
                key={crop.id}
                onClick={() => setSelectedCrop(crop.id)}
                type="button"
              >
                <img alt="" src={crop.image} />
                <span>{crop.name}</span>
                <small>
                  {locked ? (
                    <>
                      <LockSimple weight="fill" /> Lv.{crop.unlockLevel}
                    </>
                  ) : (
                    `${crop.minutes} 分钟`
                  )}
                </small>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
