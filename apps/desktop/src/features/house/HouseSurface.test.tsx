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
    vi.clearAllMocks();
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

  it("starts native dragging by moving the house itself", () => {
    render(<HouseSurface />);

    const house = screen.getByRole("button", { name: "进入 OneShow Home" });

    fireEvent.pointerDown(house, { button: 0, clientX: 20, clientY: 20 });
    fireEvent.pointerMove(house, { clientX: 30, clientY: 28 });

    expect(moveHouse).toHaveBeenCalledOnce();
  });

  it("starts native dragging after holding the house", async () => {
    vi.useFakeTimers();
    render(<HouseSurface />);

    fireEvent.pointerDown(
      screen.getByRole("button", { name: "进入 OneShow Home" }),
      { button: 0, clientX: 20, clientY: 20 },
    );
    await vi.advanceTimersByTimeAsync(180);

    expect(moveHouse).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it("greets the user when the house is hovered", () => {
    render(<HouseSurface />);

    fireEvent.pointerEnter(
      screen.getByRole("button", { name: "进入 OneShow Home" }),
    );

    expect(screen.getByLabelText("Milo 正在向你招手")).toBeInTheDocument();
  });
});
