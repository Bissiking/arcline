// apps/client/src/scenes/GameScene.ts
// Scène de partie : monde, terrain, archer (solo contre l'IA en V1).

import Phaser from "phaser";
import { createArcher } from "../game/archer.js";
import { GROUND_Y, PLAYER_FEET_X, SIDE_LABEL, WORLD } from "../game/layout.js";
import { drawTerrain } from "../game/terrain.js";
import { createButton } from "../ui/button.js";
import { COLORS, TYPOGRAPHY, colorToNumber } from "../ui/tokens.js";
import { SCENE_KEYS } from "./keys.js";

export class GameScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.GameScene);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bg);

    drawTerrain(this);

    createArcher(this, {
      x: PLAYER_FEET_X.left,
      feetY: GROUND_Y,
      facing: "right",
      label: SIDE_LABEL.left,
      showHitboxes: true,
    });

    this.drawOpponentSpot();

    this.add
      .text(WORLD.width / 2, 28, "Phase 3 · Terrain & archer", {
        fontFamily: TYPOGRAPHY.fontFamily,
        fontSize: `${TYPOGRAPHY.sizes.tiny}px`,
        color: COLORS.textDisabled,
      })
      .setOrigin(0.5);

    createButton(
      this,
      110,
      28,
      "Menu",
      () => this.scene.start(SCENE_KEYS.MenuScene),
      {
        width: 140,
        height: 36,
        fontSize: 14,
        fill: COLORS.surface,
        hoverFill: COLORS.surfaceAlt,
        textColor: COLORS.text,
      },
    );
  }

  private drawOpponentSpot(): void {
    const x = PLAYER_FEET_X.right;
    const y = GROUND_Y;

    const marker = this.add.graphics();
    marker.lineStyle(2, colorToNumber(COLORS.border), 0.8);
    marker.strokeEllipse(x, y - 6, 96, 42);
    marker.lineStyle(1, colorToNumber(COLORS.border), 0.5);
    marker.strokeEllipse(x, y - 6, 66, 26);

    this.add
      .text(x, y - 66, "Adversaire IA · Phase 7", {
        fontFamily: TYPOGRAPHY.fontFamily,
        fontSize: `${TYPOGRAPHY.sizes.small}px`,
        color: COLORS.textDisabled,
      })
      .setOrigin(0.5);
  }
}