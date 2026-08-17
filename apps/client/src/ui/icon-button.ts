// apps/client/src/ui/icon-button.ts
// Bouton circulaire à icône (menu · réglages) : cercle, liseré, survol,
// pressé, ombre. Pas de texte — pratique pour un HUD compact.

import Phaser from "phaser";
import { COLORS, colorToNumber } from "./tokens.js";

export type IconKind = "menu" | "gear";

export interface IconButtonOptions {
  /** Diamètre du bouton (px). */
  size?: number;
  fill?: string;
  hoverFill?: string;
  iconColor?: string;
  border?: string;
}

export function createIconButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  kind: IconKind,
  onPress: () => void,
  options: IconButtonOptions = {},
): Phaser.GameObjects.Container {
  const {
    size = 42,
    fill = COLORS.surface,
    hoverFill = COLORS.surfaceAlt,
    iconColor = COLORS.accent,
    border = COLORS.border,
  } = options;

  const half = size / 2;
  const g = scene.add.graphics();

  const draw = (background: string): void => {
    g.clear();
    g.fillStyle(0x000000, 0.25);
    g.fillCircle(0, half * 0.14, half + 0.5);
    g.fillStyle(colorToNumber(background), 1);
    g.fillCircle(0, 0, half);
    g.lineStyle(1.5, colorToNumber(border), 0.9);
    g.strokeCircle(0, 0, half - 0.75);
    drawIcon(g, kind, iconColor, background);
  };

  const container = scene.add.container(x, y, [g]);
  draw(fill);
  container.setSize(size, size);
  container.setInteractive({ useHandCursor: true });
  container.on("pointerover", () => draw(hoverFill));
  container.on("pointerout", () => draw(fill));
  container.on("pointerdown", () => container.setScale(0.92));
  container.on("pointerup", () => {
    container.setScale(1);
    onPress();
  });

  return container;
}

/** Roue crantée (réglages) ou menu (trois lignes). `background` sert à découper l'axe. */
function drawIcon(
  g: Phaser.GameObjects.Graphics,
  kind: IconKind,
  color: string,
  background: string,
): void {
  g.fillStyle(colorToNumber(color), 1);

  if (kind === "menu") {
    const y0 = -9;
    for (let i = 0; i < 3; i += 1) {
      g.fillRoundedRect(-11, y0 + i * 9, 22, 5, 2.5);
    }
    return;
  }

  // Roue crantée : 8 dents autour d'un moyeu central.
  const body = 9.5;
  const teethRadius = body + 4.5;
  const toothCount = 8;
  for (let i = 0; i < toothCount; i += 1) {
    const angle = (i / toothCount) * Math.PI * 2;
    const tx = Math.cos(angle) * teethRadius;
    const ty = Math.sin(angle) * teethRadius;
    g.save();
    g.translateCanvas(tx, ty);
    g.rotateCanvas(angle);
    g.fillRoundedRect(-2, -3.2, 4, 6.4, 1.4);
    g.restore();
  }
  g.fillCircle(0, 0, body);
  g.fillStyle(colorToNumber(background), 1);
  g.fillCircle(0, 0, 3.6);
}