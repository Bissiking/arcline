// apps/client/src/game/aim.ts
// Contrôleur de visée souris : clic → drag vers la cible (angle + puissance)
// → relâchement → tir. La puissance vient de la distance de drag.

import Phaser from "phaser";
import { COLORS, TYPOGRAPHY, colorToNumber } from "../ui/tokens.js";
import { AIM, computeAim, isValidAngle, isValidPower, type AimPoint } from "./aim-math.js";

export { AIM } from "./aim-math.js";

export interface AimControllerOptions {
  originX: number;
  originY: number;
  powerDistance?: number;
  onShot: (angle: number, power: number) => void;
  /** Appelé pendant le drag (ex. tendre l'arc). */
  onAim?: (angle: number, power: number) => void;
  /** Appelé quand le drag ne produit pas de tir (ex. reposer l'arc). */
  onAimEnd?: () => void;
}

interface DragStart {
  x: number;
  y: number;
}

export class AimController {
  private readonly scene: Phaser.Scene;
  private readonly originX: number;
  private readonly originY: number;
  private readonly powerDistance: number;
  private readonly onShot: (angle: number, power: number) => void;
  private readonly onAim?: (angle: number, power: number) => void;
  private readonly onAimEnd?: () => void;

  private readonly ray: Phaser.GameObjects.Graphics;
  private readonly readout: Phaser.GameObjects.Text;
  private enabled = true;
  private dragging = false;
  private start: DragStart | null = null;

  constructor(scene: Phaser.Scene, options: AimControllerOptions) {
    this.scene = scene;
    this.originX = options.originX;
    this.originY = options.originY;
    this.powerDistance = options.powerDistance ?? AIM.powerDistance;
    this.onShot = options.onShot;
    this.onAim = options.onAim;
    this.onAimEnd = options.onAimEnd;

    this.ray = scene.add.graphics().setDepth(20);
    this.readout = scene.add
      .text(0, 0, "", {
        fontFamily: TYPOGRAPHY.fontFamily,
        fontSize: `${TYPOGRAPHY.sizes.small}px`,
        color: COLORS.text,
        backgroundColor: "#00000066",
        padding: { left: 8, right: 8, top: 4, bottom: 4 },
      })
      .setOrigin(0.5, 1)
      .setVisible(false);
    this.readout.setDepth(21);

    scene.input.on("pointerdown", this.handleDown, this);
    scene.input.on("pointermove", this.handleMove, this);
    scene.input.on("pointerup", this.handleUp, this);
    scene.input.on("pointerupoutside", this.handleUp, this);
  }

  destroy(): void {
    this.scene.input.off("pointerdown", this.handleDown, this);
    this.scene.input.off("pointermove", this.handleMove, this);
    this.scene.input.off("pointerup", this.handleUp, this);
    this.scene.input.off("pointerupoutside", this.handleUp, this);
    this.ray.destroy();
    this.readout.destroy();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      if (this.dragging) this.onAimEnd?.();
      this.dragging = false;
      this.start = null;
      this.clear();
    }
  }

  private handleDown(pointer: Phaser.Input.Pointer): void {
    if (!this.enabled) return;
    if (!pointer.leftButtonDown()) return;
    this.dragging = true;
    this.start = { x: pointer.worldX, y: pointer.worldY };
    this.clear();
  }

  private handleMove(pointer: Phaser.Input.Pointer): void {
    if (!this.enabled) return;
    if (!this.dragging || !this.start) return;
    const point = this.compute(this.start, pointer);
    this.draw(this.start, pointer, point);
    this.onAim?.(point.angle, point.power);
  }

  private handleUp(pointer: Phaser.Input.Pointer): void {
    if (!this.enabled) return;
    if (!this.dragging || !this.start) return;
    this.dragging = false;

    const point = this.compute(this.start, pointer);
    this.clear();

    if (point.power < AIM.minPower) {
      this.onAimEnd?.();
      return;
    }
    if (!isValidAngle(point.angle) || !isValidPower(point.power)) {
      this.onAimEnd?.();
      return;
    }

    this.onShot(point.angle, point.power);
  }

  private compute(start: DragStart, pointer: Phaser.Input.Pointer): AimPoint {
    return computeAim(start.x, start.y, pointer.worldX, pointer.worldY, this.powerDistance);
  }

  private draw(start: DragStart, pointer: Phaser.Input.Pointer, point: AimPoint): void {
    this.ray.clear();

    // Trait de drag (axe de visée, du premier clic au curseur)
    this.ray.lineStyle(2, colorToNumber(COLORS.textMuted), 0.6);
    this.ray.lineBetween(start.x, start.y, pointer.worldX, pointer.worldY);
    this.ray.fillStyle(colorToNumber(COLORS.textMuted), 0.7);
    this.ray.fillCircle(start.x, start.y, 4);

    this.drawCrosshair(pointer);
    this.drawLaunchRay(point);
    this.drawPowerMeter(pointer, point);
    this.drawReadout(pointer, point);
  }

  private drawCrosshair(pointer: Phaser.Input.Pointer): void {
    const { worldX, worldY } = pointer;
    this.ray.lineStyle(1.5, colorToNumber(COLORS.textMuted), 0.9);
    this.ray.lineBetween(worldX - 9, worldY, worldX - 3, worldY);
    this.ray.lineBetween(worldX + 3, worldY, worldX + 9, worldY);
    this.ray.lineBetween(worldX, worldY - 9, worldX, worldY - 3);
    this.ray.lineBetween(worldX, worldY + 3, worldX, worldY + 9);
  }

  /** Jauge de puissance près du curseur (remplie selon la force du drag). */
  private drawPowerMeter(pointer: Phaser.Input.Pointer, point: AimPoint): void {
    const x = pointer.worldX - 30;
    const y = pointer.worldY + 20;
    const W = 60;
    const H = 6;

    this.ray.fillStyle(colorToNumber(COLORS.surface), 0.9);
    this.ray.fillRoundedRect(x, y, W, H, 3);

    const ratio = Phaser.Math.Clamp(point.power / 100, 0, 1);
    if (ratio > 0) {
      const color =
        point.power < 55
          ? COLORS.success
          : point.power < 85
            ? COLORS.accent
            : COLORS.danger;
      this.ray.fillStyle(colorToNumber(color), 1);
      this.ray.fillRoundedRect(x + 1, y + 1, Math.max((W - 2) * ratio, 2), H - 2, 2);
    }
  }

  private drawLaunchRay(point: AimPoint): void {
    const radius = (point.angle * Math.PI) / 180;
    const length = 30 + point.power * 3;
    const endX = this.originX + Math.cos(radius) * length;
    const endY = this.originY - Math.sin(radius) * length;

    this.ray.lineStyle(3, colorToNumber(COLORS.accent), 0.85);
    this.ray.lineBetween(this.originX, this.originY, endX, endY);

    const dirX = Math.cos(radius);
    const dirY = -Math.sin(radius);
    const headX = endX - dirX * 12;
    const headY = endY - dirY * 12;
    this.ray.fillStyle(colorToNumber(COLORS.accent), 0.9);
    this.ray.fillTriangle(
      endX,
      endY,
      headX - dirY * 6,
      headY + dirX * 6,
      headX + dirY * 6,
      headY - dirX * 6,
    );
  }

  private drawReadout(pointer: Phaser.Input.Pointer, point: AimPoint): void {
    this.readout
      .setText(
        `Angle ${Math.round(point.angle)}° · Puissance ${Math.round(point.power)}%`,
      )
      .setPosition(pointer.worldX, pointer.worldY - 18)
      .setVisible(true);
  }

  private clear(): void {
    this.ray.clear();
    this.readout.setVisible(false);
  }
}

export type { AimPoint } from "./aim-math.js";