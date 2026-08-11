import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { hideHome, onHomeEntry, showHouse } from "../../platform/desktop";
import { HomeSurface } from "./HomeSurface";
import { sendConfiguredBuddyMessage } from "../../services/model-runtime";
import {
  applyBuddyAction,
  changeBuddyRoom,
  loadDesktopSnapshot,
} from "../../services/desktop-store";

vi.mock("../../platform/desktop", () => ({
  hideHome: vi.fn(),
  onHomeEntry: vi.fn(),
  showHouse: vi.fn(),
}));

vi.mock("../../services/model-runtime", () => ({
  loadModelSettings: vi.fn(() => ({
    mode: "official",
    local: {
      provider: "ollama",
      baseUrl: "http://127.0.0.1:11434/v1",
      modelId: "",
    },
  })),
  sendConfiguredBuddyMessage: vi.fn(),
  saveModelSettings: vi.fn(),
  testLocalModel: vi.fn(),
  clearLocalConversation: vi.fn(),
}));

vi.mock("../../services/desktop-store", () => ({
  loadDesktopSnapshot: vi.fn(),
  applyBuddyAction: vi.fn(),
  changeBuddyRoom: vi.fn(),
  addDesktopMemory: vi.fn(),
  deleteDesktopMemory: vi.fn(),
  generateDesktopDiary: vi.fn(),
  deleteDesktopDiary: vi.fn(),
  importGalleryPhoto: vi.fn(),
  deleteGalleryPhoto: vi.fn(),
  galleryPhotoUrl: vi.fn((path: string) => path),
  setDesktopSound: vi.fn(),
  exportDesktopData: vi.fn(),
  clearDesktopData: vi.fn(),
  quitDesktopApp: vi.fn(),
  readAutostart: vi.fn(() => Promise.resolve(false)),
  writeAutostart: vi.fn(),
}));

const snapshot = {
  profile: {
    name: "Milo",
    avatarId: "milo" as const,
    personality: "warm" as const,
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
  },
  settings: { soundEnabled: true },
};

describe("HomeSurface", () => {
  beforeEach(() => {
    vi.mocked(showHouse).mockResolvedValue(undefined);
    vi.mocked(hideHome).mockResolvedValue(undefined);
    vi.mocked(onHomeEntry).mockResolvedValue(vi.fn());
    vi.mocked(sendConfiguredBuddyMessage).mockResolvedValue(
      "辛苦了，先在沙发上休息一会儿吧。",
    );
    vi.mocked(loadDesktopSnapshot).mockResolvedValue(snapshot);
    vi.mocked(applyBuddyAction).mockResolvedValue(snapshot);
    vi.mocked(changeBuddyRoom).mockResolvedValue(snapshot);
  });

  it("shows the living room controls and Buddy welcome", async () => {
    render(<HomeSurface />);

    expect(
      await screen.findByRole("navigation", { name: "房间导航" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("我在这里等你。今天想一起做点什么？"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "和 Buddy 聊聊" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "厨房" })).toBeEnabled();
  });

  it("changes rooms and runs a Buddy interaction", async () => {
    const user = userEvent.setup();
    vi.mocked(changeBuddyRoom).mockResolvedValueOnce({
      ...snapshot,
      state: { ...snapshot.state, location: "kitchen", activity: "cooking" },
    });
    render(<HomeSurface />);

    await user.click(await screen.findByRole("button", { name: "厨房" }));
    expect(changeBuddyRoom).toHaveBeenCalledWith("kitchen");

    await user.click(
      await screen.findByRole("button", { name: "炉灶：做一道暖心料理" }),
    );
    expect(applyBuddyAction).toHaveBeenCalledWith("cook");
  });

  it("returns to the desktop house", async () => {
    const user = userEvent.setup();
    render(<HomeSurface />);

    await user.click(
      await screen.findByRole("button", { name: "返回桌面小屋" }),
    );

    expect(showHouse).toHaveBeenCalledOnce();
    expect(hideHome).toHaveBeenCalledOnce();
  });

  it("opens the Buddy model settings from the quick rail", async () => {
    const user = userEvent.setup();
    render(<HomeSurface />);

    await user.click(await screen.findByRole("button", { name: "设置" }));
    await user.click(screen.getByRole("button", { name: "配置模型" }));

    expect(
      screen.getByRole("dialog", { name: "Buddy 的大脑" }),
    ).toBeInTheDocument();
    expect(screen.getByText("OneShow 官方模型")).toBeInTheDocument();
    expect(screen.getByText("这台 Mac 的本地模型")).toBeInTheDocument();
  });

  it("shows the reply returned by the Buddy backend", async () => {
    const user = userEvent.setup();
    render(<HomeSurface />);

    await user.type(
      await screen.findByRole("textbox", { name: "和 Buddy 聊聊" }),
      "今天有点累",
    );
    await user.click(screen.getByRole("button", { name: "发送消息" }));

    expect(sendConfiguredBuddyMessage).toHaveBeenCalledWith("今天有点累", {
      name: "Milo",
      personality: "warm",
    });
    expect(await screen.findByText(/先在沙发上休息/)).toBeInTheDocument();
  });
});
