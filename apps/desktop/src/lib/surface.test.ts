import { describe, expect, it } from "vitest";
import { resolveSurface } from "./surface";

describe("resolveSurface", () => {
  it("selects the house surface explicitly", () => {
    expect(resolveSurface("house")).toBe("house");
  });

  it.each([null, "", "main", "unknown"])(
    "falls back to the main surface for %s",
    (value) => {
      expect(resolveSurface(value)).toBe("main");
    },
  );
});
