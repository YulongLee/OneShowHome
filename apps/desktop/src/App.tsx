import { useEffect } from "react";
import { HouseSurface } from "./features/house/HouseSurface";
import { HomeSurface } from "./features/home/HomeSurface";
import { resolveSurface } from "./lib/surface";

export function App() {
  const surface = resolveSurface(
    new URLSearchParams(window.location.search).get("window"),
  );

  useEffect(() => {
    document.documentElement.dataset.surface = surface;
    return () => {
      delete document.documentElement.dataset.surface;
    };
  }, [surface]);

  return surface === "house" ? <HouseSurface /> : <HomeSurface />;
}
