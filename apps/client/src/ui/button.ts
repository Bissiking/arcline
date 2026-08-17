// apps/client/src/ui/button.ts
// Bouton Phaser réutilisable (fond arrondi + label, hover, état désactivé).

import Phaser from "phaser";
import { COLORS, RADIUS, TYPOGRAPHY, colorToNumber } from "./tokens.js";

export interface ButtonOptions {
  width: number;
  height: number;
  fontSize?: number;
  fill?: string;
  hoverFill?: string;
  textColor?: string;
  disabled?: boolean;
}

export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onPress: () => void,
  options: ButtonOptions,
): Phaser.GameObjects.Container {
  const {
    width,
    height,
    fontSize = TYPOGRAPHY.sizes.body,
    fill = COLORS.surface,
    hoverFill = COLORS.surfaceAlt,
    textColor = COLORS.text,
    disabled = false,
  } = options;

  const bg = scene.add.graphics();
  const draw = (color: string): void => {
    bg.clear();
    bg.fillStyle(colorToNumber(color), 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, RADIUS.md);
    bg.lineStyle(1, colorToNumber(COLORS.border), 0.6);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, RADIUS.md);
  };

  const text = scene.add
    .text(0, 0, label, {
      fontFamily: TYPOGRAPHY.fontFamily,
      fontSize: `${fontSize}px`,
      color: textColor,
    })
    .setOrigin(0.5);

  const container = scene.add.container(x, y, [bg, text]);

  if (disabled) {
    draw(fill);
    container.setAlpha(0.5);
    return container;
  }

  draw(fill);
  container.setSize(width, height);
  container.setInteractive({ useHandCursor: true });
  container.on("pointerover", () => draw(hoverFill));
  container.on("pointerout", () => draw(fill));
  container.on("pointerdown", () => container.setScale(0.96));
  container.on("pointerup", () => {
    container.setScale(1);
    onPress();
  });

  return container;
}