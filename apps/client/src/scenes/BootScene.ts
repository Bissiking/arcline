// apps/client/src/scenes/BootScene.ts
// Scène de démarrage : préchargera les assets plus tard, ouvre le menu.

import Phaser from "phaser";
import { SCENE_KEYS } from "./keys.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.BootScene);
  }

  create(): void {
    this.scene.start(SCENE_KEYS.MenuScene);
  }
}