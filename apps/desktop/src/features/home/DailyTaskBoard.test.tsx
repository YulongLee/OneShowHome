import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  claimDailyTask,
  type DesktopSnapshot,
} from "../../services/desktop-store";
import { DailyTaskBoard } from "./DailyTaskBoard";

vi.mock("../../services/desktop-store", () => ({ claimDailyTask: vi.fn() }));

const snapshot: DesktopSnapshot = {
  profile: null,
  state: null,
  memories: [],
  diaries: [],
  gallery: [],
  dailyTasks: [
    {
      id: "today-read",
      action: "read",
      title: "午后阅读",
      description: "读一次书",
      target: 1,
      progress: 1,
      reward: 12,
      claimed: false,
    },
  ],
  objectStates: [],
  homeProgress: { leafPoints: 0, activeDays: 0 },
  garden: {
    plots: [],
    inventory: [],
    level: 1,
    xp: 0,
    nextLevelXp: 60,
  },
  settings: { soundEnabled: true },
};

describe("DailyTaskBoard", () => {
  it("opens and claims a completed task reward", async () => {
    const user = userEvent.setup();
    const claimed = {
      ...snapshot,
      dailyTasks: [{ ...snapshot.dailyTasks[0]!, claimed: true }],
      homeProgress: { leafPoints: 12, activeDays: 1 },
    };
    vi.mocked(claimDailyTask).mockResolvedValue(claimed);
    const onSnapshot = vi.fn();
    render(
      <DailyTaskBoard
        onNotice={vi.fn()}
        onSnapshot={onSnapshot}
        snapshot={snapshot}
      />,
    );

    await user.click(screen.getByRole("button", { name: "打开今日任务" }));
    await user.click(screen.getByRole("button", { name: "+12" }));

    expect(claimDailyTask).toHaveBeenCalledWith("today-read");
    expect(onSnapshot).toHaveBeenCalledWith(claimed);
  });
});
