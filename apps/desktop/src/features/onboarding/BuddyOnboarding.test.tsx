import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createDesktopBuddy } from "../../services/desktop-store";
import { BuddyOnboarding } from "./BuddyOnboarding";

vi.mock("../../services/desktop-store", () => ({
  createDesktopBuddy: vi.fn(),
}));

describe("BuddyOnboarding", () => {
  it("creates the selected Buddy locally", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    const snapshot = {
      profile: {
        name: "Sora",
        avatarId: "sora" as const,
        personality: "quiet" as const,
        createdAt: 1,
      },
      state: {
        mood: "happy" as const,
        energy: 80,
        location: "living_room" as const,
        activity: "idle" as const,
        updatedAt: 1,
      },
      memories: [],
      diaries: [],
      gallery: [],
      dailyTasks: [],
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
    vi.mocked(createDesktopBuddy).mockResolvedValue(snapshot);
    render(<BuddyOnboarding onCreated={onCreated} />);

    const input = screen.getByRole("textbox", { name: "它叫什么名字？" });
    await user.clear(input);
    await user.type(input, "Sora");
    await user.click(screen.getByRole("button", { name: /Sora/ }));
    await user.click(screen.getByRole("button", { name: /沉静/ }));
    await user.click(screen.getByRole("button", { name: "住进 OneShow Home" }));

    expect(createDesktopBuddy).toHaveBeenCalledWith("Sora", "sora", "quiet");
    expect(onCreated).toHaveBeenCalledWith(snapshot);
  });
});
