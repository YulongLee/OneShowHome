import { Footprints, Sparkle } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import buddyStanding from "../../assets/farm/buddy-standing.png";
import buddyWalkCycle from "../../assets/farm/buddy-walk-cycle.png";
import bedroomScene from "../../assets/house/bedroom-isometric-v1.png";
import buddyCooking from "../../assets/house/buddy-cooking.png";
import buddyIdle from "../../assets/house/buddy-idle.png";
import buddyReading from "../../assets/house/buddy-reading.png";
import buddySleeping from "../../assets/house/buddy-sleeping.png";
import kitchenScene from "../../assets/house/kitchen-isometric-v1.png";
import livingRoomScene from "../../assets/house/living-room-isometric-v1.png";
import type { BuddyState, HomeObjectState } from "../../services/desktop-store";
import {
  constrainRoomPoint,
  findRoomPath,
  getRoomSpawn,
  getRoomWalkDuration,
  type LaunchRoom,
  type RoomPoint,
} from "./room-world-engine";

export type RoomHotspot = {
  action: string;
  label: string;
  hint: string;
  x: number;
  y: number;
  width: number;
  height: number;
  target: RoomPoint;
};

const roomScenes: Record<LaunchRoom, string> = {
  living_room: livingRoomScene,
  kitchen: kitchenScene,
  bedroom: bedroomScene,
};

const roomHotspots: Record<LaunchRoom, RoomHotspot[]> = {
  living_room: [
    {
      action: "rest",
      label: "沙发",
      hint: "坐下来休息",
      x: 12,
      y: 32,
      width: 31,
      height: 37,
      target: { x: 43, y: 67 },
    },
    {
      action: "read",
      label: "茶几",
      hint: "一起读本书",
      x: 34,
      y: 53,
      width: 25,
      height: 24,
      target: { x: 58, y: 70 },
    },
    {
      action: "fireplace",
      label: "壁炉",
      hint: "暖暖手、聊聊天",
      x: 60,
      y: 34,
      width: 24,
      height: 31,
      target: { x: 65, y: 65 },
    },
  ],
  kitchen: [
    {
      action: "cook",
      label: "炉灶",
      hint: "做一道暖心料理",
      x: 7,
      y: 38,
      width: 23,
      height: 31,
      target: { x: 31, y: 65 },
    },
    {
      action: "prepare",
      label: "料理台",
      hint: "准备新鲜食材",
      x: 27,
      y: 31,
      width: 28,
      height: 30,
      target: { x: 52, y: 62 },
    },
    {
      action: "wash",
      label: "水槽",
      hint: "把厨房收拾干净",
      x: 57,
      y: 27,
      width: 30,
      height: 31,
      target: { x: 64, y: 60 },
    },
  ],
  bedroom: [
    {
      action: "sleep",
      label: "床铺",
      hint: "睡一觉恢复精力",
      x: 11,
      y: 35,
      width: 40,
      height: 37,
      target: { x: 46, y: 61 },
    },
    {
      action: "write",
      label: "书桌",
      hint: "写下今天的心情",
      x: 55,
      y: 34,
      width: 18,
      height: 28,
      target: { x: 59, y: 63 },
    },
    {
      action: "tidy",
      label: "衣柜",
      hint: "整理自己的小空间",
      x: 70,
      y: 26,
      width: 18,
      height: 38,
      target: { x: 70, y: 65 },
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
  if (["read", "write"].includes(action ?? "") || activity === "reading")
    return buddyReading;
  if (action) return buddyIdle;
  return buddyStanding;
};

export function RoomStage({
  room,
  state,
  activeAction,
  busyAction,
  objectStates,
  onInteract,
  onMove,
}: {
  room: LaunchRoom;
  state: BuddyState;
  activeAction: string | null;
  busyAction: string | null;
  objectStates: HomeObjectState[];
  onInteract: (hotspot: RoomHotspot) => void;
  onMove: () => void;
}) {
  const [position, setPosition] = useState<RoomPoint>(() =>
    room === "bedroom" && state.activity === "sleeping"
      ? { x: 40, y: 60 }
      : getRoomSpawn(room),
  );
  const [marker, setMarker] = useState<RoomPoint | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [facing, setFacing] = useState<"left" | "right">("left");
  const [walkDuration, setWalkDuration] = useState(420);
  const positionRef = useRef(position);
  const movementTimer = useRef<number | null>(null);
  const hotspots = roomHotspots[room];
  const pose = poseForAction(activeAction, state.activity);

  useEffect(
    () => () => {
      if (movementTimer.current) window.clearTimeout(movementTimer.current);
    },
    [],
  );

  const walkTo = (target: RoomPoint, onArrive?: () => void) => {
    if (movementTimer.current) window.clearTimeout(movementTimer.current);
    const route = findRoomPath(room, positionRef.current, target);
    setMarker(route.at(-1) ?? null);
    setIsMoving(true);

    const takeStep = (remaining: RoomPoint[]) => {
      const next = remaining[0];
      if (!next) {
        setIsMoving(false);
        setMarker(null);
        onArrive?.();
        return;
      }
      const from = positionRef.current;
      const duration = getRoomWalkDuration(from, next);
      setFacing(next.x < from.x ? "left" : "right");
      setWalkDuration(duration);
      positionRef.current = next;
      setPosition(next);
      movementTimer.current = window.setTimeout(
        () => takeStep(remaining.slice(1)),
        duration,
      );
    };

    window.requestAnimationFrame(() => takeStep(route));
  };

  const moveOnFloor = (event: PointerEvent<HTMLElement>) => {
    if (busyAction || isMoving) return;
    const target = event.target as HTMLElement;
    if (target.closest("button")) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const destination = constrainRoomPoint(room, {
      x: ((event.clientX - bounds.left) / bounds.width) * 100,
      y: ((event.clientY - bounds.top) / bounds.height) * 100,
    });
    onMove();
    walkTo(destination);
  };

  return (
    <section
      aria-label={`${room} 2.5D 可互动场景`}
      className={`room-stage isometric-room room-view-${room}`}
      onPointerDown={moveOnFloor}
    >
      <img
        alt=""
        className="home-scene"
        draggable={false}
        src={roomScenes[room]}
      />
      <div aria-hidden="true" className="room-floor-light" />
      <div aria-hidden="true" className="room-ambient-motion">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      {marker ? (
        <span
          aria-hidden="true"
          className="room-walk-marker"
          style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
        >
          <Footprints weight="fill" />
        </span>
      ) : null}
      {hotspots.map((hotspot) => {
        const objectState = objectStates.find(
          (item) => item.objectId === hotspot.action,
        );
        return (
          <button
            aria-label={`${hotspot.label}：${hotspot.hint}`}
            className={`room-hotspot${activeAction === hotspot.action ? " is-active" : ""}`}
            disabled={busyAction !== null || isMoving}
            key={hotspot.action}
            onClick={(event) => {
              event.stopPropagation();
              onMove();
              walkTo(hotspot.target, () => onInteract(hotspot));
            }}
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
        aria-label={`Buddy 正在${isMoving ? "房间里行走" : busyAction ? "互动" : "房间里活动"}`}
        className={`home-buddy isometric-buddy${isMoving ? " is-walking" : ""}${busyAction ? " is-acting" : ""}${pose === buddySleeping && !isMoving ? " is-sleeping-pose" : ""}${facing === "left" ? " is-facing-left" : ""}`}
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transitionDuration: `${walkDuration}ms`,
          zIndex: 10 + Math.round(position.y),
        }}
      >
        {isMoving ? (
          <span
            className="room-buddy-walk-cycle"
            style={{ backgroundImage: `url(${buddyWalkCycle})` }}
          />
        ) : (
          <img alt="" src={pose} />
        )}
        {busyAction ? (
          <span className="action-sparkles">
            <i>✦</i>
            <i>✧</i>
            <i>·</i>
          </span>
        ) : null}
      </div>
      <span className="room-move-help">
        <Footprints weight="fill" /> 点击地面，Buddy 会走过去
      </span>
    </section>
  );
}
