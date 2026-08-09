import { useMemo, useState } from "react";
import { HouseIllustration } from "../../components/HouseIllustration";
import { getTimeOfDay } from "../../lib/time";
import { moveHouse, showHome } from "../../platform/desktop";

export function HouseSurface() {
  const timeOfDay = useMemo(() => getTimeOfDay(new Date()), []);
  const [error, setError] = useState<string | null>(null);

  const run = async (operation: () => Promise<void>) => {
    setError(null);
    try {
      await operation();
    } catch {
      setError("小屋暂时没有响应，请稍后再试。 ");
    }
  };

  return (
    <main className={`house-surface house-surface--${timeOfDay}`}>
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
        onClick={() => void run(showHome)}
        type="button"
      >
        <span className="house-aura" />
        <HouseIllustration timeOfDay={timeOfDay} />
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
