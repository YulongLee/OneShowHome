export type AppSurface = "main" | "house";

export function resolveSurface(value: string | null): AppSurface {
  return value === "house" ? "house" : "main";
}
