// apps/client/src/ui/pill.ts
// Chip/étiquette arrondie à largeur automatique, avec possibilité de changer
// le texte et la tonalité (ex. bannière de tour, vent).

import Phaser from "phaser";
import { COLORS, RADIUS, TYPOGRAPHY, colorToNumber } from "./tokens.js";

export interface PillOptions {
  fill?: string;
  fillTop?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  letterSpacing?: number;
  uppercase?: boolean;
  border?: string;
  height?: number;
  paddingX?: number;
  shadow?: boolean;
}

export interface Pill {
  container: Phaser.GameObjects.Container;
  setText(text: string): void;
  setTone(fill: string, textColor: string, border?: string): void;
}

export function createPill(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  options: PillOptions = {},
): Pill {
  let {
    fill = COLORS.surface,
    textColor = COLORS.text,
    fontSize = TYPOGRAPHY.sizes.small,
    fontFamily = TYPOGRAPHY.fontFamily,
    fontWeight = TYPOGRAPHY.weights.semibold,
    letterSpacing = 1,
    uppercase = false,
    border = COLORS.border,
    height = 34,
    paddingX = 16,
    shadow = true,
  } = options;

  const bg = scene.add.graphics();
  const label = scene.add
    .text(0, 0, "", {
      fontFamily,
      fontSize: `${fontSize}px`,
      color: textColor,
    })
    .setFont(`${fontWeight} ${fontSize}px ${fontFamily}`)
    .setLetterSpacing(letterSpacing)
    .setOrigin(0.5);

  const layout = (): void => {
    const width = label.width + paddingX * 2;
    const radius = Math.min(RADIUS.md, height / 2);
    const halfW = width / 2;
    const halfH = height / 2;

    bg.clear();
    if (shadow) {
      bg.fillStyle(0x000000, 0.25);
      bg.fillRoundedRect(-halfW, -halfH + 2, width, height, radius);
    }
    bg.fillStyle(colorToNumber(fillTop ?? fill), 1);
    bg.fillRoundedRect(-halfW, -halfH, width, height, radius);
    bg.lineStyle(1, colorToNumber(border), 0.9);
    bg.strokeRoundedRect(-halfW + 0.75, -halfH + 0.75, width - 1.5, height - 1.5, radius);
  };

  let fillTop = options.fillTop;
  const applyLabel = (): void => {
    label.setText(uppercase ? text.toUpperCase() : text);
    label.setColor(textColor);
  };

  applyLabel();
  layout();

  const container = scene.add.container(x, y, [bg, label]);

  return {
    container,
    setText(next: string): void {
      text = next;
      applyLabel();
      layout();
    },
    setTone(nextFill: string, nextColor: string, nextBorder?: string): void {
      fill = nextFill;
      fillTop = nextFill;
      textColor = nextColor;
      border = nextBorder ?? border;
      applyLabel();
      layout();
    },
  };
}