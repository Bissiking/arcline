// apps/client/src/game/archer.ts
// Archer temporaire dessiné en formes Phaser (remplacé par un asset plus tard).
// L'ancrage est le milieu des pieds ; la géométrie suit ARCHER_HITBOXES.

import Phaser from "phaser";
import { ARCHER_HITBOXES, type HitboxRect } from "@arcline/shared";
import { colorToNumber } from "../ui/tokens.js";
import { ARCHER_HEIGHT } from "./layout.js";

const PALETTE = {
  skin: "#e2b28c",
  hair: "#2b2f38",
  clothTop: "#4a6d9c",
  clothDark: "#364f70",
  legs: "#2f4259",
  belt: "#2a3646",
  bow: "#6e4a26",
  string: "#94a0b0",
  shaft: "#ccd2da",
  head: "#eef1f5",
  fletching: "#e0a63c",
} as const;

const HITBOX_OVERLAY = "#6fb3ff";

export interface ArcherOptions {
  x: number;
  feetY?: number;
  facing?: "left" | "right";
  label?: string;
  showHitboxes?: boolean;
}

export function createArcher(
  scene: Phaser.Scene,
  options: ArcherOptions,
): { sprite: Phaser.GameObjects.Container; labelText?: Phaser.GameObjects.Text } {
  const {
    x,
    feetY = 0,
    facing = "right",
    label,
    showHitboxes = false,
  } = options;

  const g = scene.add.graphics();
  drawFigure(g);
  if (showHitboxes) drawHitboxes(g);

  const sprite = scene.add.container(x, feetY, [g]);
  if (facing === "right") sprite.setScale(-1, 1);

  let labelText: Phaser.GameObjects.Text | undefined;
  if (label) {
    labelText = scene.add
      .text(0, -ARCHER_HEIGHT - 14, label, {
        fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        fontSize: "13px",
        color: "#8b96a8",
      })
      .setOrigin(0.5);
    sprite.add(labelText);
  }

  return { sprite, labelText };
}

function drawFigure(g: Phaser.GameObjects.Graphics): void {
  // Jambes
  g.fillStyle(colorToNumber(PALETTE.legs), 1);
  g.fillRoundedRect(-11, -36, 9, 36, 3);
  g.fillRoundedRect(2, -36, 9, 36, 3);

  // Torse
  g.fillStyle(colorToNumber(PALETTE.clothTop), 1);
  g.fillRoundedRect(-12, -84, 24, 48, { tl: 5, tr: 5, bl: 2, br: 2 });

  // Ceinture
  g.fillStyle(colorToNumber(PALETTE.belt), 1);
  g.fillRect(-13, -46, 26, 6);

  // Carquois dans le dos
  g.fillStyle(colorToNumber(PALETTE.clothDark), 1);
  g.fillRoundedRect(-18, -78, 8, 40, 3);

  // Tête
  g.fillStyle(colorToNumber(PALETTE.skin), 1);
  g.fillCircle(0, -101, 11);

  // Bandeau
  g.fillStyle(colorToNumber(PALETTE.fletching), 1);
  g.fillRect(-11, -107, 22, 4);

  // Arc (tourné vers la droite, dos à gauche)
  const bowR = 30;
  const bowTipAngle = 0.87;
  const bowCx = 12;
  const bowCy = -58;
  const tipX = bowCx + bowR * Math.cos(bowTipAngle);
  const tipY = bowR * Math.sin(bowTipAngle);

  g.lineStyle(3, colorToNumber(PALETTE.bow), 1);
  g.beginPath();
  g.arc(bowCx, bowCy, bowR, -bowTipAngle, bowTipAngle, false);
  g.strokePath();

  // Corde
  g.lineStyle(1, colorToNumber(PALETTE.string), 0.9);
  g.lineBetween(tipX, bowCy - tipY, tipX, bowCy + tipY);

  // Flèche encordée
  const nockX = tipX;
  const arrowLen = 54;
  const tip = nockX + arrowLen;

  g.lineStyle(2, colorToNumber(PALETTE.shaft), 1);
  g.lineBetween(nockX, bowCy, tip, bowCy);

  g.lineStyle(1, colorToNumber(PALETTE.fletching), 1);
  g.lineBetween(nockX + 2, bowCy, nockX + 10, bowCy - 7);
  g.lineBetween(nockX + 2, bowCy, nockX + 10, bowCy + 7);

  g.fillStyle(colorToNumber(PALETTE.head), 1);
  g.fillTriangle(tip + 3, bowCy, tip - 5, bowCy - 4, tip - 5, bowCy + 4);
}

function drawHitboxes(g: Phaser.GameObjects.Graphics): void {
  const color = colorToNumber(HITBOX_OVERLAY);
  for (const hb of ARCHER_HITBOXES) {
    drawRect(g, hb, color);
  }
}

function drawRect(
  g: Phaser.GameObjects.Graphics,
  hb: HitboxRect,
  color: number,
): void {
  const left = -hb.halfWidth;
  const top = -(hb.yFromGround + hb.halfHeight);
  const width = hb.halfWidth * 2;
  const height = hb.halfHeight * 2;

  g.fillStyle(color, 0.14);
  g.fillRect(left, top, width, height);

  g.lineStyle(1, color, 0.6);
  g.strokeRect(left, top, width, height);
}