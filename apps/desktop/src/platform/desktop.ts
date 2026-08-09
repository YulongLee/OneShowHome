import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { saveWindowState, StateFlags } from "@tauri-apps/plugin-window-state";

export function showHome(): Promise<void> {
  return invoke("show_main_window");
}

export function hideHome(): Promise<void> {
  return invoke("hide_main_window");
}

export function showHouse(): Promise<void> {
  return invoke("show_house_window");
}

export async function moveHouse(): Promise<void> {
  await getCurrentWindow().startDragging();
  await saveWindowState(StateFlags.POSITION);
}
