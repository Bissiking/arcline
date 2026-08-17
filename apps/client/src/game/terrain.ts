// apps/client/src/game/terrain.ts
// Rendu du terrain (ciel, collines, sol) et du monde.

import Phaser from "phaser";
import { GROUND_EDGE, GROUND_THICKNESS, GROUND_Y, WORLD } from "./layout.js";
import { colorToNumber } from "../ui/tokens.js";

const SKY = {
  top: "#0d1220",
  horizon: "#25344c",
} as const;

const HILL = {
  far: "#182538",
  near: "#1d2b40",
} as const;

const GROUND = {
  surface: "#26344c",
  body: "#1c2735",
  edge: "#141c29",
} as const;

export function drawTerrain(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const g = scene.add.graphics();

  drawSky(g);
  drawHills(g);
  drawGround(g);

  return scene.add.container(0, 0, [g]);
}

function drawSky(g: Phaser.GameObjects.Graphics): void {
  g.fillGradientStyle(
    colorToNumber(SKY.top),
    colorToNumber(SKY.top),
    colorToNumber(SKY.horizon),
    colorToNumber(SKY.horizon),
    1,
  );
  g.fillRect(0, 0, WORLD.width, GROUND_Y);

  g.fillStyle(colorToNumber("#dfe4ea"), 0.9);
  g.fillCircle(WORLD.width - 150, 150, 54);
  g.fillStyle(colorToNumber(SKY.top), 1);
  g.fillCircle(WORLD.width - 150, 140, 46);
}

function drawHills(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(colorToNumber(HILL.far), 1);
  g.fillEllipse(250, GROUND_Y, 700, 260);
  g.fillEllipse(900, GROUND_Y + 40, 900, 320);

  g.fillStyle(colorToNumber(HILL.near), 1);
  g.fillEllipse(0, GROUND_Y + 30, 500, 200);
  g.fillEllipse(1150, GROUND_Y + 20, 700, 240);
}

function drawGround(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(colorToNumber(GROUND.body), 1);
  g.fillRect(0, GROUND_Y, WORLD.width, GROUND_THICKNESS);

  g.fillStyle(colorToNumber(GROUND.surface), 1);
  g.fillRect(0, GROUND_Y, WORLD.width, 8);

  g.fillStyle(colorToNumber(GROUND.edge), 1);
  g.fillRect(0, GROUND_Y + 8, WORLD.width, 24);

  g.fillStyle(colorToNumber(GROUND.body), 1);
  g.fillRect(0, GROUND_Y + 32, WORLD.width, GROUND_THICKNESS - 32);

  g.fillStyle(colorToNumber(GROUND.surface), 1);
  g.fillRect(0, GROUND_Y + 4, GROUND_EDGE, 4);
  g.fillRect(WORLD.width - GROUND_EDGE, GROUND_Y + 4, GROUND_EDGE, 4);
}