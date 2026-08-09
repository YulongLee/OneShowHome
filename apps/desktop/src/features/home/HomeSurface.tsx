import { useState } from "react";
import { HouseIllustration } from "../../components/HouseIllustration";
import { getTimeOfDay } from "../../lib/time";
import { hideHome, showHouse } from "../../platform/desktop";

const validations = [
  { label: "透明桌面小屋", note: "独立窗口", state: "ready" },
  { label: "点击进入 Home", note: "双窗口联动", state: "ready" },
  { label: "位置自动恢复", note: "本地保存", state: "ready" },
] as const;

export function HomeSurface() {
  const [message, setMessage] = useState<string | null>(null);
  const timeOfDay = getTimeOfDay(new Date());

  const run = async (
    operation: () => Promise<void>,
    successMessage?: string,
  ) => {
    setMessage(null);
    try {
      await operation();
      if (successMessage) {
        setMessage(successMessage);
      }
    } catch {
      setMessage("操作暂时没有完成，请稍后再试。");
    }
  };

  return (
    <main className="home-shell">
      <section className="home-hero">
        <header className="home-topbar">
          <div className="brand-lockup">
            <span className="brand-mark">O</span>
            <span>OneShow Home</span>
          </div>
          <span className="phase-badge">Phase 0 · 本地原型</span>
        </header>

        <div className="hero-content">
          <div className="hero-copy">
            <span className="eyebrow">A quiet place on your Mac</span>
            <h1>
              你的小屋，
              <br />
              正在慢慢醒来。
            </h1>
            <p>
              这是 OneShow Home
              的桌面体验验证版本。现在先把“住在电脑里”这件事做好，Buddy
              会在下一阶段搬进来。
            </p>
            <div className="hero-actions">
              <button
                className="primary-action"
                onClick={() =>
                  void run(showHouse, "桌面小屋已经显示在你的工作空间中。")
                }
                type="button"
              >
                找到桌面小屋
              </button>
              <button
                className="secondary-action"
                onClick={() => void run(hideHome)}
                type="button"
              >
                回到桌面
              </button>
            </div>
            {message ? (
              <p aria-live="polite" className="action-message" role="status">
                {message}
              </p>
            ) : null}
          </div>

          <div className={`home-preview home-preview--${timeOfDay}`}>
            <span className="preview-label">
              {timeOfDay === "day" ? "白天的小屋" : "夜晚的小屋"}
            </span>
            <HouseIllustration timeOfDay={timeOfDay} />
            <span className="preview-ground" />
          </div>
        </div>
      </section>

      <section aria-labelledby="validation-title" className="validation-panel">
        <div className="validation-heading">
          <div>
            <span className="eyebrow">Technical validation</span>
            <h2 id="validation-title">桌面体验骨架</h2>
          </div>
          <p>不接入 AI，不保存对话，不读取任何桌面内容。</p>
        </div>

        <div className="validation-grid">
          {validations.map((item, index) => (
            <article className="validation-card" key={item.label}>
              <span className="validation-index">0{index + 1}</span>
              <div>
                <h3>{item.label}</h3>
                <p>{item.note}</p>
              </div>
              <span aria-label="已实现" className="ready-dot" />
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
