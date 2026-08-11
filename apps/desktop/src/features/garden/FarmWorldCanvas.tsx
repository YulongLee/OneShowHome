import { useEffect, useRef } from "react";
import animalAtlas from "../../assets/farm/animal-trio.png";
import environmentAtlas from "../../assets/farm/dynamic-environment-atlas-v1.png";
import petAtlas from "../../assets/farm/dynamic-pet-corgi-v1.png";
import terrain from "../../assets/farm/dynamic-terrain-v1.png";
import type { FarmWorldSnapshot } from "./farm-world-engine";

type LoadedAssets = {
  animals: HTMLImageElement;
  environment: HTMLImageElement;
  pet: HTMLImageElement;
  terrain: HTMLImageElement;
};

type TreeEntity = {
  x: number;
  y: number;
  scale: number;
  phase: number;
  speed: number;
};

const trees: TreeEntity[] = [
  { x: 0.035, y: 0.33, scale: 0.13, phase: 0.2, speed: 0.8 },
  { x: 0.09, y: 0.2, scale: 0.1, phase: 1.8, speed: 0.7 },
  { x: 0.4, y: 0.13, scale: 0.11, phase: 3.1, speed: 0.85 },
  { x: 0.68, y: 0.12, scale: 0.12, phase: 4.3, speed: 0.72 },
  { x: 0.91, y: 0.26, scale: 0.13, phase: 2.4, speed: 0.9 },
  { x: 0.955, y: 0.52, scale: 0.11, phase: 5.5, speed: 0.78 },
  { x: 0.07, y: 0.77, scale: 0.12, phase: 3.8, speed: 0.82 },
  { x: 0.19, y: 0.89, scale: 0.09, phase: 0.9, speed: 0.76 },
];

const loadImage = (source: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });

const drawCloud = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  alpha: number,
) => {
  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  context.globalAlpha = alpha;
  context.fillStyle = "#fffdf1";
  context.beginPath();
  context.arc(-28, 4, 18, 0, Math.PI * 2);
  context.arc(-7, -6, 25, 0, Math.PI * 2);
  context.arc(22, 1, 20, 0, Math.PI * 2);
  context.ellipse(0, 12, 56, 17, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();
};

const drawAtlasCell = (
  context: CanvasRenderingContext2D,
  atlas: HTMLImageElement,
  column: number,
  row: number,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  const sourceWidth = atlas.naturalWidth / 2;
  const sourceHeight = atlas.naturalHeight / 2;
  context.drawImage(
    atlas,
    column * sourceWidth,
    row * sourceHeight,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height,
  );
};

const drawEntityShadow = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
) => {
  context.save();
  context.globalAlpha = 0.18;
  context.filter = "blur(4px)";
  context.fillStyle = "#263721";
  context.beginPath();
  context.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();
};

function renderWorld(
  context: CanvasRenderingContext2D,
  assets: LoadedAssets,
  world: FarmWorldSnapshot,
  width: number,
  height: number,
  elapsed: number,
) {
  const phaseColors = {
    morning: ["#f7cfad", "#9bd8e9"],
    day: ["#79c8ed", "#d9f3e6"],
    evening: ["#d77862", "#f4c68e"],
    night: ["#12234c", "#425b7a"],
  } as const;
  const sky = context.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, phaseColors[world.phase][0]);
  sky.addColorStop(1, phaseColors[world.phase][1]);
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);

  const starAlpha = world.phase === "night" ? 0.82 : 0;
  if (starAlpha) {
    context.save();
    context.fillStyle = `rgb(255 248 210 / ${starAlpha})`;
    for (let index = 0; index < 28; index += 1) {
      const x = ((index * 83.7) % 100) * 0.01 * width;
      const y = (0.03 + ((index * 37) % 25) * 0.01) * height;
      const flicker = 0.6 + Math.sin(elapsed * 0.002 + index) * 0.35;
      context.globalAlpha = flicker;
      context.beginPath();
      context.arc(x, y, index % 5 === 0 ? 1.8 : 1, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  const cloudAlpha = world.weather === "rain" ? 0.74 : 0.9;
  const cloudSpeed = world.weather === "rain" ? 0.018 : 0.009;
  [
    { offset: 0.04, y: 0.12, scale: 0.85 },
    { offset: 0.43, y: 0.08, scale: 1.08 },
    { offset: 0.77, y: 0.18, scale: 0.68 },
  ].forEach((cloud, index) => {
    const travel =
      (elapsed * cloudSpeed + cloud.offset * width) % (width + 180);
    drawCloud(
      context,
      travel - 90,
      cloud.y * height + Math.sin(elapsed * 0.0004 + index) * 5,
      cloud.scale * (width / 1200),
      cloudAlpha,
    );
  });

  context.save();
  context.globalAlpha = world.phase === "night" ? 0.25 : 0.16;
  context.fillStyle = world.phase === "evening" ? "#80585a" : "#5c7c76";
  context.beginPath();
  context.moveTo(0, height * 0.31);
  for (let x = 0; x <= width; x += width / 8) {
    const y = height * (0.2 + 0.04 * Math.sin(x * 0.016));
    context.lineTo(x, y);
  }
  context.lineTo(width, height * 0.45);
  context.lineTo(0, height * 0.45);
  context.closePath();
  context.fill();
  context.restore();

  const riverGradient = context.createLinearGradient(
    width * 0.75,
    height * 0.35,
    width,
    height,
  );
  riverGradient.addColorStop(
    0,
    world.phase === "night" ? "#315b75" : "#55b9d1",
  );
  riverGradient.addColorStop(
    1,
    world.phase === "night" ? "#1f445f" : "#8bd8dd",
  );
  context.fillStyle = riverGradient;
  context.fillRect(0, height * 0.69, width, height * 0.31);
  context.fillRect(width * 0.86, height * 0.2, width * 0.14, height * 0.8);
  context.save();
  context.strokeStyle = "rgb(232 255 247 / 58%)";
  context.lineWidth = Math.max(1.2, width * 0.0016);
  for (let row = 0; row < 11; row += 1) {
    const flow = (elapsed * (0.018 + row * 0.001)) % (width * 0.19);
    const y = height * (0.72 + row * 0.027);
    context.beginPath();
    for (let x = -width * 0.2; x < width * 1.2; x += 18) {
      const waveY = y + Math.sin(x * 0.035 + elapsed * 0.002 + row) * 2.4;
      if (x === -width * 0.2) context.moveTo(x + flow, waveY);
      else context.lineTo(x + flow, waveY);
    }
    context.stroke();
  }
  context.restore();

  context.save();
  context.filter =
    world.season === "autumn"
      ? "sepia(0.18) saturate(1.12) hue-rotate(-12deg)"
      : world.season === "winter"
        ? "saturate(0.72) brightness(1.08)"
        : "none";
  context.drawImage(assets.terrain, 0, 0, width, height);
  context.restore();

  const atlasSize = width * 0.27;
  drawEntityShadow(
    context,
    width * 0.245,
    height * 0.42,
    width * 0.105,
    height * 0.018,
  );
  drawAtlasCell(
    context,
    assets.environment,
    0,
    0,
    width * 0.09,
    height * 0.08,
    atlasSize,
    atlasSize,
  );
  drawEntityShadow(
    context,
    width * 0.59,
    height * 0.34,
    width * 0.08,
    height * 0.015,
  );
  drawAtlasCell(
    context,
    assets.environment,
    1,
    0,
    width * 0.48,
    height * 0.07,
    atlasSize * 0.8,
    atlasSize * 0.8,
  );
  drawEntityShadow(
    context,
    width * 0.79,
    height * 0.4,
    width * 0.055,
    height * 0.012,
  );
  drawAtlasCell(
    context,
    assets.environment,
    0,
    1,
    width * 0.715,
    height * 0.18,
    atlasSize * 0.62,
    atlasSize * 0.62,
  );

  for (const tree of trees) {
    const entityWidth = width * tree.scale;
    const sway = Math.sin(elapsed * 0.001 * tree.speed + tree.phase) * 0.022;
    context.save();
    context.translate(tree.x * width, tree.y * height);
    context.rotate(sway);
    drawAtlasCell(
      context,
      assets.environment,
      1,
      1,
      -entityWidth / 2,
      -entityWidth * 0.78,
      entityWidth,
      entityWidth,
    );
    context.restore();
  }

  const smokeTime = elapsed * 0.00018;
  for (let index = 0; index < 5; index += 1) {
    const progress = (smokeTime + index * 0.2) % 1;
    context.save();
    context.globalAlpha = (1 - progress) * 0.48;
    context.fillStyle = "#f9f4df";
    context.filter = "blur(2px)";
    context.beginPath();
    context.arc(
      width * (0.207 + progress * 0.018),
      height * (0.105 - progress * 0.12),
      width * (0.006 + progress * 0.008),
      0,
      Math.PI * 2,
    );
    context.fill();
    context.restore();
  }

  const animalBob = (phase: number) =>
    Math.sin(elapsed * 0.002 + phase) * height * 0.004;
  context.drawImage(
    assets.animals,
    0,
    0,
    420,
    506,
    width * (0.61 + Math.sin(elapsed * 0.00023) * 0.008),
    height * 0.27 + animalBob(0),
    width * 0.105,
    height * 0.13,
  );
  context.drawImage(
    assets.animals,
    410,
    0,
    300,
    506,
    width * (0.72 + Math.sin(elapsed * 0.0002 + 1.8) * 0.009),
    height * 0.285 + animalBob(1.3),
    width * 0.078,
    height * 0.11,
  );
  context.drawImage(
    assets.animals,
    690,
    0,
    210,
    506,
    width * (0.815 + Math.sin(elapsed * 0.00027 + 3.1) * 0.01),
    height * 0.385 + animalBob(2.6),
    width * 0.047,
    height * 0.075,
  );

  const petProgress = (elapsed * 0.000035) % 1;
  const petX = width * (0.39 + petProgress * 0.19);
  const petY = height * (0.48 + Math.sin(petProgress * Math.PI * 2) * 0.035);
  const petFrame = Math.floor(elapsed / 180) % 3;
  const petCellWidth = assets.pet.naturalWidth / 4;
  drawEntityShadow(
    context,
    petX + width * 0.025,
    petY + height * 0.062,
    width * 0.021,
    height * 0.006,
  );
  context.drawImage(
    assets.pet,
    petFrame * petCellWidth,
    0,
    petCellWidth,
    assets.pet.naturalHeight,
    petX,
    petY,
    width * 0.055,
    height * 0.082,
  );

  if (world.weather === "rain") {
    context.save();
    context.strokeStyle = "rgb(222 244 255 / 70%)";
    context.lineWidth = Math.max(1, width * 0.0012);
    for (let index = 0; index < 90; index += 1) {
      const x = ((index * 47 + elapsed * 0.14) % (width + 90)) - 45;
      const y = ((index * 83 + elapsed * 0.42) % (height + 100)) - 50;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x - width * 0.006, y + height * 0.025);
      context.stroke();
    }
    context.restore();
  }

  if (world.phase === "evening" || world.phase === "night") {
    context.fillStyle =
      world.phase === "night" ? "rgb(10 22 54 / 43%)" : "rgb(145 74 44 / 14%)";
    context.fillRect(0, 0, width, height);
    context.save();
    context.globalCompositeOperation = "screen";
    const windowGlow = context.createRadialGradient(
      width * 0.24,
      height * 0.3,
      2,
      width * 0.24,
      height * 0.3,
      width * 0.09,
    );
    windowGlow.addColorStop(0, "rgb(255 206 103 / 68%)");
    windowGlow.addColorStop(1, "rgb(255 206 103 / 0%)");
    context.fillStyle = windowGlow;
    context.fillRect(width * 0.14, height * 0.19, width * 0.2, height * 0.22);
    context.restore();
  }
}

export function FarmWorldCanvas({ world }: { world: FarmWorldSnapshot }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef(world);

  useEffect(() => {
    worldRef.current = world;
  }, [world]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || navigator.userAgent.toLowerCase().includes("jsdom")) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let frame = 0;
    let disposed = false;

    const run = async () => {
      const [animals, environment, pet, terrainImage] = await Promise.all([
        loadImage(animalAtlas),
        loadImage(environmentAtlas),
        loadImage(petAtlas),
        loadImage(terrain),
      ]);
      if (disposed) return;
      const assets = { animals, environment, pet, terrain: terrainImage };
      const draw = (elapsed: number) => {
        const bounds = canvas.getBoundingClientRect();
        const width = Math.max(1, bounds.width);
        const height = Math.max(1, bounds.height);
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        if (
          canvas.width !== Math.round(width * ratio) ||
          canvas.height !== Math.round(height * ratio)
        ) {
          canvas.width = Math.round(width * ratio);
          canvas.height = Math.round(height * ratio);
        }
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.clearRect(0, 0, width, height);
        renderWorld(context, assets, worldRef.current, width, height, elapsed);
        frame = window.requestAnimationFrame(draw);
      };
      frame = window.requestAnimationFrame(draw);
    };
    void run();
    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <canvas
      aria-label="由独立天空、云层、河流、建筑、树木、动物和宠物实时组成的动态农场"
      className="farm-world-canvas"
      ref={canvasRef}
      role="img"
    />
  );
}
