// apps/client/src/game/arrow.ts
// Flèche animée le long d'une trajectoire balistique précalculée.

import Phaser from "phaser";
import type { TrajectoryPoint } from "@arcline/shared";
import { colorToNumber } from "../ui/tokens.js";

const ARROW = {
  shaft: "#ccd2da",
  head: "#eef1f5",
  fletching: "#e0a63c",
} as const;

export interface ArrowShotOptions {
  points: TrajectoryPoint[];
  originX: number;
  originY: number;
  /** Côté du tireur (permet au jeu de savoir qui est la cible). */
  side: "left" | "right";
  dt?: number;
  /** Inverse l'axe X (archer de droite qui tire vers la gauche). */
  mirror?: boolean;
  onImpact: (shot: ArrowShot, x: number, y: number, angle: number) => void;
}

export class ArrowShot {
  readonly sprite: Phaser.GameObjects.Container;
  readonly side: "left" | "right";
  private readonly points: TrajectoryPoint[];
  private readonly originX: number;
  private readonly originY: number;
  private readonly mirror: boolean;
  private readonly durationSec: number;
  private readonly onImpact: ArrowShotOptions["onImpact"];

  private elapsed = 0;
  finished = false;
  /** Vrai quand la flèche s'est plantée dans une cible. */
  hit = false;

  private worldX = 0;
  private worldY = 0;
  private worldAngle = 0;
  private prevWorldX = 0;
  private prevWorldY = 0;

  constructor(scene: Phaser.Scene, options: ArrowShotOptions) {
    this.points = options.points;
    this.originX = options.originX;
    this.originY = options.originY;
    this.side = options.side;
    this.mirror = options.mirror ?? false;
    this.onImpact = options.onImpact;
    this.durationSec = (options.points.length - 1) * (options.dt ?? 1 / 60);

    const g = scene.add.graphics();
    drawArrowSprite(g);

    this.sprite = scene.add
      .container(this.originX, this.originY, [g])
      .setDepth(15);

    this.positionAt(0);
  }

  update(delta: number): void {
    if (this.finished) return;

    this.elapsed += delta / 1000;
    const totalSteps = Math.max(this.points.length - 1, 1);

    if (this.elapsed >= this.durationSec) {
      const last = this.points[this.points.length - 1]!;
      const wx = this.originX + (this.mirror ? -last.x : last.x);
      const wy = this.originY + last.y;
      const angle = this.segmentAngle();
      this.track(wx, wy, angle);
      this.finished = true;
      this.onImpact(this, wx, wy, angle);
      return;
    }

    const position = (this.elapsed / this.durationSec) * totalSteps;
    this.positionAt(position);
  }

  destroy(): void {
    this.finished = true;
    this.sprite.destroy();
  }

  /** Position monde courante et angle (pour la détection d'impact). */
  get position(): { x: number; y: number; angle: number } {
    return { x: this.worldX, y: this.worldY, angle: this.worldAngle };
  }

  /** Position monde à la frame précédente (test de collision segment). */
  get previousPosition(): { x: number; y: number } {
    return { x: this.prevWorldX, y: this.prevWorldY };
  }

  /** Plante la flèche à une position donnée (impact sur une cible). */
  stick(x: number, y: number, angle: number): void {
    this.finished = true;
    this.hit = true;
    this.sprite.setPosition(x, y).setRotation(angle);
    this.track(x, y, angle);
  }

  private track(wx: number, wy: number, angle: number): void {
    this.prevWorldX = this.worldX;
    this.prevWorldY = this.worldY;
    this.worldX = wx;
    this.worldY = wy;
    this.worldAngle = angle;
  }

  private positionAt(position: number): void {
    const totalSteps = Math.max(this.points.length - 1, 1);
    const index = Phaser.Math.Clamp(position, 0, totalSteps);
    const from = this.points[Math.floor(index)]!;
    const to = this.points[Math.min(Math.floor(index) + 1, totalSteps)]!;
    const fraction = index - Math.floor(index);

    const x = from.x + (to.x - from.x) * fraction;
    const y = from.y + (to.y - from.y) * fraction;
    const horizontal = this.mirror ? -(to.x - from.x) : to.x - from.x;
    const angle = Math.atan2(to.y - from.y, horizontal);

    const wx = this.originX + (this.mirror ? -x : x);
    const wy = this.originY + y;
    this.track(wx, wy, angle);

    this.sprite.setPosition(wx, wy).setRotation(angle);
  }

  private segmentAngle(): number {
    const totalSteps = Math.max(this.points.length - 1, 1);
    const from = this.points[totalSteps - 1]!;
    const to = this.points[totalSteps]!;
    const horizontal = this.mirror ? -(to.x - from.x) : to.x - from.x;
    return Math.atan2(to.y - from.y, horizontal);
  }
}

function drawArrowSprite(g: Phaser.GameObjects.Graphics): void {
  g.lineStyle(2, colorToNumber(ARROW.shaft), 1);
  g.lineBetween(-13, 0, 11, 0);

  g.lineStyle(1.5, colorToNumber(ARROW.fletching), 1);
  g.lineBetween(-13, 0, -8, -5);
  g.lineBetween(-13, 0, -8, 5);

  g.fillStyle(colorToNumber(ARROW.head), 1);
  g.fillTriangle(16, 0, 8, -3.5, 8, 3.5);
}