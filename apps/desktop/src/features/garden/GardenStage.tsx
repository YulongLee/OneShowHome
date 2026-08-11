import {
  Basket,
  Cow,
  Drop,
  Fish,
  Heart,
  Leaf,
  LockSimple,
  Plant,
  Sparkle,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import animalTrio from "../../assets/farm/animal-trio.png";
import buddyFishing from "../../assets/farm/buddy-fishing.png";
import farmScene from "../../assets/farm/farm-scene.png";
import cropCarrot from "../../assets/garden/crop-carrot.png";
import cropLavender from "../../assets/garden/crop-lavender.png";
import cropLettuce from "../../assets/garden/crop-lettuce.png";
import cropStrawberry from "../../assets/garden/crop-strawberry.png";
import cropSunflower from "../../assets/garden/crop-sunflower.png";
import cropTomato from "../../assets/garden/crop-tomato.png";
import buddyGardening from "../../assets/house/buddy-gardening.png";
import {
  feedFarmAnimal,
  fishAtPond,
  harvestGardenPlot,
  plantGardenCrop,
  waterGardenPlot,
  type DesktopSnapshot,
  type GardenCropId,
  type GardenPlot,
} from "../../services/desktop-store";

type FarmMode = "plant" | "fish" | "animal";
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
const plotPositions = [
  { left: 46, top: 51 },
  { left: 33, top: 65 },
  { left: 61, top: 64 },
  { left: 46, top: 72 },
];
const animalMeta = {
  momo: { name: "Momo", label: "奶牛", left: 61 },
  yuki: { name: "Yuki", label: "绵羊", left: 73 },
  koko: { name: "Koko", label: "母鸡", left: 84 },
} as const;
const fishNames = {
  sunfish: "太阳鱼",
  carp: "小鲤鱼",
  bluegill: "蓝鳃鱼",
} as const;
const initialNow = Date.now();
const localDate = () => new Intl.DateTimeFormat("sv-SE").format(new Date());
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
  return `约 ${Math.floor(minutes / 60)} 小时${minutes % 60 ? ` ${minutes % 60} 分钟` : ""}`;
};
const errorText = (error: unknown) =>
  typeof error === "string" ? error : "刚才的互动没有完成，请再试一次。";

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
  const [mode, setMode] = useState<FarmMode>("plant");
  const [selectedCrop, setSelectedCrop] = useState<GardenCropId>("tomato");
  const [selectedPlotId, setSelectedPlotId] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [now, setNow] = useState(initialNow);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 10_000);
    return () => window.clearInterval(timer);
  }, []);

  const selectedPlot = snapshot.garden.plots.find(
    (plot) => plot.plotId === selectedPlotId,
  );
  const fishTotal = useMemo(
    () =>
      snapshot.garden.fishInventory.reduce(
        (sum, item) => sum + item.quantity,
        0,
      ),
    [snapshot.garden.fishInventory],
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
    if (busy) return;
    setSelectedPlotId(plot.plotId);
    if (plot.cropId && (plot.readyAt ?? Number.MAX_SAFE_INTEGER) > now) return;
    setBusy(`plot-${plot.plotId}`);
    try {
      const next = plot.cropId
        ? await harvestGardenPlot(plot.plotId)
        : await plantGardenCrop(plot.plotId, selectedCrop);
      onSnapshot(next);
      if (plot.cropId) {
        onNotice(
          `收获了 ${cropById(plot.cropId)?.name ?? "作物"}，已放进厨房食材篮。`,
        );
        onBuddyLine("今天的收成真好，晚餐会多一份新鲜味道。");
      } else {
        onNotice(
          `${cropById(selectedCrop)?.name ?? "种子"}已经种下，离线时也会继续生长。`,
        );
        onBuddyLine("种子住进泥土里了，我们一会儿再来看它吧。");
      }
    } catch (error) {
      onNotice(errorText(error));
    } finally {
      setBusy(null);
    }
  };

  const waterSelected = async () => {
    if (!selectedPlot || busy) return;
    setBusy(`plot-${selectedPlot.plotId}`);
    try {
      const next = await waterGardenPlot(selectedPlot.plotId);
      onSnapshot(next);
      onNotice("浇水完成，成熟时间提前了 15%。");
      onBuddyLine("喝到水以后，它好像一下子更有精神了。");
    } catch (error) {
      onNotice(errorText(error));
    } finally {
      setBusy(null);
    }
  };

  const goFishing = async () => {
    if (busy) return;
    setMode("fish");
    setBusy("fish");
    onBuddyLine("嘘……水面有一点动静，我来试试。");
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 1200));
      const previous = new Map(
        snapshot.garden.fishInventory.map((item) => [
          item.fishId,
          item.quantity,
        ]),
      );
      const next = await fishAtPond();
      const caught = next.garden.fishInventory.find(
        (item) => item.quantity > (previous.get(item.fishId) ?? 0),
      );
      onSnapshot(next);
      onNotice(
        `钓到了${caught ? fishNames[caught.fishId] : "一条鱼"}，已放进鱼篓。`,
      );
      onBuddyLine("钓到了！今天的池塘也送给我们一份小惊喜。");
    } catch (error) {
      onNotice(errorText(error));
    } finally {
      setBusy(null);
    }
  };

  const feedAnimal = async (animalId: "momo" | "yuki" | "koko") => {
    if (busy) return;
    setMode("animal");
    setBusy(animalId);
    try {
      const next = await feedFarmAnimal(animalId);
      onSnapshot(next);
      const animal = animalMeta[animalId];
      onNotice(`${animal.name} 吃饱了，亲密度增加。`);
      onBuddyLine(
        `${animal.label}${animal.name}今天看起来很开心，我们明天也来看看它吧。`,
      );
    } catch (error) {
      onNotice(errorText(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section
      aria-label="可种植、钓鱼和照料动物的农场"
      className={`room-stage farm-stage mode-${mode}`}
    >
      <img alt="OneShow Home 春日农场" className="home-scene" src={farmScene} />
      <div aria-hidden="true" className="scene-shade" />

      <div className="farm-level-card">
        <span>
          <Leaf weight="fill" /> 农场 Lv.{snapshot.garden.level}
        </span>
        <div className="garden-xp-track">
          <i style={{ width: `${Math.max(3, levelProgress * 100)}%` }} />
        </div>
        <small>
          {snapshot.garden.level >= 4
            ? "满级农场"
            : `${snapshot.garden.xp} / ${snapshot.garden.nextLevelXp} XP`}
        </small>
      </div>

      <img
        alt="农场里的奶牛、绵羊和母鸡"
        className="farm-animal-art"
        src={animalTrio}
      />
      {snapshot.garden.animals.map((animal) => {
        const meta = animalMeta[animal.animalId];
        const fed = animal.lastFedDate === localDate();
        return (
          <button
            aria-label={`${fed ? "查看" : "喂养"}${meta.label} ${meta.name}`}
            className={`animal-hotspot${busy === animal.animalId ? " is-acting" : ""}${fed ? " is-fed" : ""}`}
            disabled={busy !== null}
            key={animal.animalId}
            onClick={() => void feedAnimal(animal.animalId)}
            style={{ left: `${meta.left}%` }}
            type="button"
          >
            <span>
              <Heart weight="fill" /> {animal.affection}
            </span>
            <strong>{fed ? "今天吃饱了" : `喂养 ${meta.name}`}</strong>
          </button>
        );
      })}

      {snapshot.garden.plots.map((plot, index) => {
        const crop = cropById(plot.cropId);
        const progress = progressFor(plot, now);
        const ready = Boolean(plot.cropId && (plot.readyAt ?? 0) <= now);
        return (
          <button
            aria-label={
              crop
                ? `${crop.name}，${remainingLabel(plot.readyAt, now)}`
                : `空农田 ${plot.plotId}，种下${cropById(selectedCrop)?.name}`
            }
            className={`farm-plot${ready ? " is-ready" : ""}${selectedPlotId === plot.plotId ? " is-selected" : ""}`}
            disabled={busy !== null}
            key={plot.plotId}
            onClick={() => {
              setMode("plant");
              void runPlotAction(plot);
            }}
            style={{
              left: `${plotPositions[index].left}%`,
              top: `${plotPositions[index].top}%`,
            }}
            type="button"
          >
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
              <span className="farm-plant-plus">
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

      <button
        aria-label="在池塘钓鱼"
        className={`pond-hotspot${busy === "fish" ? " is-fishing" : ""}`}
        disabled={busy !== null}
        onClick={() => void goFishing()}
        type="button"
      >
        <Fish weight="fill" />
        <span>{busy === "fish" ? "等待鱼儿上钩…" : "去钓鱼"}</span>
      </button>

      <div
        aria-hidden="true"
        className={`farm-buddy${busy ? " is-acting" : ""}`}
      >
        <img alt="" src={mode === "fish" ? buddyFishing : buddyGardening} />
      </div>

      {mode === "plant" && selectedPlot?.cropId ? (
        <aside className="farm-detail-card">
          <img alt="" src={cropById(selectedPlot.cropId)?.image} />
          <div>
            <strong>{cropById(selectedPlot.cropId)?.name}</strong>
            <span>{remainingLabel(selectedPlot.readyAt, now)}</span>
            <small>浇水 {selectedPlot.waterCount}/2 次</small>
          </div>
          {(selectedPlot.readyAt ?? 0) > now ? (
            <button
              disabled={busy !== null || selectedPlot.waterCount >= 2}
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

      <div className="farm-tool-dock">
        <nav aria-label="农场玩法">
          <button
            className={mode === "plant" ? "is-active" : ""}
            onClick={() => setMode("plant")}
            type="button"
          >
            <Plant weight="fill" />
            <span>种植</span>
          </button>
          <button
            className={mode === "fish" ? "is-active" : ""}
            onClick={() => setMode("fish")}
            type="button"
          >
            <Fish weight="fill" />
            <span>钓鱼</span>
            <small>{fishTotal}</small>
          </button>
          <button
            className={mode === "animal" ? "is-active" : ""}
            onClick={() => setMode("animal")}
            type="button"
          >
            <Cow weight="fill" />
            <span>动物</span>
          </button>
        </nav>
        {mode === "plant" ? (
          <div className="farm-seed-list">
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
        ) : mode === "fish" ? (
          <div className="farm-inventory-row">
            {Object.entries(fishNames).map(([id, name]) => (
              <span key={id}>
                <Fish weight="fill" />
                <strong>{name}</strong>
                <em>
                  {snapshot.garden.fishInventory.find(
                    (item) => item.fishId === id,
                  )?.quantity ?? 0}
                </em>
              </span>
            ))}
          </div>
        ) : (
          <div className="farm-inventory-row">
            {snapshot.garden.animals.map((animal) => (
              <span key={animal.animalId}>
                <Heart weight="fill" />
                <strong>{animalMeta[animal.animalId].name}</strong>
                <em>亲密 {animal.affection}</em>
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
