// apps/client/src/ui/settings-menu.ts
// Panneau de réglages en jeu : musique, sons, volume, tracé de la dernière
// flèche et aide (prédiction d'atterrissage).

import Phaser from "phaser";
import type { GameSettings } from "../game/settings.js";
import { createButton } from "./button.js";
import { COLORS, RADIUS, TYPOGRAPHY, colorToNumber } from "./tokens.js";

const PANEL = {
  width: 440,
  height: 400,
} as const;

const ROW_Y = {
  music: -118,
  sfx: -76,
  volume: -34,
  aid: 10,
  trace: 52,
} as const;

export interface SettingsMenuOptions {
  x: number;
  y: number;
  settings: GameSettings;
  onChange: (settings: GameSettings) => void;
  onClose: () => void;
}

export interface SettingsMenuHandle {
  destroy(): void;
  setVisible(visible: boolean): void;
}

export function createSettingsMenu(
  scene: Phaser.Scene,
  options: SettingsMenuOptions,
): SettingsMenuHandle {
  const { x: cx, y: cy, onChange, onClose } = options;
  const objects: (
    | Phaser.GameObjects.Graphics
    | Phaser.GameObjects.Text
    | Phaser.GameObjects.Container
    | Phaser.GameObjects.Rectangle
  )[] = [];

  const dim = scene.add
    .rectangle(
      scene.scale.width / 2,
      scene.scale.height / 2,
      scene.scale.width,
      scene.scale.height,
      0x000000,
      0.45,
    )
    .setDepth(59);
  objects.push(dim);

  const bg = scene.add.graphics().setDepth(60);
  drawPanel(bg, 0, 0);
  bg.setPosition(cx, cy);
  objects.push(bg);

  const title = scene.add
    .text(cx, cy - PANEL.height / 2 + 36, "RÉGLAGES", {
      fontFamily: TYPOGRAPHY.fontFamilyTitle,
      fontSize: `${TYPOGRAPHY.sizes.heading}px`,
      color: COLORS.accent,
    })
    .setLetterSpacing(4)
    .setOrigin(0.5)
    .setDepth(61);
  objects.push(title);

  const addRowLabel = (y: number, label: string): void => {
    objects.push(
      scene.add
        .text(cx - 90, cy + y, label, {
          fontFamily: TYPOGRAPHY.fontFamily,
          fontSize: `${TYPOGRAPHY.sizes.small}px`,
          color: COLORS.text,
        })
        .setOrigin(1, 0.5)
        .setDepth(61),
    );
  };

  const togglePill = (y: number, initial: boolean, onToggle: (v: boolean) => void): void => {
    const g = scene.add.graphics();
    const label = scene.add
      .text(0, 0, "", {
        fontFamily: TYPOGRAPHY.fontFamily,
        fontSize: `${TYPOGRAPHY.sizes.small}px`,
        color: COLORS.text,
      })
      .setOrigin(0.5);
    let value = initial;

    const draw = (): void => {
      g.clear();
      const fill = value ? COLORS.accent : COLORS.surfaceAlt;
      g.fillStyle(colorToNumber(fill), 1);
      g.fillRoundedRect(-34, -15, 68, 30, RADIUS.md);
      g.lineStyle(1, colorToNumber(COLORS.border), 0.6);
      g.strokeRoundedRect(-34, -15, 68, 30, RADIUS.md);
      label.setText(value ? "OUI" : "NON");
      label.setColor(value ? COLORS.bg : COLORS.text);
    };

    draw();
    const container = scene.add.container(cx + 90, cy + y, [g, label]).setDepth(61);
    container.setSize(68, 30);
    container.setInteractive({ useHandCursor: true });
    container.on("pointerup", () => {
      value = !value;
      draw();
      onToggle(value);
    });
    objects.push(container);
  };

  const volume = (y: number, initial: number): void => {
    let value = initial;
    const valueText = scene.add
      .text(cx + 90, cy + y, "", {
        fontFamily: TYPOGRAPHY.fontFamily,
        fontSize: `${TYPOGRAPHY.sizes.body}px`,
        color: COLORS.text,
      })
      .setOrigin(0.5)
      .setDepth(61);

    const update = (): void => {
      valueText.setText(`${Math.round(value * 100)}`);
    };

    const apply = (delta: number): void => {
      value = Math.min(1, Math.max(0, value + delta));
      update();
      onChange({ ...options.settings, volume: value });
    };

    objects.push(
      createButton(scene, cx + 30, cy + y, "−", () => apply(-0.1), {
        width: 44,
        height: 34,
        fontSize: 22,
        textColor: COLORS.text,
      }).setDepth(61),
    );
    objects.push(valueText);
    objects.push(
      createButton(scene, cx + 150, cy + y, "+", () => apply(0.1), {
        width: 44,
        height: 34,
        fontSize: 22,
        textColor: COLORS.text,
      }).setDepth(61),
    );

    update();
  };

  const close = createButton(
    scene,
    cx,
    cy + PANEL.height / 2 - 44,
    "Fermer",
    onClose,
    {
      width: 160,
      height: 44,
      fontSize: TYPOGRAPHY.sizes.body,
      fill: COLORS.accent,
      hoverFill: COLORS.accentHover,
      textColor: COLORS.bg,
    },
  ).setDepth(61);
  objects.push(close);

  addRowLabel(ROW_Y.music, "Musique");
  togglePill(ROW_Y.music, options.settings.musicEnabled, (v) =>
    onChange({ ...options.settings, musicEnabled: v }),
  );

  addRowLabel(ROW_Y.sfx, "Sons");
  togglePill(ROW_Y.sfx, options.settings.sfxEnabled, (v) =>
    onChange({ ...options.settings, sfxEnabled: v }),
  );

  addRowLabel(ROW_Y.volume, "Volume");
  volume(ROW_Y.volume, options.settings.volume);

  addRowLabel(ROW_Y.aid, "Aide (atterrissage)");
  togglePill(ROW_Y.aid, options.settings.showAid, (v) =>
    onChange({ ...options.settings, showAid: v }),
  );

  addRowLabel(ROW_Y.trace, "Tracé de la dernière flèche");
  togglePill(ROW_Y.trace, options.settings.showLastTrace, (v) =>
    onChange({ ...options.settings, showLastTrace: v }),
  );

  return {
    setVisible(visible: boolean): void {
      for (const object of objects) object.setVisible(visible);
    },
    destroy(): void {
      for (const object of objects) object.destroy();
    },
  };
}

function drawPanel(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
): void {
  const halfW = PANEL.width / 2;
  const halfH = PANEL.height / 2;
  g.fillStyle(colorToNumber(COLORS.surface), 0.98);
  g.fillRoundedRect(x - halfW, y - halfH, PANEL.width, PANEL.height, RADIUS.lg);
  g.lineStyle(1, colorToNumber(COLORS.border), 0.8);
  g.strokeRoundedRect(x - halfW, y - halfH, PANEL.width, PANEL.height, RADIUS.lg);
}
