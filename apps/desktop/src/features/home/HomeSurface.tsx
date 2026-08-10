import {
  ArrowRight,
  Bed,
  BookOpenText,
  Brain,
  ChatCircleDots,
  CloudMoon,
  CookingPot,
  FlowerLotus,
  GearSix,
  Heart,
  House,
  Images,
  Smiley,
  Sparkle,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import buddyAvatar from "../../assets/house/buddy-avatar.png";
import doorwayScene from "../../assets/house/cottage-doorway.png";
import livingRoomScene from "../../assets/house/living-room.png";
import { hideHome, onHomeEntry, showHouse } from "../../platform/desktop";

const rooms = [
  { label: "客厅", icon: House, available: true },
  { label: "厨房", icon: CookingPot, available: false },
  { label: "卧室", icon: Bed, available: false },
  { label: "花园", icon: FlowerLotus, available: false },
] as const;

const quickActions = [
  { label: "日记", icon: BookOpenText },
  { label: "记忆", icon: Brain },
  { label: "相册", icon: Images },
  { label: "设置", icon: GearSix },
] as const;

export function HomeSurface() {
  const [isEntering, setIsEntering] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [chat, setChat] = useState("");
  const [buddyLine, setBuddyLine] = useState("欢迎回家，今晚想和我聊聊吗？");
  const transitionTimer = useRef<number | null>(null);

  useEffect(() => {
    let disposed = false;
    let stopListening: (() => void) | undefined;

    void onHomeEntry(() => {
      setIsEntering(true);
      if (transitionTimer.current) window.clearTimeout(transitionTimer.current);
      transitionTimer.current = window.setTimeout(() => {
        setIsEntering(false);
      }, 1850);
    })
      .then((unlisten) => {
        if (disposed) unlisten();
        else stopListening = unlisten;
      })
      .catch(() => undefined);

    return () => {
      disposed = true;
      stopListening?.();
      if (transitionTimer.current) window.clearTimeout(transitionTimer.current);
    };
  }, []);

  const returnToDesktop = async () => {
    setNotice(null);
    try {
      await showHouse();
      await hideHome();
    } catch {
      setNotice("暂时无法返回桌面，请稍后再试。");
    }
  };

  const submitChat = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = chat.trim();
    if (!content) return;
    setChat("");
    setBuddyLine(`我听到了：“${content}”。等聊天能力接入后，我会认真记住。`);
  };

  return (
    <main className="home-shell">
      <img
        alt="温暖的 OneShow Home 客厅"
        className="home-scene"
        src={livingRoomScene}
      />
      <div aria-hidden="true" className="scene-shade" />

      <header className="home-titlebar">
        <div className="brand-lockup">
          <span className="brand-mark">
            <House weight="fill" />
          </span>
          <span>OneShow Home</span>
          <span className="home-kicker">欢迎回家</span>
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
        <img alt="Milo" className="buddy-avatar" src={buddyAvatar} />
        <div>
          <strong>Milo</strong>
          <span>
            <Heart weight="fill" /> 心情很好 · 精力 80%
          </span>
        </div>
      </section>

      <nav aria-label="房间导航" className="room-rail">
        {rooms.map(({ available, icon: Icon, label }) => (
          <button
            aria-label={available ? `${label}（当前）` : `${label}（即将开放）`}
            className={available ? "room-button is-active" : "room-button"}
            key={label}
            onClick={() =>
              setNotice(
                available ? "你正在客厅。" : `${label}会在下一阶段开放。`,
              )
            }
            type="button"
          >
            <Icon weight={available ? "fill" : "regular"} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <section aria-label="时间与天气" className="weather-card">
        <div>
          <span>周日</span>
          <strong>20:30</strong>
        </div>
        <div>
          <CloudMoon weight="fill" />
          <span>18°C · 晴</span>
        </div>
      </section>

      <aside aria-label="快捷功能" className="quick-rail">
        {quickActions.map(({ icon: Icon, label }) => (
          <button
            key={label}
            onClick={() => setNotice(`${label}功能将在后续阶段开放。`)}
            type="button"
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </aside>

      <section aria-live="polite" className="buddy-bubble">
        <Smiley weight="fill" />
        <p>{buddyLine}</p>
      </section>

      <form className="chat-dock" onSubmit={submitChat}>
        <ChatCircleDots aria-hidden="true" />
        <label className="sr-only" htmlFor="buddy-chat">
          和 Buddy 聊聊
        </label>
        <input
          id="buddy-chat"
          onChange={(event) => setChat(event.target.value)}
          placeholder="和 Buddy 聊聊…"
          value={chat}
        />
        <button aria-label="发送消息" type="submit">
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
          <img alt="打开的门通向温暖客厅" src={doorwayScene} />
          <div aria-hidden="true" className="entry-warmth" />
          <span>
            <Sparkle weight="fill" />
            回家了
          </span>
        </div>
      ) : null}
    </main>
  );
}
