// apps/client/src/ui/button.ts
// Bouton Phaser « tournoi » : dégradé vertical, liseré, ombre douce,
// pressé/affiché/état désactivé, typo display ou body.

import Phaser from "phaser";
import { COLORS, RADIUS, TYPOGRAPHY, colorShift, colorToNumber } from "./tokens.js";

export interface ButtonOptions {
  width: number;
  height: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  letterSpacing?: number;
  uppercase?: boolean;
  fill?: string;
  hoverFill?: string;
  textColor?: string;
  border?: string;
  shadow?: boolean;
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
    fontFamily = TYPOGRAPHY.fontFamily,
    fontWeight = TYPOGRAPHY.weights.semibold,
    letterSpacing = 0,
    uppercase = false,
    fill = COLORS.surface,
    hoverFill = COLORS.surfaceAlt,
    textColor = COLORS.text,
    border = COLORS.border,
    shadow = true,
    disabled = false,
  } = options;

  const radius = Math.min(RADIUS.md, height / 2);
  const halfW = width / 2;
  const halfH = height / 2;
  const text = label.toUpperCase();

  const bg = scene.add.graphics();
  const draw = (color: string): void => {
    bg.clear();
    if (shadow) {
      bg.fillStyle(0x000000, 0.28);
      bg.fillRoundedRect(-halfW, -halfH + 3, width, height, radius);
    }
    const top = colorShift(color, 0.14);
    bg.fillGradientStyle(top, top, colorToNumber(color), colorToNumber(color), 1);
    bg.fillRoundedRect(-halfW, -halfH, width, height, radius);
    bg.lineStyle(1, colorToNumber(border), 0.9);
    bg.strokeRoundedRect(-halfW + 0.75, -halfH + 0.75, width - 1.5, height - 1.5, radius);
  };

  const labelText = scene.add
    .text(0, 0, text, {
      fontFamily,
      fontSize: `${fontSize}px`,
      color: textColor,
    })
    .setFont(`${fontWeight} ${fontSize}px ${fontFamily}`)
    .setLetterSpacing(letterSpacing)
    .setOrigin(0.5);

  const container = scene.add.container(x, y, [bg, labelText]);

  if (disabled) {
    draw(fill);
    container.setAlpha(0.55);
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