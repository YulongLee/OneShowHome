import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { moveHouse, showHome } from "../../platform/desktop";
import { HouseSurface } from "./HouseSurface";

vi.mock("../../platform/desktop", () => ({
  moveHouse: vi.fn(),
  showHome: vi.fn(),
}));

describe("HouseSurface", () => {
  beforeEach(() => {
    vi.mocked(moveHouse).mockResolvedValue(undefined);
    vi.mocked(showHome).mockResolvedValue(undefined);
  });

  it("opens Home when the house is clicked", async () => {
    vi.useFakeTimers();
    render(<HouseSurface />);

    fireEvent.click(screen.getByRole("button", { name: "进入 OneShow Home" }));
    await vi.advanceTimersByTimeAsync(520);

    expect(showHome).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it("starts native dragging from the move handle", () => {
    render(<HouseSurface />);

    fireEvent.pointerDown(
      screen.getByRole("button", { name: "拖动桌面小屋" }),
      {
        button: 0,
      },
    );

    expect(moveHouse).toHaveBeenCalledOnce();
  });
});
