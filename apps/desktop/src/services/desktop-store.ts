import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import {
  disable as disableAutostart,
  enable as enableAutostart,
  isEnabled as isAutostartEnabled,
} from "@tauri-apps/plugin-autostart";

export type BuddyProfile = {
  name: string;
  avatarId: "milo" | "sora" | "mugi";
  personality: "warm" | "lively" | "quiet";
  createdAt: number;
};

export type BuddyState = {
  mood: "happy" | "calm" | "tired";
  energy: number;
  location: "living_room" | "kitchen" | "bedroom" | "garden";
  activity:
    "idle" | "reading" | "cooking" | "sleeping" | "gardening" | "thinking";
  updatedAt: number;
};

export type DesktopMemory = {
  id: number;
  memoryType: "preference" | "event";
  content: string;
  importance: number;
  createdAt: number;
};

export type DesktopDiary = {
  id: number;
  localDate: string;
  content: string;
  createdAt: number;
};

export type GalleryPhoto = { id: number; path: string; createdAt: number };

export type DesktopSnapshot = {
  profile: BuddyProfile | null;
  state: BuddyState | null;
  memories: DesktopMemory[];
  diaries: DesktopDiary[];
  gallery: GalleryPhoto[];
  settings: { soundEnabled: boolean };
};

const temporal = () => ({
  nowMs: Date.now(),
  localHour: new Date().getHours(),
});

export const loadDesktopSnapshot = () =>
  invoke<DesktopSnapshot>("load_desktop_snapshot", temporal());

export const createDesktopBuddy = (
  name: string,
  avatarId: BuddyProfile["avatarId"],
  personality: BuddyProfile["personality"],
) =>
  invoke<DesktopSnapshot>("create_desktop_buddy", {
    name,
    avatarId,
    personality,
    nowMs: Date.now(),
  });

export const applyBuddyAction = (action: string) =>
  invoke<DesktopSnapshot>("apply_buddy_action", { action, nowMs: Date.now() });

export const changeBuddyRoom = (room: BuddyState["location"]) =>
  invoke<DesktopSnapshot>("change_buddy_room", { room, nowMs: Date.now() });

export const addDesktopMemory = (
  memoryType: "preference" | "event",
  content: string,
) =>
  invoke<DesktopSnapshot>("add_desktop_memory", {
    memoryType,
    content,
    nowMs: Date.now(),
  });

export const deleteDesktopMemory = (id: number) =>
  invoke<DesktopSnapshot>("delete_desktop_memory", { id });

export const generateDesktopDiary = () => {
  const localDate = new Intl.DateTimeFormat("sv-SE").format(new Date());
  return invoke<DesktopSnapshot>("generate_desktop_diary", {
    localDate,
    nowMs: Date.now(),
  });
};

export const deleteDesktopDiary = (id: number) =>
  invoke<DesktopSnapshot>("delete_desktop_diary", { id });

export async function importGalleryPhoto(): Promise<DesktopSnapshot | null> {
  const source = await open({
    multiple: false,
    directory: false,
    filters: [{ name: "图片", extensions: ["png", "jpg", "jpeg", "webp"] }],
  });
  if (!source) return null;
  return invoke<DesktopSnapshot>("import_gallery_photo", {
    source,
    nowMs: Date.now(),
  });
}

export const deleteGalleryPhoto = (id: number) =>
  invoke<DesktopSnapshot>("delete_gallery_photo", { id });

export const galleryPhotoUrl = (path: string) => convertFileSrc(path);

export const setDesktopSound = (enabled: boolean) =>
  invoke<DesktopSnapshot>("set_desktop_sound", { enabled, nowMs: Date.now() });

export async function exportDesktopData(): Promise<boolean> {
  const destination = await save({
    defaultPath: `OneShow-Home-${new Intl.DateTimeFormat("sv-SE").format(new Date())}.json`,
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (!destination) return false;
  await invoke("export_desktop_data", { destination, ...temporal() });
  return true;
}

export const clearDesktopData = () => invoke<void>("clear_desktop_data");
export const quitDesktopApp = () => invoke<void>("quit_app");
export const readAutostart = () => isAutostartEnabled();
export const writeAutostart = async (enabled: boolean) =>
  enabled ? enableAutostart() : disableAutostart();
