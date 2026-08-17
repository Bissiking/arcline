// apps/client/src/game/archer.ts
// Archer dessiné en formes Phaser (temporaire, remplacé par un asset plus tard).
// L'ancrage est le milieu des pieds ; la géométrie suit ARCHER_HITBOXES.
// L'arc est animé : visée = rotation + tension de corde, tir = relâchement.

import Phaser from "phaser";
import { ARCHER_HITBOXES, type HitboxRect, type GameSide } from "@arcline/shared";
import { colorToNumber } from "../ui/tokens.js";
import { ARCHER_HEIGHT } from "./layout.js";

const PALETTE = {
  skin: "#e2b28c",
  skinDark: "#c9a07a",
  hair: "#2b333f",
  hood: "#2b3748",
  clothTop: "#4a6d9c",
  clothDark: "#364f70",
  legs: "#2f4259",
  boots: "#1c2a3a",
  belt: "#2a3646",
  bow: "#6e4a26",
  string: "#94a0b0",
  shaft: "#ccd2da",
  head: "#eef1f5",
  fletching: "#e0a63c",
} as const;

const HITBOX_OVERLAY = "#6fb3ff";

const BOW = {
  radius: 30,
  tipAngle: 0.87,
  centerX: 17,
  centerY: -56,
  maxDraw: 18,
  idleAngle: 14,
} as const;

export interface ArcherOptions {
  x: number;
  feetY?: number;
  side?: GameSide;
  label?: string;
  showHitboxes?: boolean;
}

export class Archer {
  readonly sprite: Phaser.GameObjects.Container;

  private readonly scene: Phaser.Scene;
  private readonly bow: Phaser.GameObjects.Graphics;
  private readonly tweenState: { draw: number; angle: number } = {
    draw: 0,
    angle: BOW.idleAngle,
  };
  private aimAngle: number = BOW.idleAngle;
  private draw = 0;
  private releaseTweenActive = false;

  constructor(scene: Phaser.Scene, options: ArcherOptions) {
    this.scene = scene;
    const { x, feetY = 0, side = "left", label, showHitboxes = false } = options;

    const body = scene.add.graphics();
    drawFigure(body);
    if (showHitboxes) drawHitboxes(body);

    this.bow = scene.add.graphics().setPosition(BOW.centerX, BOW.centerY);

    this.sprite = scene.add.container(x, feetY, [body, this.bow]).setDepth(2);
    if (side === "right") this.sprite.setScale(-1, 1);

    if (label) {
      const labelText = scene.add
        .text(0, -ARCHER_HEIGHT - 14, label, {
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          fontSize: "13px",
          color: "#8b96a8",
        })
        .setOrigin(0.5);
      this.sprite.add(labelText);
    }

    this.redrawBow();
  }

  /** Suit la visée : incline l'arc à `angle`° et tend la corde selon `power`. */
  setAim(angle: number, power: number): void {
    this.killRelease();
    this.aimAngle = Phaser.Math.Clamp(angle, 0, 90);
    this.draw = (power / 100) * BOW.maxDraw;
    this.redrawBow();
  }

  /** Relâche la corde (détente rapide) puis revient au repos. */
  release(): void {
    this.killRelease();
    this.tweenState.draw = this.draw;
    this.tweenState.angle = this.aimAngle;

    this.scene.tweens.add({
      targets: this.tweenState,
      draw: 0,
      duration: 110,
      ease: "quad.out",
      onUpdate: () => {
        this.draw = this.tweenState.draw;
        this.aimAngle = this.tweenState.angle;
        this.redrawBow();
      },
      onComplete: () => this.idle(),
    });
    this.releaseTweenActive = true;
  }

  idle(): void {
    this.killRelease();
    this.aimAngle = BOW.idleAngle;
    this.draw = 0;
    this.redrawBow();
  }

  private killRelease(): void {
    if (!this.releaseTweenActive) return;
    this.scene.tweens.killTweensOf(this.tweenState);
    this.releaseTweenActive = false;
  }

  private redrawBow(): void {
    const g = this.bow;
    g.clear();
    g.setRotation(-(this.aimAngle * Math.PI) / 180);
    drawBowGraphics(g, this.draw, PALETTE);
  }
}

function drawFigure(g: Phaser.GameObjects.Graphics): void {
  // Pieds / ombre
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(0, 2, 40, 10);

  // Bottes
  g.fillStyle(colorToNumber(PALETTE.boots), 1);
  g.fillRoundedRect(-12, -8, 11, 8, 2);
  g.fillRoundedRect(1, -8, 11, 8, 2);

  // Jambes (pantalon)
  g.fillStyle(colorToNumber(PALETTE.legs), 1);
  g.fillRoundedRect(-12, -40, 11, 32, 3);
  g.fillRoundedRect(1, -40, 11, 32, 3);

  // Torse (tunique)
  g.fillStyle(colorToNumber(PALETTE.clothTop), 1);
  g.fillRoundedRect(-13, -46, 26, 42, { tl: 4, tr: 4, bl: 2, br: 2 });

  // Ceinture + boucle
  g.fillStyle(colorToNumber(PALETTE.belt), 1);
  g.fillRect(-13, -48, 26, 7);
  g.fillStyle(colorToNumber(PALETTE.fletching), 1);
  g.fillRect(-2, -46, 4, 4);

  // Épaule avant (bras intérieur marqué)
  g.fillStyle(colorToNumber(PALETTE.clothDark), 1);
  g.fillCircle(12, -88, 6);

  // Carquois dans le dos
  g.fillStyle(colorToNumber(PALETTE.clothDark), 1);
  g.fillRoundedRect(-20, -80, 9, 48, 4);
  g.fillStyle(colorToNumber(PALETTE.fletching), 1);
  g.fillTriangle(-18, -74, -13, -74, -15.5, -82);
  g.fillTriangle(-21, -74, -16, -74, -18.5, -82);
  g.fillTriangle(-24, -74, -19, -74, -21.5, -82);

  // Capuche
  g.fillStyle(colorToNumber(PALETTE.hood), 1);
  g.fillCircle(0, -107, 13);

  // Visage
  g.fillStyle(colorToNumber(PALETTE.skin), 1);
  g.fillCircle(1, -104, 8);
  g.fillStyle(colorToNumber(PALETTE.hair), 1);
  g.fillCircle(4, -105, 1.6);

  // Bandeau
  g.fillStyle(colorToNumber(PALETTE.fletching), 1);
  g.fillRect(-12, -113, 24, 4);
}

function drawBowGraphics(
  g: Phaser.GameObjects.Graphics,
  draw: number,
  palette: typeof PALETTE,
): void {
  const tipX = BOW.radius * Math.cos(BOW.tipAngle);
  const tipY = BOW.radius * Math.sin(BOW.tipAngle);
  const nockX = tipX - draw;

  // Arc
  g.lineStyle(3.5, colorToNumber(palette.bow), 1);
  g.beginPath();
  g.arc(0, 0, BOW.radius, -BOW.tipAngle, BOW.tipAngle, false);
  g.strokePath();

  // Corde (droite au repos, en « V » quand on tire)
  g.lineStyle(1.5, colorToNumber(palette.string), 1);
  if (draw > 0.01) {
    g.lineBetween(tipX, -tipY, nockX, 0);
    g.lineBetween(nockX, 0, tipX, tipY);
  } else {
    g.lineBetween(tipX, -tipY, tipX, tipY);
  }

  // Main qui tient la corde
  g.fillStyle(colorToNumber(palette.skinDark), 1);
  g.fillCircle(nockX, 0, 5);

  // Flèche encordée
  const arrowLen = 56;
  const tailX = nockX;
  const headX = tailX + arrowLen;

  g.lineStyle(2, colorToNumber(palette.shaft), 1);
  g.lineBetween(tailX, 0, headX, 0);

  g.lineStyle(1.5, colorToNumber(palette.fletching), 1);
  g.lineBetween(tailX + 2, 0, tailX + 9, -6);
  g.lineBetween(tailX + 2, 0, tailX + 9, 6);

  g.fillStyle(colorToNumber(palette.head), 1);
  g.fillTriangle(headX + 3, 0, headX - 5, -4, headX - 5, 4);
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