import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { hideHome, showHouse } from "../../platform/desktop";
import { HomeSurface } from "./HomeSurface";

vi.mock("../../platform/desktop", () => ({
  hideHome: vi.fn(),
  showHouse: vi.fn(),
}));

describe("HomeSurface", () => {
  beforeEach(() => {
    vi.mocked(showHouse).mockResolvedValue(undefined);
    vi.mocked(hideHome).mockResolvedValue(undefined);
  });

  it("shows the Phase 0 boundary", () => {
    render(<HomeSurface />);

    expect(screen.getByText("Phase 0 · 本地原型")).toBeInTheDocument();
    expect(
      screen.getByText("不接入 AI，不保存对话，不读取任何桌面内容。"),
    ).toBeInTheDocument();
  });

  it("can ask the desktop runtime to reveal the house", async () => {
    const user = userEvent.setup();
    render(<HomeSurface />);

    await user.click(screen.getByRole("button", { name: "找到桌面小屋" }));

    expect(showHouse).toHaveBeenCalledOnce();
    expect(
      await screen.findByText("桌面小屋已经显示在你的工作空间中。"),
    ).toBeInTheDocument();
  });
});
