import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DesktopSnapshot } from "../../services/desktop-store";
import { GardenStage } from "./GardenStage";
import { isFarmPointWalkable } from "./farm-world-engine";

vi.mock("../../services/desktop-store", () => ({
  feedFarmAnimal: vi.fn(),
  fishAtPond: vi.fn(),
  harvestGardenPlot: vi.fn(),
  plantGardenCrop: vi.fn(),
  waterGardenPlot: vi.fn(),
}));

const snapshot: DesktopSnapshot = {
  profile: null,
  state: null,
  memories: [],
  diaries: [],
  gallery: [],
  dailyTasks: [],
  objectStates: [],
  homeProgress: { leafPoints: 0, activeDays: 0 },
  garden: {
    plots: [1, 2, 3, 4].map((plotId) => ({
      plotId,
      cropId: null,
      plantedAt: null,
      readyAt: null,
      wateredAt: null,
      waterCount: 0,
    })),
    inventory: [],
    level: 1,
    xp: 0,
    nextLevelXp: 60,
    animals: [
      { animalId: "momo", kind: "cow", affection: 0, lastFedDate: null },
      { animalId: "yuki", kind: "sheep", affection: 0, lastFedDate: null },
      { animalId: "koko", kind: "chicken", affection: 0, lastFedDate: null },
    ],
    fishInventory: [],
    lastFishedAt: null,
  },
  settings: { soundEnabled: true },
};

afterEach(() => vi.useRealTimers());

describe("GardenStage game movement", () => {
  it("opens the game inventory and exposes the farm toolbelt", () => {
    render(
      <GardenStage
        onBuddyLine={vi.fn()}
        onNotice={vi.fn()}
        onSnapshot={vi.fn()}
        snapshot={snapshot}
      />,
    );

    expect(screen.getByRole("button", { name: "浇水壶" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "背包" }));
    expect(
      screen.getByRole("complementary", { name: "农场功能面板" }),
    ).toHaveTextContent("番茄");
    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    expect(
      screen.queryByRole("complementary", { name: "农场功能面板" }),
    ).toBeNull();
  });

  it("routes the player around collisions before settling", async () => {
    vi.useFakeTimers();
    const onBuddyLine = vi.fn();
    const { container } = render(
      <GardenStage
        onBuddyLine={onBuddyLine}
        onNotice={vi.fn()}
        onSnapshot={vi.fn()}
        snapshot={snapshot}
      />,
    );
    const walkLayer = screen.getByRole("button", {
      name: "点击农场地面移动角色",
    });
    vi.spyOn(walkLayer, "getBoundingClientRect").mockReturnValue({
      bottom: 800,
      height: 800,
      left: 0,
      right: 1000,
      top: 0,
      width: 1000,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.pointerDown(walkLayer, {
      button: 0,
      clientX: 800,
      clientY: 500,
    });

    const player = container.querySelector<HTMLElement>(".farm-player");
    expect(player).toHaveClass("is-moving");
    expect(container.querySelector(".farm-player-walk-cycle")).not.toBeNull();
    expect(onBuddyLine).toHaveBeenCalledWith(
      "你先过去，我会在农场里做自己的事情。",
    );

    await act(async () => vi.advanceTimersByTimeAsync(10_000));
    expect(player).not.toHaveClass("is-moving");
    expect(container.querySelector(".farm-player-walk-cycle")).toBeNull();
    expect(
      isFarmPointWalkable({
        left: Number.parseFloat(player?.style.left ?? "0"),
        top: Number.parseFloat(player?.style.top ?? "0"),
      }),
    ).toBe(true);
    expect(onBuddyLine).toHaveBeenLastCalledWith(
      "你到了。需要帮忙时，随时叫我。",
    );
  });
});
