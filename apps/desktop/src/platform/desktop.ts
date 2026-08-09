import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { saveWindowState, StateFlags } from "@tauri-apps/plugin-window-state";

export function showHome(): Promise<void> {
  return invoke("begin_home_transition");
}

export async function onHomeEntry(handler: () => void): Promise<UnlistenFn> {
  let checking = false;
  const playIfPending = async () => {
    if (checking) return;
    checking = true;
    try {
      if (await invoke<boolean>("consume_home_transition")) handler();
    } finally {
      checking = false;
    }
  };

  const [stopEvent, stopFocus] = await Promise.all([
    listen("home-entry-started", () => void playIfPending()),
    getCurrentWindow().onFocusChanged(({ payload }) => {
      if (payload) void playIfPending();
    }),
  ]);

  void playIfPending();
  return () => {
    stopEvent();
    stopFocus();
  };
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
