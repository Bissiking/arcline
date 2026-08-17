// apps/client/src/game/terrain.ts
// Rendu d'une carte (ciel, soleil, nuages, montagnes, collines, sol, flore)
// piloté par un thème `Environment` — la carte du jour « Prairie à l'aube ».

import Phaser from "phaser";
import {
  GROUND_EDGE,
  GROUND_THICKNESS,
  GROUND_Y,
  WORLD,
} from "./layout.js";
import type { Cloud, Environment } from "./environment.js";
import { COLORS, colorToNumber } from "../ui/tokens.js";

export function drawTerrain(
  scene: Phaser.Scene,
  env: Environment,
  fxLeft: number,
  fxRight: number,
): Phaser.GameObjects.Container {
  const g = scene.add.graphics();

  drawSky(g, env);
  drawSun(g, env);
  for (const cloud of env.clouds) drawCloud(g, cloud);
  drawMountains(g, env);
  drawHills(g, env);
  drawGround(g, env, fxLeft, fxRight);
  drawFlora(g, env, fxLeft, fxRight);

  return scene.add.container(0, 0, [g]).setDepth(1);
}

function drawSky(
  g: Phaser.GameObjects.Graphics,
  env: Environment,
): void {
  const { top, mid, horizon } = env.sky;
  const halfY = GROUND_Y / 2;

  g.fillGradientStyle(
    colorToNumber(top),
    colorToNumber(top),
    colorToNumber(mid),
    colorToNumber(mid),
    1,
  );
  g.fillRect(0, 0, WORLD.width, halfY);

  g.fillGradientStyle(
    colorToNumber(mid),
    colorToNumber(mid),
    colorToNumber(horizon),
    colorToNumber(horizon),
    1,
  );
  g.fillRect(0, halfY, WORLD.width, GROUND_Y - halfY);
}

function drawSun(
  g: Phaser.GameObjects.Graphics,
  env: Environment,
): void {
  const { x, y, core } = env.sun;
  const halo = colorToNumber(COLORS.sun);

  g.fillStyle(halo, 0.1);
  g.fillCircle(x, y, core * 4.2);
  g.fillStyle(halo, 0.18);
  g.fillCircle(x, y, core * 3);
  g.fillStyle(halo, 0.38);
  g.fillCircle(x, y, core * 1.9);
  g.fillStyle(halo, 0.92);
  g.fillCircle(x, y, core);
}

function drawCloud(g: Phaser.GameObjects.Graphics, cloud: Cloud): void {
  const { x, y, scale, alpha } = cloud;
  const white = colorToNumber(COLORS.cloud);
  const shade = colorToNumber("#dce6ef");

  g.fillStyle(shade, alpha);
  g.fillEllipse(x, y + 4 * scale, 150 * scale, 42 * scale);

  g.fillStyle(white, alpha);
  g.fillEllipse(x - 44 * scale, y, 90 * scale, 46 * scale);
  g.fillEllipse(x, y - 18 * scale, 100 * scale, 54 * scale);
  g.fillEllipse(x + 48 * scale, y - 6 * scale, 86 * scale, 42 * scale);
  g.fillEllipse(x, y + 12 * scale, 180 * scale, 30 * scale);
}

function drawMountains(
  g: Phaser.GameObjects.Graphics,
  env: Environment,
): void {
  const far = colorToNumber(env.sky.top);
  g.fillStyle(colorToNumber(COLORS.hillDistant), 0.7);
  for (const hill of env.mountains) {
    g.fillTriangle(hill.x, hill.y, hill.x + hill.w, hill.y, hill.x + hill.w / 2, hill.y - hill.h);
  }
  // Halo brumeux à la base des montagnes
  g.fillStyle(far, 0.2);
  g.fillRect(0, GROUND_Y - 70, WORLD.width, 70);
}

function drawHills(
  g: Phaser.GameObjects.Graphics,
  env: Environment,
): void {
  g.fillStyle(colorToNumber(COLORS.hillFar), 1);
  for (const hill of env.hillsFar) g.fillEllipse(hill.x, hill.y, hill.w, hill.h);

  g.fillStyle(colorToNumber(COLORS.hillNear), 1);
  for (const hill of env.hillsNear) g.fillEllipse(hill.x, hill.y, hill.w, hill.h);
}

function drawGround(
  g: Phaser.GameObjects.Graphics,
  env: Environment,
  fxLeft: number,
  fxRight: number,
): void {
  const { top, surface, body, edge } = env.ground;

  g.fillStyle(colorToNumber(body), 1);
  g.fillRect(0, GROUND_Y, WORLD.width, GROUND_THICKNESS);

  g.fillStyle(colorToNumber(surface), 1);
  g.fillRect(0, GROUND_Y, WORLD.width, 9);

  g.fillStyle(colorToNumber(top), 1);
  g.fillRect(0, GROUND_Y, WORLD.width, 3);

  g.fillStyle(colorToNumber(edge), 1);
  g.fillRect(0, GROUND_Y + 12, WORLD.width, 22);

  g.fillStyle(colorToNumber(body), 1);
  g.fillRect(0, GROUND_Y + 34, WORLD.width, GROUND_THICKNESS - 34);

  // Chemin de terre sous chaque archer
  const PATCH = 170;
  drawDirtPatch(g, fxLeft, PATCH);
  drawDirtPatch(g, fxRight, PATCH);

  g.fillStyle(colorToNumber(surface), 1);
  g.fillRect(0, GROUND_Y + 4, GROUND_EDGE, 4);
  g.fillRect(WORLD.width - GROUND_EDGE, GROUND_Y + 4, GROUND_EDGE, 4);
}

function drawDirtPatch(g: Phaser.GameObjects.Graphics, centerX: number, width: number): void {
  g.fillStyle(colorToNumber(COLORS.dirt), 0.9);
  g.fillRoundedRect(centerX - width / 2, GROUND_Y - 2, width, 22, 4);
  g.lineStyle(2, colorToNumber(COLORS.dirtEdge), 0.8);
  g.lineBetween(centerX - width / 2, GROUND_Y + 19, centerX + width / 2, GROUND_Y + 19);
}

function drawFlora(
  g: Phaser.GameObjects.Graphics,
  env: Environment,
  fxLeft: number,
  fxRight: number,
): void {
  const grass = colorToNumber(env.grass);
  const underPatch = (x: number): boolean =>
    Math.abs(x - fxLeft) < 85 || Math.abs(x - fxRight) < 85;

  // Touffes d'herbe
  g.fillStyle(grass, 0.9);
  for (let x = 20; x < WORLD.width; x += Math.floor(24 + (x % 11))) {
    if (underPatch(x)) continue;
    const h = 3 + ((x * 7) % 5);
    g.fillRect(x, GROUND_Y - h, 2, h);
    g.fillRect(x + 3, GROUND_Y - h + 2, 2, h - 2);
  }

  // Marguerites près du sol
  for (const daisy of env.daisies) {
    g.fillStyle(colorToNumber(COLORS.daisy), 1);
    g.fillCircle(daisy.x, GROUND_Y - 4, 3.4);
    g.fillStyle(colorToNumber(COLORS.daisyHeart), 1);
    g.fillCircle(daisy.x, GROUND_Y - 4, 1.4);
  }
}