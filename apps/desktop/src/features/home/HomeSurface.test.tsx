import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { hideHome, onHomeEntry, showHouse } from "../../platform/desktop";
import { HomeSurface } from "./HomeSurface";

vi.mock("../../platform/desktop", () => ({
  hideHome: vi.fn(),
  onHomeEntry: vi.fn(),
  showHouse: vi.fn(),
}));

describe("HomeSurface", () => {
  beforeEach(() => {
    vi.mocked(showHouse).mockResolvedValue(undefined);
    vi.mocked(hideHome).mockResolvedValue(undefined);
    vi.mocked(onHomeEntry).mockResolvedValue(vi.fn());
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

  it("accepts a local placeholder chat message", async () => {
    const user = userEvent.setup();
    render(<HomeSurface />);

    await user.type(
      screen.getByRole("textbox", { name: "和 Buddy 聊聊" }),
      "今天有点累",
    );
    await user.click(screen.getByRole("button", { name: "发送消息" }));

    expect(screen.getByText(/今天有点累/)).toBeInTheDocument();
  });
});
