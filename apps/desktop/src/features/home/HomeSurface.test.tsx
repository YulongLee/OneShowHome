import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { hideHome, onHomeEntry, showHouse } from "../../platform/desktop";
import { HomeSurface } from "./HomeSurface";
import { sendBuddyMessage } from "../../services/backend";

vi.mock("../../platform/desktop", () => ({
  hideHome: vi.fn(),
  onHomeEntry: vi.fn(),
  showHouse: vi.fn(),
}));

vi.mock("../../services/backend", () => ({
  sendBuddyMessage: vi.fn(),
}));

describe("HomeSurface", () => {
  beforeEach(() => {
    vi.mocked(showHouse).mockResolvedValue(undefined);
    vi.mocked(hideHome).mockResolvedValue(undefined);
    vi.mocked(onHomeEntry).mockResolvedValue(vi.fn());
    vi.mocked(sendBuddyMessage).mockResolvedValue(
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

  it("shows the reply returned by the Buddy backend", async () => {
    const user = userEvent.setup();
    render(<HomeSurface />);

    await user.type(
      screen.getByRole("textbox", { name: "和 Buddy 聊聊" }),
      "今天有点累",
    );
    await user.click(screen.getByRole("button", { name: "发送消息" }));

    expect(sendBuddyMessage).toHaveBeenCalledWith("今天有点累");
    expect(await screen.findByText(/先在沙发上休息/)).toBeInTheDocument();
  });
});
