import { useMemo, useState } from "react";
import cottageExterior from "../../assets/house/cottage-exterior.png";
import { getTimeOfDay } from "../../lib/time";
import { moveHouse, showHome } from "../../platform/desktop";

export function HouseSurface() {
  const timeOfDay = useMemo(() => getTimeOfDay(new Date()), []);
  const [error, setError] = useState<string | null>(null);
  const [isEntering, setIsEntering] = useState(false);

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

  return (
    <main
      className={`house-surface house-surface--${timeOfDay}${isEntering ? " is-entering" : ""}`}
    >
      <button
        aria-label="拖动桌面小屋"
        className="house-move-handle"
        onPointerDown={(event) => {
          if (event.button === 0) {
            void run(moveHouse);
          }
        }}
        type="button"
      >
        <span />
        <span />
        <span />
      </button>

      <button
        aria-label="进入 OneShow Home"
        className="house-entry"
        disabled={isEntering}
        onClick={enterHome}
        type="button"
      >
        <img
          alt="一座亮着暖灯、Buddy 坐在门前的微缩小屋"
          className="cottage-exterior"
          draggable="false"
          src={cottageExterior}
        />
        <span className="house-hint">点击回家</span>
      </button>

      {error ? (
        <p aria-live="polite" className="house-error" role="status">
          {error}
        </p>
      ) : null}
    </main>
  );
}
