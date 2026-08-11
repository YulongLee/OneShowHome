import { useEffect, useRef } from "react";
import animalAtlas from "../../assets/farm/animal-trio.png";
import environmentAtlas from "../../assets/farm/dynamic-environment-atlas-v1.png";
import vista from "../../assets/farm/farm-world-anime-v3.png";
import petAtlas from "../../assets/farm/dynamic-pet-corgi-v1.png";
import terrain from "../../assets/farm/dynamic-terrain-v1.png";
import cropCarrot from "../../assets/garden/crop-carrot.png";
import cropLettuce from "../../assets/garden/crop-lettuce.png";
import cropStrawberry from "../../assets/garden/crop-strawberry.png";
import cropSunflower from "../../assets/garden/crop-sunflower.png";
import type { FarmWorldSnapshot } from "./farm-world-engine";

type LoadedAssets = {
  animals: HTMLImageElement;
  crops: HTMLImageElement[];
  environment: HTMLImageElement;
  pet: HTMLImageElement;
  terrain: HTMLImageElement;
  vista: HTMLImageElement;
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
  { x: 0.17, y: 0.13, scale: 0.085, phase: 2.2, speed: 0.75 },
  { x: 0.29, y: 0.11, scale: 0.095, phase: 4.8, speed: 0.8 },
  { x: 0.4, y: 0.13, scale: 0.11, phase: 3.1, speed: 0.85 },
  { x: 0.53, y: 0.1, scale: 0.085, phase: 5.2, speed: 0.7 },
  { x: 0.68, y: 0.12, scale: 0.12, phase: 4.3, speed: 0.72 },
  { x: 0.79, y: 0.14, scale: 0.09, phase: 1.2, speed: 0.84 },
  { x: 0.91, y: 0.26, scale: 0.13, phase: 2.4, speed: 0.9 },
  { x: 0.955, y: 0.52, scale: 0.11, phase: 5.5, speed: 0.78 },
  { x: 0.94, y: 0.69, scale: 0.09, phase: 2.9, speed: 0.82 },
  { x: 0.07, y: 0.77, scale: 0.12, phase: 3.8, speed: 0.82 },
  { x: 0.19, y: 0.89, scale: 0.09, phase: 0.9, speed: 0.76 },
  { x: 0.31, y: 0.93, scale: 0.075, phase: 4.5, speed: 0.88 },
  { x: 0.72, y: 0.92, scale: 0.075, phase: 3.4, speed: 0.74 },
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

const drawCropField = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  elapsed: number,
  field: {
    columns: number;
    rows: number;
    startX: number;
    startY: number;
    stepX: number;
    stepY: number;
    scale: number;
    phase: number;
  },
) => {
  for (let row = 0; row < field.rows; row += 1) {
    for (let column = 0; column < field.columns; column += 1) {
      const index = row * field.columns + column;
      const entityWidth = width * field.scale * (0.88 + row * 0.055);
      const entityHeight = entityWidth * 0.88;
      const sway =
        Math.sin(elapsed * 0.0014 + field.phase + index * 0.43) * 0.035;
      const x = width * (field.startX + column * field.stepX + row * 0.006);
      const y = height * (field.startY + row * field.stepY);
      context.save();
      context.translate(x, y);
      context.rotate(sway);
      context.drawImage(
        image,
        -entityWidth / 2,
        -entityHeight,
        entityWidth,
        entityHeight,
      );
      context.restore();
    }
  }
};

function renderWorld(
  context: CanvasRenderingContext2D,
  assets: LoadedAssets,
  world: FarmWorldSnapshot,
  width: number,
  height: number,
  elapsed: number,
) {
  context.fillStyle = world.phase === "night" ? "#203e70" : "#4db8ed";
  context.fillRect(0, 0, width, height);

  context.save();
  context.globalAlpha = world.weather === "rain" ? 0.8 : 1;
  context.drawImage(assets.vista, 0, 0, width, height);
  context.restore();

  const vistaOffset = Math.sin(elapsed * 0.000035) * width * 0.006;
  context.save();
  context.globalAlpha = world.weather === "rain" ? 0.8 : 1;
  context.drawImage(
    assets.vista,
    0,
    0,
    assets.vista.naturalWidth,
    assets.vista.naturalHeight * 0.29,
    -width * 0.012 + vistaOffset,
    0,
    width * 1.024,
    height * 0.31,
  );
  context.restore();

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

  const cloudAlpha = world.weather === "rain" ? 0.16 : 0.2;
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
  context.strokeStyle = "rgb(232 255 247 / 32%)";
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

  const cropFields = [
    {
      image: assets.crops[0],
      columns: 5,
      rows: 3,
      startX: 0.155,
      startY: 0.615,
      stepX: 0.047,
      stepY: 0.055,
      scale: 0.047,
      phase: 0.2,
    },
    {
      image: assets.crops[1],
      columns: 4,
      rows: 3,
      startX: 0.39,
      startY: 0.59,
      stepX: 0.045,
      stepY: 0.055,
      scale: 0.042,
      phase: 1.4,
    },
    {
      image: assets.crops[2],
      columns: 5,
      rows: 2,
      startX: 0.52,
      startY: 0.705,
      stepX: 0.043,
      stepY: 0.06,
      scale: 0.044,
      phase: 2.7,
    },
    {
      image: assets.crops[3],
      columns: 6,
      rows: 2,
      startX: 0.525,
      startY: 0.505,
      stepX: 0.039,
      stepY: 0.055,
      scale: 0.04,
      phase: 4.1,
    },
    {
      image: assets.crops[0],
      columns: 5,
      rows: 2,
      startX: 0.34,
      startY: 0.785,
      stepX: 0.044,
      stepY: 0.054,
      scale: 0.043,
      phase: 5.2,
    },
    {
      image: assets.crops[2],
      columns: 5,
      rows: 2,
      startX: 0.555,
      startY: 0.81,
      stepX: 0.041,
      stepY: 0.052,
      scale: 0.04,
      phase: 0.9,
    },
  ];
  for (const field of cropFields) {
    drawCropField(context, field.image, width, height, elapsed, field);
  }

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
      const [
        animals,
        environment,
        pet,
        terrainImage,
        vistaImage,
        ...cropImages
      ] = await Promise.all([
        loadImage(animalAtlas),
        loadImage(environmentAtlas),
        loadImage(petAtlas),
        loadImage(terrain),
        loadImage(vista),
        loadImage(cropCarrot),
        loadImage(cropLettuce),
        loadImage(cropStrawberry),
        loadImage(cropSunflower),
      ]);
      if (disposed) return;
      const assets = {
        animals,
        crops: cropImages,
        environment,
        pet,
        terrain: terrainImage,
        vista: vistaImage,
      };
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
