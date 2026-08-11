import { Sparkle } from "@phosphor-icons/react";
import buddyCooking from "../../assets/house/buddy-cooking.png";
import buddyGardening from "../../assets/house/buddy-gardening.png";
import buddyIdle from "../../assets/house/buddy-idle.png";
import buddyReading from "../../assets/house/buddy-reading.png";
import buddySleeping from "../../assets/house/buddy-sleeping.png";
import bedroomScene from "../../assets/house/bedroom.png";
import gardenScene from "../../assets/house/garden.png";
import kitchenScene from "../../assets/house/kitchen.png";
import livingRoomScene from "../../assets/house/living-room-v2.png";
import type { BuddyState, HomeObjectState } from "../../services/desktop-store";

export type RoomHotspot = {
  action: string;
  label: string;
  hint: string;
  x: number;
  y: number;
  width: number;
  height: number;
  buddy: { x: number; y: number; width: number };
};

const roomScenes: Record<BuddyState["location"], string> = {
  living_room: livingRoomScene,
  kitchen: kitchenScene,
  bedroom: bedroomScene,
  garden: gardenScene,
};

const roomHotspots: Record<BuddyState["location"], RoomHotspot[]> = {
  living_room: [
    {
      action: "rest",
      label: "沙发",
      hint: "坐下来休息",
      x: 3,
      y: 39,
      width: 38,
      height: 35,
      buddy: { x: 18, y: 36, width: 25 },
    },
    {
      action: "read",
      label: "茶几",
      hint: "一起读本书",
      x: 34,
      y: 53,
      width: 29,
      height: 27,
      buddy: { x: 42, y: 39, width: 25 },
    },
    {
      action: "fireplace",
      label: "壁炉",
      hint: "暖暖手、聊聊天",
      x: 63,
      y: 37,
      width: 23,
      height: 31,
      buddy: { x: 62, y: 39, width: 24 },
    },
  ],
  kitchen: [
    {
      action: "cook",
      label: "炉灶",
      hint: "做一道暖心料理",
      x: 1,
      y: 36,
      width: 25,
      height: 43,
      buddy: { x: 13, y: 34, width: 25 },
    },
    {
      action: "prepare",
      label: "料理台",
      hint: "准备新鲜食材",
      x: 25,
      y: 38,
      width: 30,
      height: 32,
      buddy: { x: 37, y: 36, width: 25 },
    },
    {
      action: "wash",
      label: "水槽",
      hint: "把厨房收拾干净",
      x: 57,
      y: 38,
      width: 31,
      height: 31,
      buddy: { x: 62, y: 36, width: 24 },
    },
  ],
  bedroom: [
    {
      action: "sleep",
      label: "床铺",
      hint: "睡一觉恢复精力",
      x: 0,
      y: 36,
      width: 54,
      height: 43,
      buddy: { x: 13, y: 47, width: 37 },
    },
    {
      action: "write",
      label: "书桌",
      hint: "写下今天的心情",
      x: 55,
      y: 35,
      width: 18,
      height: 31,
      buddy: { x: 51, y: 37, width: 24 },
    },
    {
      action: "tidy",
      label: "衣柜",
      hint: "整理自己的小空间",
      x: 72,
      y: 17,
      width: 21,
      height: 51,
      buddy: { x: 70, y: 40, width: 23 },
    },
  ],
  garden: [
    {
      action: "water",
      label: "花圃",
      hint: "给花儿浇水",
      x: 0,
      y: 43,
      width: 34,
      height: 42,
      buddy: { x: 14, y: 42, width: 25 },
    },
    {
      action: "harvest",
      label: "菜园",
      hint: "收获今天的蔬菜",
      x: 37,
      y: 43,
      width: 29,
      height: 31,
      buddy: { x: 42, y: 42, width: 25 },
    },
    {
      action: "greenhouse",
      label: "温室",
      hint: "照顾刚发芽的幼苗",
      x: 68,
      y: 18,
      width: 29,
      height: 47,
      buddy: { x: 67, y: 39, width: 24 },
    },
  ],
};

const poseForAction = (
  action: string | null,
  activity: BuddyState["activity"],
) => {
  if (action === "sleep" || activity === "sleeping") return buddySleeping;
  if (
    ["cook", "prepare", "wash"].includes(action ?? "") ||
    activity === "cooking"
  )
    return buddyCooking;
  if (
    ["water", "harvest", "greenhouse", "garden"].includes(action ?? "") ||
    activity === "gardening"
  )
    return buddyGardening;
  if (["read", "write"].includes(action ?? "") || activity === "reading")
    return buddyReading;
  return buddyIdle;
};

export function RoomStage({
  room,
  state,
  activeAction,
  busyAction,
  objectStates,
  onInteract,
}: {
  room: BuddyState["location"];
  state: BuddyState;
  activeAction: string | null;
  busyAction: string | null;
  objectStates: HomeObjectState[];
  onInteract: (hotspot: RoomHotspot) => void;
}) {
  const hotspots = roomHotspots[room];
  const active =
    hotspots.find((item) => item.action === activeAction) ?? hotspots[0];
  const pose = poseForAction(activeAction, state.activity);

  return (
    <section aria-label={`${room} 可互动场景`} className="room-stage">
      <img alt="" className="home-scene" src={roomScenes[room]} />
      <div aria-hidden="true" className="scene-shade" />
      {hotspots.map((hotspot) => {
        const objectState = objectStates.find(
          (item) => item.objectId === hotspot.action,
        );
        return (
          <button
            aria-label={`${hotspot.label}：${hotspot.hint}`}
            className={`room-hotspot${activeAction === hotspot.action ? " is-active" : ""}`}
            disabled={busyAction !== null}
            key={hotspot.action}
            onClick={() => onInteract(hotspot)}
            style={{
              left: `${hotspot.x}%`,
              top: `${hotspot.y}%`,
              width: `${hotspot.width}%`,
              height: `${hotspot.height}%`,
            }}
            type="button"
          >
            <span className="hotspot-pulse">
              <Sparkle weight="fill" />
            </span>
            <span className="hotspot-label">
              <strong>{hotspot.label}</strong>
              <small>{hotspot.hint}</small>
              {objectState ? <em>羁绊 Lv.{objectState.level}</em> : null}
            </span>
          </button>
        );
      })}
      <div
        aria-label={`Buddy 正在${busyAction ? "互动" : "房间里活动"}`}
        className={`home-buddy${busyAction ? " is-acting" : ""}`}
        style={{
          left: `${active.buddy.x}%`,
          top: `${active.buddy.y}%`,
          width: `${active.buddy.width}%`,
        }}
      >
        <img alt="" src={pose} />
        {busyAction ? (
          <span className="action-sparkles">
            <i>✦</i>
            <i>✧</i>
            <i>·</i>
          </span>
        ) : null}
      </div>
    </section>
  );
}
