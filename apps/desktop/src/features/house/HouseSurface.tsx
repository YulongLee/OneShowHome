import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import buddyIdle from "../../assets/house/buddy-idle.png";
import buddyWave from "../../assets/house/buddy-wave.png";
import cottageExterior from "../../assets/house/cottage-exterior.png";
import { getTimeOfDay } from "../../lib/time";
import { moveHouse, showHome } from "../../platform/desktop";
import { loadDesktopSnapshot } from "../../services/desktop-store";

export function HouseSurface() {
  const timeOfDay = useMemo(() => getTimeOfDay(new Date()), []);
  const [error, setError] = useState<string | null>(null);
  const [isEntering, setIsEntering] = useState(false);
  const [buddyPose, setBuddyPose] = useState<"idle" | "wave">("idle");
  const [buddyName, setBuddyName] = useState("Buddy");
  const [buddyActivity, setBuddyActivity] = useState("idle");
  const greetingTimer = useRef<number | null>(null);
  const dragDelay = useRef<number | null>(null);
  const dragState = useRef({
    armed: false,
    dragging: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
  });

  const run = async (operation: () => Promise<void>) => {
    setError(null);
    try {
      await operation();
    } catch {
      setError("小屋暂时没有响应，请稍后再试。 ");
    }
  };

  const enterHome = () => {
    if (isEntering) return;
    setIsEntering(true);
    window.setTimeout(() => {
      void run(showHome).finally(() => setIsEntering(false));
    }, 520);
  };

  const greet = useCallback(() => {
    if (greetingTimer.current) window.clearTimeout(greetingTimer.current);
    setBuddyPose("wave");
    greetingTimer.current = window.setTimeout(() => {
      setBuddyPose("idle");
    }, 1900);
  }, []);

  useEffect(() => {
    void loadDesktopSnapshot()
      .then((snapshot) => {
        if (snapshot.profile) setBuddyName(snapshot.profile.name);
        if (snapshot.state) setBuddyActivity(snapshot.state.activity);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (buddyActivity === "sleeping") return;
    const greetingInterval = window.setInterval(greet, 9000);
    return () => {
      window.clearInterval(greetingInterval);
      if (greetingTimer.current) window.clearTimeout(greetingTimer.current);
      if (dragDelay.current) window.clearTimeout(dragDelay.current);
    };
  }, [buddyActivity, greet]);

  const clearDragDelay = () => {
    if (!dragDelay.current) return;
    window.clearTimeout(dragDelay.current);
    dragDelay.current = null;
  };

  const startNativeDrag = () => {
    if (!dragState.current.armed || dragState.current.dragging) return;
    clearDragDelay();
    dragState.current.dragging = true;
    void run(moveHouse).finally(() => {
      dragState.current.armed = false;
    });
  };

  return (
    <main
      className={`house-surface house-surface--${timeOfDay}${isEntering ? " is-entering" : ""}`}
    >
      <button
        aria-label="进入 OneShow Home"
        className="house-entry"
        disabled={isEntering}
        onClick={(event) => {
          if (event.detail === 0) enterHome();
        }}
        onPointerCancel={() => {
          clearDragDelay();
          dragState.current.armed = false;
        }}
        onPointerDown={(event) => {
          if (event.button !== 0 || isEntering) return;
          dragState.current = {
            armed: true,
            dragging: false,
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
          };
          if ("setPointerCapture" in event.currentTarget) {
            event.currentTarget.setPointerCapture(event.pointerId);
          }
          dragDelay.current = window.setTimeout(startNativeDrag, 180);
        }}
        onPointerEnter={greet}
        onPointerMove={(event) => {
          if (!dragState.current.armed || dragState.current.dragging) return;
          const distance = Math.hypot(
            event.clientX - dragState.current.startX,
            event.clientY - dragState.current.startY,
          );
          if (distance >= 5) startNativeDrag();
        }}
        onPointerUp={(event) => {
          if (!dragState.current.armed) return;
          clearDragDelay();
          if (
            "hasPointerCapture" in event.currentTarget &&
            event.currentTarget.hasPointerCapture(event.pointerId)
          ) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          const wasDragging = dragState.current.dragging;
          dragState.current.armed = false;
          if (!wasDragging) enterHome();
        }}
        title="轻点回家，按住小屋即可拖动"
        type="button"
      >
        <span className="house-composition">
          <img
            alt="一座亮着暖灯的微缩小屋"
            className="cottage-exterior"
            draggable="false"
            src={cottageExterior}
          />
          <span
            aria-label={`${buddyName} 正在${buddyActivity === "sleeping" ? "睡觉" : buddyPose === "wave" ? "向你招手" : "休息"}`}
            className="buddy-stage"
          >
            <img
              alt=""
              aria-hidden="true"
              className={`buddy-sprite buddy-sprite--idle${buddyPose === "idle" ? " is-active" : ""}`}
              draggable="false"
              src={buddyIdle}
            />
            <img
              alt=""
              aria-hidden="true"
              className={`buddy-sprite buddy-sprite--wave${buddyPose === "wave" ? " is-active" : ""}`}
              draggable="false"
              src={buddyWave}
            />
          </span>
          <span
            aria-hidden="true"
            className={`buddy-callout${buddyPose === "wave" || buddyActivity === "sleeping" ? " is-visible" : ""}`}
          >
            {buddyActivity === "sleeping" ? "Zzz…" : "你好呀"}
          </span>
        </span>
        <span className="house-hint">轻点回家 · 按住拖动</span>
      </button>

      {error ? (
        <p aria-live="polite" className="house-error" role="status">
          {error}
        </p>
      ) : null}
    </main>
  );
}
