import {
  ArrowRight,
  Bed,
  BookOpenText,
  Brain,
  ChatCircleDots,
  CookingPot,
  FlowerLotus,
  GearSix,
  Heart,
  House,
  Images,
  MoonStars,
  Smiley,
  Sparkle,
  Sun,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import buddyAvatar from "../../assets/house/buddy-avatar.png";
import doorwayScene from "../../assets/house/cottage-doorway.png";
import { hideHome, onHomeEntry, showHouse } from "../../platform/desktop";
import { syncBuddyProfile } from "../../services/backend";
import {
  applyBuddyAction,
  changeBuddyRoom,
  loadDesktopSnapshot,
  type BuddyState,
  type DesktopSnapshot,
} from "../../services/desktop-store";
import {
  loadModelSettings,
  sendConfiguredBuddyMessage,
  type ModelSettings,
} from "../../services/model-runtime";
import { BuddyOnboarding } from "../onboarding/BuddyOnboarding";
import { GardenStage } from "../garden/GardenStage";
import { ModelSettingsDialog } from "../settings/ModelSettingsDialog";
import { HomeDialog, type HomeDialogKind } from "./HomeDialogs";
import { DailyTaskBoard } from "./DailyTaskBoard";
import { RoomStage, type RoomHotspot } from "./RoomStage";

const rooms: Array<{
  id: BuddyState["location"];
  label: string;
  icon: typeof House;
}> = [
  { id: "living_room", label: "客厅", icon: House },
  { id: "kitchen", label: "厨房", icon: CookingPot },
  { id: "bedroom", label: "卧室", icon: Bed },
  { id: "garden", label: "农场", icon: FlowerLotus },
];

const quickActions: Array<{
  id: HomeDialogKind;
  label: string;
  icon: typeof House;
}> = [
  { id: "diary", label: "日记", icon: BookOpenText },
  { id: "memory", label: "记忆", icon: Brain },
  { id: "gallery", label: "相册", icon: Images },
  { id: "settings", label: "设置", icon: GearSix },
];

const roomCopy = {
  living_room: { title: "客厅", note: "适合聊天、读书和休息" },
  kitchen: { title: "厨房", note: "一起准备今天的小餐点" },
  bedroom: { title: "卧室", note: "让 Buddy 安静恢复精力" },
  garden: { title: "农场", note: "种植、钓鱼，也照顾新的动物朋友" },
} as const;

const moodLabels = {
  happy: "心情很好",
  calm: "平静安心",
  tired: "有点疲惫",
} as const;
const activityLines = {
  idle: "我在这里等你。今天想一起做点什么？",
  reading: "这里很安静，正好可以一起读几页书。",
  cooking: "厨房里有暖暖的香气，要一起准备晚餐吗？",
  sleeping: "我先安静睡一会儿，醒来再陪你。",
  gardening: "田里的植物和牧场里的朋友今天都很有精神。",
  thinking: "我在整理今天的小小心事。",
} as const;

const actionLines: Record<string, string> = {
  rest: "沙发软软的。我们就这样安静待一会儿吧。",
  read: "我找到很喜欢的一页，要不要一起读？",
  fireplace: "火光暖暖的，连今天的疲惫也慢慢融化了。",
  cook: "闻起来好香，今天的料理一定会很成功。",
  prepare: "食材准备好了，接下来就交给我吧。",
  wash: "厨房变得亮晶晶，心情也清爽起来了。",
  sleep: "晚安，我先做一个关于小屋的好梦。",
  write: "今天的心情已经好好写下来了。",
  tidy: "房间整齐以后，好像也多了一点呼吸的空间。",
  water: "你听，花儿喝到水以后好像在说谢谢。",
  harvest: "今天收获得真不错，晚上可以做新鲜料理了。",
  greenhouse: "幼苗又长高了一点点，我们明天再来看它。",
};

export function HomeSurface() {
  const [snapshot, setSnapshot] = useState<DesktopSnapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEntering, setIsEntering] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [chat, setChat] = useState("");
  const [buddyLine, setBuddyLine] = useState("欢迎回家。今天想和我聊聊吗？");
  const [isSending, setIsSending] = useState(false);
  const [dialog, setDialog] = useState<HomeDialogKind | null>(null);
  const [modelSettingsOpen, setModelSettingsOpen] = useState(false);
  const [modelSettings, setModelSettings] =
    useState<ModelSettings>(loadModelSettings);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [clock, setClock] = useState(new Date());
  const transitionTimer = useRef<number | null>(null);

  useEffect(() => {
    void loadDesktopSnapshot()
      .then((next) => {
        setSnapshot(next);
        if (next.state) setBuddyLine(activityLines[next.state.activity]);
      })
      .catch(() =>
        setLoadError("无法打开这台 Mac 上的小屋资料。请重新启动应用后再试。"),
      );
    const timer = window.setInterval(() => setClock(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let disposed = false;
    let stopListening: (() => void) | undefined;
    void onHomeEntry(() => {
      setIsEntering(true);
      if (transitionTimer.current) window.clearTimeout(transitionTimer.current);
      transitionTimer.current = window.setTimeout(
        () => setIsEntering(false),
        1850,
      );
    })
      .then((unlisten) => (disposed ? unlisten() : (stopListening = unlisten)))
      .catch(() => undefined);
    return () => {
      disposed = true;
      stopListening?.();
      if (transitionTimer.current) window.clearTimeout(transitionTimer.current);
    };
  }, []);

  const state = snapshot?.state;
  const profile = snapshot?.profile;
  const room = state?.location ?? "living_room";
  const roomInfo = roomCopy[room];
  const isNight = clock.getHours() < 7 || clock.getHours() >= 19;
  const formattedTime = useMemo(
    () =>
      new Intl.DateTimeFormat("zh-CN", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(clock),
    [clock],
  );

  const returnToDesktop = async () => {
    setNotice(null);
    try {
      await showHouse();
      await hideHome();
    } catch {
      setNotice("暂时无法返回桌面，请稍后再试。");
    }
  };

  const changeRoom = async (nextRoom: BuddyState["location"]) => {
    if (nextRoom === room) return;
    setNotice("Buddy 正在换个房间…");
    try {
      const next = await changeBuddyRoom(nextRoom);
      setSnapshot(next);
      setActiveAction(null);
      if (next.state) setBuddyLine(activityLines[next.state.activity]);
      setNotice(null);
    } catch {
      setNotice("刚才没有走到那个房间，请再试一次。");
    }
  };

  const interact = async (hotspot: RoomHotspot) => {
    if (busyAction) return;
    setActiveAction(hotspot.action);
    setBusyAction(hotspot.action);
    setBuddyLine(`让我来${hotspot.hint}…`);
    setNotice(null);
    try {
      const [next] = await Promise.all([
        applyBuddyAction(hotspot.action),
        new Promise((resolve) => window.setTimeout(resolve, 850)),
      ]);
      const newlyCompleted = next.dailyTasks.find((task) => {
        const previous = snapshot?.dailyTasks.find(
          (item) => item.id === task.id,
        );
        return (
          task.progress >= task.target &&
          (previous?.progress ?? 0) < task.target
        );
      });
      setSnapshot(next);
      setBuddyLine(
        actionLines[hotspot.action] ??
          activityLines[next.state?.activity ?? "idle"],
      );
      setNotice(
        newlyCompleted
          ? `今日任务「${newlyCompleted.title}」完成了！`
          : `${hotspot.label}的羁绊增加了。`,
      );
    } catch {
      setNotice("这次互动没有完成，请再试一次。");
    } finally {
      setBusyAction(null);
    }
  };

  const submitChat = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = chat.trim();
    if (!content || isSending) return;
    setChat("");
    setIsSending(true);
    setBuddyLine("让我想一想…");
    try {
      setBuddyLine(
        await sendConfiguredBuddyMessage(content, {
          name: profile?.name ?? "Buddy",
          personality: profile?.personality ?? "warm",
        }),
      );
    } catch {
      setBuddyLine(
        modelSettings.mode === "local"
          ? "本地模型暂时没有回应。确认它仍在运行后，再和我说一次好吗？"
          : "刚才的声音像是被风吹散了。网络恢复后，再和我说一次好吗？",
      );
    } finally {
      setIsSending(false);
    }
  };

  if (loadError)
    return (
      <main className="desktop-loading">
        <House weight="fill" />
        <h1>小屋没有打开</h1>
        <p>{loadError}</p>
        <button onClick={() => window.location.reload()} type="button">
          重新尝试
        </button>
      </main>
    );
  if (!snapshot)
    return (
      <main className="desktop-loading">
        <Sparkle weight="fill" />
        <p>正在点亮小屋的灯…</p>
      </main>
    );
  if (!profile || !state)
    return (
      <BuddyOnboarding
        onCreated={(next) => {
          setSnapshot(next);
          setBuddyLine("你好呀，我们终于见面了。以后请多多关照。");
          if (next.profile)
            void syncBuddyProfile(next.profile).catch(() => undefined);
        }}
      />
    );

  return (
    <main className={`home-shell room-${room}${isNight ? " is-night" : ""}`}>
      {room === "garden" ? (
        <GardenStage
          onBuddyLine={setBuddyLine}
          onNotice={setNotice}
          onSnapshot={setSnapshot}
          snapshot={snapshot}
        />
      ) : (
        <RoomStage
          activeAction={activeAction}
          busyAction={busyAction}
          objectStates={snapshot.objectStates}
          onInteract={(hotspot) => void interact(hotspot)}
          room={room}
          state={state}
        />
      )}

      <header className="home-titlebar">
        <div className="brand-lockup">
          <span className="brand-mark">
            <House weight="fill" />
          </span>
          <span>OneShow Home</span>
          <span className="home-kicker">
            {roomInfo.title} · {roomInfo.note}
          </span>
        </div>
        <button
          aria-label="返回桌面小屋"
          className="desktop-return"
          onClick={() => void returnToDesktop()}
          type="button"
        >
          返回桌面
        </button>
      </header>

      <section aria-label="Buddy 状态" className="buddy-status">
        <img
          alt={profile.name}
          className={`buddy-avatar avatar-${profile.avatarId}`}
          src={buddyAvatar}
        />
        <div>
          <strong>{profile.name}</strong>
          <span>
            <Heart weight="fill" /> {moodLabels[state.mood]} · 精力{" "}
            {state.energy}%
          </span>
        </div>
      </section>

      <nav aria-label="房间导航" className="room-rail">
        {rooms.map(({ id, icon: Icon, label }) => (
          <button
            aria-label={id === room ? `${label}（当前）` : label}
            className={id === room ? "room-button is-active" : "room-button"}
            key={id}
            onClick={() => void changeRoom(id)}
            type="button"
          >
            <Icon weight={id === room ? "fill" : "regular"} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <section aria-label="本地时间" className="weather-card">
        <div>
          <span>{formattedTime.split(" ")[0]}</span>
          <strong>{formattedTime.split(" ").slice(1).join(" ")}</strong>
        </div>
        <div>
          {isNight ? <MoonStars weight="fill" /> : <Sun weight="fill" />}
          <span>{isNight ? "夜晚" : "白天"} · 本地时间</span>
        </div>
      </section>

      <aside aria-label="快捷功能" className="quick-rail">
        {quickActions.map(({ id, icon: Icon, label }) => (
          <button
            aria-label={label}
            key={id}
            onClick={() => setDialog(id)}
            type="button"
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </aside>

      <DailyTaskBoard
        onNotice={setNotice}
        onSnapshot={setSnapshot}
        snapshot={snapshot}
      />

      <section aria-live="polite" className="buddy-bubble">
        <Smiley weight="fill" />
        <p>{buddyLine}</p>
      </section>

      <form className="chat-dock" onSubmit={submitChat}>
        <ChatCircleDots aria-hidden="true" />
        <span className={`model-source ${modelSettings.mode}`}>
          {modelSettings.mode === "local" ? "本地" : "官方"}
        </span>
        <label className="sr-only" htmlFor="buddy-chat">
          和 Buddy 聊聊
        </label>
        <input
          disabled={isSending}
          id="buddy-chat"
          onChange={(event) => setChat(event.target.value)}
          placeholder={`和 ${profile.name} 聊聊…`}
          value={chat}
        />
        <button aria-label="发送消息" disabled={isSending} type="submit">
          <ArrowRight weight="bold" />
        </button>
      </form>

      {notice ? (
        <p aria-live="polite" className="home-notice">
          {notice}
        </p>
      ) : null}
      {isEntering ? (
        <div
          aria-label="正在进入小屋"
          className="entry-transition"
          role="status"
        >
          <img alt="打开的门通向温暖小屋" src={doorwayScene} />
          <div aria-hidden="true" className="entry-warmth" />
          <span>
            <Sparkle weight="fill" />
            回家了
          </span>
        </div>
      ) : null}

      {dialog ? (
        <HomeDialog
          kind={dialog}
          onClose={() => setDialog(null)}
          onOpenModelSettings={() => {
            setDialog(null);
            setModelSettingsOpen(true);
          }}
          onReset={() => {
            setDialog(null);
            void loadDesktopSnapshot().then(setSnapshot);
          }}
          onSnapshot={setSnapshot}
          snapshot={snapshot}
        />
      ) : null}
      {modelSettingsOpen ? (
        <ModelSettingsDialog
          onClose={() => setModelSettingsOpen(false)}
          onSaved={(settings) => {
            setModelSettings(settings);
            setNotice(
              settings.mode === "local"
                ? `已切换到本地模型 ${settings.local.modelId}。`
                : "已切换到 OneShow 官方模型。",
            );
          }}
        />
      ) : null}
    </main>
  );
}
