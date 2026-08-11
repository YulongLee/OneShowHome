import {
  Axe,
  Backpack,
  Basket,
  BookOpenText,
  CalendarDots,
  Check,
  ClipboardText,
  Coin,
  Drop,
  Fish,
  Footprints,
  GearSix,
  Hammer,
  Heart,
  Leaf,
  LockSimple,
  MapTrifold,
  Package,
  Plant,
  Shovel,
  Sparkle,
  Sun,
  TShirt,
  TreeEvergreen,
  X,
} from "@phosphor-icons/react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import buddyFishing from "../../assets/farm/buddy-fishing.png";
import buddyStanding from "../../assets/farm/buddy-standing.png";
import buddyWalkCycle from "../../assets/farm/buddy-walk-cycle.png";
import farmWorld from "../../assets/farm/farm-world-anime-v3.png";
import cropCarrot from "../../assets/garden/crop-carrot.png";
import cropLavender from "../../assets/garden/crop-lavender.png";
import cropLettuce from "../../assets/garden/crop-lettuce.png";
import cropStrawberry from "../../assets/garden/crop-strawberry.png";
import cropSunflower from "../../assets/garden/crop-sunflower.png";
import cropTomato from "../../assets/garden/crop-tomato.png";
import buddyAvatar from "../../assets/house/buddy-avatar.png";
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
type BuddyPose = "idle" | "gardening" | "fishing";
type FarmPoint = { left: number; top: number };
type FarmTool = "water" | "hoe" | "axe" | "basket" | "seed" | "feed";
type FarmPanel = "inventory" | "map" | "diary" | "wardrobe" | "settings";
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
  { left: 70.5, top: 59 },
  { left: 79, top: 59 },
  { left: 70.5, top: 69 },
  { left: 79, top: 69 },
];
const animalMeta = {
  momo: { name: "Momo", label: "奶牛", left: 65, top: 23 },
  yuki: { name: "Yuki", label: "绵羊", left: 74, top: 23 },
  koko: { name: "Koko", label: "母鸡", left: 86, top: 39 },
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
  const [activeTool, setActiveTool] = useState<FarmTool>("water");
  const [activePanel, setActivePanel] = useState<FarmPanel | null>(null);
  const [buddyToast, setBuddyToast] =
    useState("我先巡视一下农场，需要帮忙就叫我。");
  const [selectedCrop, setSelectedCrop] = useState<GardenCropId>("tomato");
  const [selectedPlotId, setSelectedPlotId] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [buddyPose, setBuddyPose] = useState<BuddyPose>("idle");
  const [buddyPosition, setBuddyPosition] = useState<FarmPoint>({
    left: 48,
    top: 42,
  });
  const [walkMarker, setWalkMarker] = useState<FarmPoint | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [facing, setFacing] = useState<"left" | "right">("right");
  const [walkDuration, setWalkDuration] = useState(600);
  const [now, setNow] = useState(initialNow);
  const movementTimer = useRef<number | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 10_000);
    return () => {
      window.clearInterval(timer);
      if (movementTimer.current) window.clearTimeout(movementTimer.current);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
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
  const clock = new Date(now);
  const farmTime = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(clock);
  const dayNumber = Math.max(
    1,
    Math.ceil(
      (clock.getTime() - new Date(clock.getFullYear(), 0, 1).getTime()) /
        86_400_000,
    ) % 28,
  );
  const completedTasks = snapshot.dailyTasks.filter(
    (task) => task.progress >= task.target,
  ).length;
  const cropInventoryTotal = snapshot.garden.inventory.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const showBuddyToast = (message: string) => {
    setBuddyToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(
      () => setBuddyToast("我会自己留意作物和动物的状态。"),
      5_000,
    );
  };

  const walkTo = (target: FarmPoint) =>
    new Promise<void>((resolve) => {
      if (movementTimer.current) window.clearTimeout(movementTimer.current);
      const distance = Math.hypot(
        target.left - buddyPosition.left,
        target.top - buddyPosition.top,
      );
      const duration = Math.min(1800, Math.max(620, distance * 42));
      setFacing(target.left < buddyPosition.left ? "left" : "right");
      setWalkDuration(duration);
      setBuddyPose("idle");
      setWalkMarker(target);
      setIsMoving(true);
      setBuddyPosition(target);
      movementTimer.current = window.setTimeout(() => {
        setIsMoving(false);
        setWalkMarker(null);
        movementTimer.current = null;
        resolve();
      }, duration);
    });

  const moveOnMap = (event: PointerEvent<HTMLButtonElement>) => {
    if (busy || isMoving || event.button !== 0) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    let left = ((event.clientX - bounds.left) / bounds.width) * 100;
    let top = ((event.clientY - bounds.top) / bounds.height) * 100;
    left = Math.min(82, Math.max(13, left));
    top = Math.min(76, Math.max(31, top));
    if (left < 38 && top < 45) top = 45;
    if (left > 56 && top < 40) top = 40;
    if (left > 74) left = 72;
    onBuddyLine("我过去看看，等我一下。");
    void walkTo({ left, top }).then(() =>
      onBuddyLine("到了。这里的风景好像也有一点不一样。"),
    );
  };

  const runPlotAction = async (plot: GardenPlot) => {
    if (busy) return;
    setSelectedPlotId(plot.plotId);
    const position = plotPositions[plot.plotId - 1];
    if (plot.cropId && (plot.readyAt ?? Number.MAX_SAFE_INTEGER) > now) {
      setBusy(`plot-${plot.plotId}`);
      try {
        await walkTo({ left: position.left - 6, top: position.top - 8 });
        setBuddyPose("gardening");
        onBuddyLine(
          `${cropById(plot.cropId)?.name ?? "作物"}还在慢慢长大，我们就在旁边看看它。`,
        );
      } finally {
        setBusy(null);
      }
      return;
    }
    setBusy(`plot-${plot.plotId}`);
    try {
      await walkTo({ left: position.left - 6, top: position.top - 8 });
      setBuddyPose("gardening");
      const next = plot.cropId
        ? await harvestGardenPlot(plot.plotId)
        : await plantGardenCrop(plot.plotId, selectedCrop);
      onSnapshot(next);
      if (plot.cropId) {
        onNotice(
          `收获了 ${cropById(plot.cropId)?.name ?? "作物"}，已放进厨房食材篮。`,
        );
        onBuddyLine("今天的收成真好，晚餐会多一份新鲜味道。");
        showBuddyToast("收获完成！新的食材已经放进背包。");
      } else {
        onNotice(
          `${cropById(selectedCrop)?.name ?? "种子"}已经种下，离线时也会继续生长。`,
        );
        onBuddyLine("种子住进泥土里了，我们一会儿再来看它吧。");
        showBuddyToast("种子已经种下，我会记得观察它的状态。");
      }
    } catch (error) {
      onNotice(errorText(error));
    } finally {
      setBusy(null);
    }
  };

  const waterSelected = async (targetPlot = selectedPlot) => {
    if (!targetPlot || busy) return;
    setBusy(`plot-${targetPlot.plotId}`);
    try {
      const position = plotPositions[targetPlot.plotId - 1];
      await walkTo({ left: position.left - 6, top: position.top - 8 });
      setBuddyPose("gardening");
      const next = await waterGardenPlot(targetPlot.plotId);
      onSnapshot(next);
      onNotice("浇水完成，成熟时间提前了 15%。");
      onBuddyLine("喝到水以后，它好像一下子更有精神了。");
      showBuddyToast("浇水完成，作物成长时间缩短了 15%。");
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
    onBuddyLine("我先走到池塘边，再看看水里的动静。");
    try {
      await walkTo({ left: 68, top: 43 });
      setBuddyPose("fishing");
      onBuddyLine("嘘……水面有一点动静，我来试试。");
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
      showBuddyToast("河边有新的收获，已经帮你放进背包。");
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
      const animalTargets: Record<typeof animalId, FarmPoint> = {
        momo: { left: 58, top: 31 },
        yuki: { left: 69, top: 31 },
        koko: { left: 80, top: 43 },
      };
      await walkTo(animalTargets[animalId]);
      setBuddyPose("idle");
      const next = await feedFarmAnimal(animalId);
      onSnapshot(next);
      const animal = animalMeta[animalId];
      onNotice(`${animal.name} 吃饱了，亲密度增加。`);
      onBuddyLine(
        `${animal.label}${animal.name}今天看起来很开心，我们明天也来看看它吧。`,
      );
      showBuddyToast(`${animal.name} 已经吃饱了，亲密度增加。`);
    } catch (error) {
      onNotice(errorText(error));
    } finally {
      setBusy(null);
    }
  };

  const handleToolOnPlot = (plot: GardenPlot) => {
    setSelectedPlotId(plot.plotId);
    setMode("plant");
    if (activeTool === "water") {
      if (!plot.cropId) {
        onNotice("这块土地还没有作物，先选择种子吧。");
        return;
      }
      void waterSelected(plot);
      return;
    }
    if (activeTool === "basket" && !plot.cropId) {
      onNotice("这里还没有可以收获的作物。");
      return;
    }
    if (activeTool === "hoe" && plot.cropId) {
      onNotice("这块土地已经种植了作物。");
      return;
    }
    if (activeTool === "axe") {
      onNotice("斧头用于清理农场边缘的木材，当前土地不需要处理。");
      return;
    }
    void runPlotAction(plot);
  };

  return (
    <section
      aria-label="可种植、钓鱼和照料动物的农场"
      className={`room-stage farm-stage mode-${mode}`}
    >
      <img alt="OneShow Home 春日农场" className="home-scene" src={farmWorld} />
      <div aria-hidden="true" className="scene-shade" />

      <header className="farm-game-hud">
        <section aria-label="角色状态" className="farm-player-card">
          <img alt="" src={buddyAvatar} />
          <div>
            <strong>{snapshot.profile?.name ?? "Milo"}</strong>
            <span className="farm-energy-track">
              <i style={{ width: `${snapshot.state?.energy ?? 80}%` }} />
              <em>{Math.round((snapshot.state?.energy ?? 80) * 1.2)}/120</em>
            </span>
            <small>
              <b>Lv.{snapshot.garden.level}</b>
              <Coin weight="fill" />
              {1_280 +
                snapshot.garden.xp * 15 +
                snapshot.homeProgress.leafPoints * 20}
            </small>
          </div>
        </section>

        <section aria-label="农场时间与天气" className="farm-climate-card">
          <div>
            <span>
              春季 {dayNumber}日（周
              {new Intl.DateTimeFormat("zh-CN", { weekday: "short" })
                .format(clock)
                .slice(-1)}
              ）
            </span>
            <strong>{farmTime}</strong>
          </div>
          <div>
            <Sun weight="fill" />
            <strong>晴天</strong>
            <span>温度 22°C</span>
          </div>
        </section>

        <nav aria-label="农场功能" className="farm-top-actions">
          <button onClick={() => setActivePanel("inventory")} type="button">
            <Backpack weight="fill" />
            <span>背包</span>
          </button>
          <button onClick={() => setActivePanel("map")} type="button">
            <MapTrifold weight="fill" />
            <span>地图</span>
          </button>
          <button onClick={() => setActivePanel("diary")} type="button">
            <BookOpenText weight="fill" />
            <span>日记</span>
          </button>
          <button onClick={() => setActivePanel("wardrobe")} type="button">
            <TShirt weight="fill" />
            <span>装扮</span>
          </button>
          <button onClick={() => setActivePanel("settings")} type="button">
            <GearSix weight="fill" />
            <span>设置</span>
          </button>
        </nav>
      </header>

      <aside aria-label="农场任务" className="farm-mission-board">
        <header>
          <ClipboardText weight="fill" />
          <strong>任务</strong>
          <span>
            {completedTasks}/{snapshot.dailyTasks.length}
          </span>
        </header>
        <section>
          <small>主线任务</small>
          <strong>扩建农场</strong>
          <p>
            收集木材 <b>18/20</b>
          </p>
          <p>
            收集石材 <b>8/10</b>
          </p>
        </section>
        <section>
          <small>每日任务</small>
          {snapshot.dailyTasks.slice(0, 3).map((task) => {
            const done = task.progress >= task.target;
            return (
              <p className={done ? "is-done" : ""} key={task.id}>
                <Check weight="bold" />
                {task.title}
                <b>
                  {Math.min(task.progress, task.target)}/{task.target}
                </b>
              </p>
            );
          })}
        </section>
      </aside>

      <aside aria-live="polite" className="farm-buddy-event">
        <img alt="" src={buddyAvatar} />
        <div>
          <strong>Buddy 行动</strong>
          <p>{buddyToast}</p>
        </div>
      </aside>
      <button
        aria-label="点击农场地面移动 Buddy"
        className="farm-walk-layer"
        disabled={busy !== null}
        onPointerDown={moveOnMap}
        type="button"
      />
      {walkMarker ? (
        <span
          aria-hidden="true"
          className="farm-walk-marker"
          style={{
            left: `${walkMarker.left}%`,
            top: `${walkMarker.top + 15}%`,
          }}
        >
          <Footprints weight="fill" />
        </span>
      ) : null}

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
            style={{ left: `${meta.left}%`, top: `${meta.top}%` }}
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
              handleToolOnPlot(plot);
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
        className={`farm-buddy${busy ? " is-acting" : ""}${isMoving ? " is-moving" : ""} is-facing-${facing}`}
        style={
          {
            left: `${buddyPosition.left}%`,
            top: `${buddyPosition.top}%`,
            width:
              buddyPose === "fishing" && !isMoving
                ? "15%"
                : `${5.2 + buddyPosition.top * 0.028 + (buddyPose === "gardening" ? 0.5 : 0)}%`,
            "--walk-duration": `${walkDuration}ms`,
          } as CSSProperties
        }
      >
        {isMoving ? (
          <span
            className="farm-buddy-walk-cycle"
            style={{ backgroundImage: `url(${buddyWalkCycle})` }}
          />
        ) : (
          <img
            alt=""
            src={
              buddyPose === "fishing"
                ? buddyFishing
                : buddyPose === "gardening"
                  ? buddyGardening
                  : buddyStanding
            }
          />
        )}
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
        <header>
          <Hammer weight="fill" />
          <span>工具</span>
        </header>
        <nav aria-label="农场工具">
          {(
            [
              { id: "water", label: "浇水壶", icon: Drop },
              { id: "hoe", label: "锄头", icon: Shovel },
              { id: "axe", label: "斧头", icon: Axe },
              { id: "basket", label: "篮子", icon: Basket },
              { id: "seed", label: "种子", icon: Plant },
              { id: "feed", label: "饲料", icon: Package },
            ] as Array<{ id: FarmTool; label: string; icon: typeof Drop }>
          ).map(({ id, label, icon: Icon }) => (
            <button
              aria-pressed={activeTool === id}
              className={activeTool === id ? "is-active" : ""}
              key={id}
              onClick={() => {
                setActiveTool(id);
                setMode(id === "feed" ? "animal" : "plant");
              }}
              type="button"
            >
              <Icon weight="fill" />
              <span>{label}</span>
              {id === "seed" ? <small>{cropInventoryTotal || 24}</small> : null}
            </button>
          ))}
        </nav>
        {activeTool === "seed" ? (
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
        ) : null}
      </div>

      <button
        aria-label="去河边钓鱼"
        className="farm-fish-button"
        disabled={busy !== null}
        onClick={() => void goFishing()}
        type="button"
      >
        <Fish weight="fill" />
        <span>钓鱼</span>
        <small>{fishTotal}</small>
      </button>

      <div aria-hidden="true" className="farm-control-hints">
        <span>点击 · 移动 / 使用工具</span>
        <span>长按 · 查看状态</span>
        <span>Buddy 会自主照料农场</span>
      </div>

      {activePanel ? (
        <aside aria-label="农场功能面板" className="farm-side-panel">
          <header>
            <strong>
              {activePanel === "inventory"
                ? "背包"
                : activePanel === "map"
                  ? "世界地图"
                  : activePanel === "diary"
                    ? "农场日记"
                    : activePanel === "wardrobe"
                      ? "装扮"
                      : "设置"}
            </strong>
            <button
              aria-label="关闭"
              onClick={() => setActivePanel(null)}
              type="button"
            >
              <X weight="bold" />
            </button>
          </header>
          {activePanel === "inventory" ? (
            <div className="farm-panel-grid">
              {crops.slice(0, 4).map((crop) => (
                <article key={crop.id}>
                  <img alt="" src={crop.image} />
                  <strong>{crop.name}</strong>
                  <span>
                    {snapshot.garden.inventory.find(
                      (item) => item.cropId === crop.id,
                    )?.quantity ?? 0}
                  </span>
                </article>
              ))}
            </div>
          ) : activePanel === "map" ? (
            <div className="farm-world-map">
              <span>
                <TreeEvergreen weight="fill" />
                森林 <small>未开放</small>
              </span>
              <span>
                <Plant weight="fill" />
                农场 <small>当前位置</small>
              </span>
              <span>
                <Fish weight="fill" />
                河流 <small>可探索</small>
              </span>
              <span>
                <MapTrifold weight="fill" />
                小镇 <small>未开放</small>
              </span>
            </div>
          ) : activePanel === "diary" ? (
            <div className="farm-diary-preview">
              <CalendarDots weight="fill" />
              <strong>
                {new Intl.DateTimeFormat("zh-CN", {
                  month: "long",
                  day: "numeric",
                }).format(clock)}
              </strong>
              <p>
                {snapshot.diaries.at(0)?.content ??
                  "今天我们一起巡视了农场。土地很安静，但新的故事正在慢慢发芽。"}
              </p>
            </div>
          ) : (
            <div className="farm-coming-soon">
              {activePanel === "wardrobe" ? (
                <TShirt weight="fill" />
              ) : (
                <GearSix weight="fill" />
              )}
              <strong>
                {activePanel === "wardrobe" ? "农场装扮" : "农场设置"}
              </strong>
              <p>
                {activePanel === "wardrobe"
                  ? "后续可以为 Buddy 更换农场服装和工具外观。"
                  : "声音、模型和本地数据设置仍保存在 Home 设置中。"}
              </p>
            </div>
          )}
        </aside>
      ) : null}
    </section>
  );
}
