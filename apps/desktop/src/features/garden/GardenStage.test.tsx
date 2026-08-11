import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DesktopSnapshot } from "../../services/desktop-store";
import { GardenStage } from "./GardenStage";

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
  it("walks Buddy toward a clicked map position before settling", async () => {
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
      name: "点击农场地面移动 Buddy",
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

    const buddy = container.querySelector(".farm-buddy");
    expect(buddy).toHaveClass("is-moving", "is-facing-right");
    expect(buddy).toHaveStyle({ left: "72%", top: "62.5%" });
    expect(container.querySelector(".farm-buddy-walk-cycle")).not.toBeNull();
    expect(onBuddyLine).toHaveBeenCalledWith("我过去看看，等我一下。");

    await act(async () => vi.advanceTimersByTimeAsync(2_000));
    expect(buddy).not.toHaveClass("is-moving");
    expect(container.querySelector(".farm-buddy-walk-cycle")).toBeNull();
    expect(onBuddyLine).toHaveBeenLastCalledWith(
      "到了。这里的风景好像也有一点不一样。",
    );
  });
});
