import { Check, CheckCircle, Leaf, ListChecks, X } from "@phosphor-icons/react";
import { useState } from "react";
import {
  claimDailyTask,
  type DesktopSnapshot,
} from "../../services/desktop-store";

export function DailyTaskBoard({
  snapshot,
  onSnapshot,
  onNotice,
}: {
  snapshot: DesktopSnapshot;
  onSnapshot: (snapshot: DesktopSnapshot) => void;
  onNotice: (message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const completed = snapshot.dailyTasks.filter(
    (task) => task.progress >= task.target,
  ).length;

  if (!open) {
    return (
      <button
        aria-label="打开今日任务"
        className="task-board-toggle"
        onClick={() => setOpen(true)}
        type="button"
      >
        <ListChecks weight="fill" />
        <span>
          {completed}/{snapshot.dailyTasks.length}
        </span>
      </button>
    );
  }

  return (
    <aside aria-label="今日任务" className="daily-task-board">
      <header>
        <div>
          <span>
            <ListChecks weight="fill" />
          </span>
          <div>
            <small>今日小事</small>
            <strong>
              {completed}/{snapshot.dailyTasks.length} 已完成
            </strong>
          </div>
        </div>
        <button
          aria-label="收起今日任务"
          onClick={() => setOpen(false)}
          type="button"
        >
          <X />
        </button>
      </header>
      <div className="task-progress-track">
        <span
          style={{
            width: `${snapshot.dailyTasks.length ? (completed / snapshot.dailyTasks.length) * 100 : 0}%`,
          }}
        />
      </div>
      <div className="task-list">
        {snapshot.dailyTasks.map((task) => {
          const done = task.progress >= task.target;
          return (
            <article
              className={`${done ? "is-done" : ""}${task.claimed ? " is-claimed" : ""}`}
              key={task.id}
            >
              <span className="task-check">
                {done ? <Check weight="bold" /> : task.progress}
              </span>
              <div>
                <strong>{task.title}</strong>
                <small>{task.description}</small>
                <span>
                  {Math.min(task.progress, task.target)}/{task.target}
                </span>
              </div>
              {done && !task.claimed ? (
                <button
                  disabled={claiming === task.id}
                  onClick={() => {
                    setClaiming(task.id);
                    void claimDailyTask(task.id)
                      .then((next) => {
                        onSnapshot(next);
                        onNotice(`领取了 ${task.reward} 枚叶子。`);
                      })
                      .catch(() => onNotice("奖励暂时没有领取成功。 "))
                      .finally(() => setClaiming(null));
                  }}
                  type="button"
                >
                  <Leaf weight="fill" />+{task.reward}
                </button>
              ) : task.claimed ? (
                <CheckCircle className="claimed-mark" weight="fill" />
              ) : (
                <em>
                  <Leaf weight="fill" />
                  {task.reward}
                </em>
              )}
            </article>
          );
        })}
      </div>
      <footer>
        <span>
          <Leaf weight="fill" /> {snapshot.homeProgress.leafPoints}
        </span>
        <small>陪伴 {snapshot.homeProgress.activeDays} 天</small>
      </footer>
    </aside>
  );
}
