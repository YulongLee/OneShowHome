import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    const user = userEvent.setup();
    render(<HouseSurface />);

    await user.click(screen.getByRole("button", { name: "进入 OneShow Home" }));

    expect(showHome).toHaveBeenCalledOnce();
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
