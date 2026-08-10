import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { hideHome, onHomeEntry, showHouse } from "../../platform/desktop";
import { HomeSurface } from "./HomeSurface";
import { sendConfiguredBuddyMessage } from "../../services/model-runtime";

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

describe("HomeSurface", () => {
  beforeEach(() => {
    vi.mocked(showHouse).mockResolvedValue(undefined);
    vi.mocked(hideHome).mockResolvedValue(undefined);
    vi.mocked(onHomeEntry).mockResolvedValue(vi.fn());
    vi.mocked(sendConfiguredBuddyMessage).mockResolvedValue(
      "辛苦了，先在沙发上休息一会儿吧。",
    );
  });

  it("shows the living room controls and Buddy welcome", () => {
    render(<HomeSurface />);

    expect(
      screen.getByRole("navigation", { name: "房间导航" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("欢迎回家，今晚想和我聊聊吗？"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "和 Buddy 聊聊" }),
    ).toBeInTheDocument();
  });

  it("returns to the desktop house", async () => {
    const user = userEvent.setup();
    render(<HomeSurface />);

    await user.click(screen.getByRole("button", { name: "返回桌面小屋" }));

    expect(showHouse).toHaveBeenCalledOnce();
    expect(hideHome).toHaveBeenCalledOnce();
  });

  it("opens the Buddy model settings from the quick rail", async () => {
    const user = userEvent.setup();
    render(<HomeSurface />);

    await user.click(screen.getByRole("button", { name: "设置" }));

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
      screen.getByRole("textbox", { name: "和 Buddy 聊聊" }),
      "今天有点累",
    );
    await user.click(screen.getByRole("button", { name: "发送消息" }));

    expect(sendConfiguredBuddyMessage).toHaveBeenCalledWith("今天有点累");
    expect(await screen.findByText(/先在沙发上休息/)).toBeInTheDocument();
  });
});
