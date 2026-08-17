// apps/client/src/main.ts
// Point d'entrée du client Phaser.

import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene.js";
import { GameScene } from "./scenes/GameScene.js";
import { MenuScene } from "./scenes/MenuScene.js";
import { VIEWPORT } from "./game/layout.js";
import { COLORS } from "./ui/tokens.js";
import "./style.css";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "app",
  scale: {
    mode: Phaser.Scale.FIT,
    width: VIEWPORT.width,
    height: VIEWPORT.height,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  backgroundColor: COLORS.bg,
  scene: [BootScene, MenuScene, GameScene],
});