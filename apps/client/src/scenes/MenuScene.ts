// apps/client/src/scenes/MenuScene.ts
// Menu principal : titre, bouton Solo (→ GameScene), bouton Multiplayer verrouillé.

import Phaser from "phaser";
import { createButton } from "../ui/button.js";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, colorToNumber } from "../ui/tokens.js";
import { SCENE_KEYS } from "./keys.js";

const MENU_CENTER_Y = 0.42;

export class MenuScene extends Phaser.Scene {
  private ui?: Phaser.GameObjects.Container;
  private footer?: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.MenuScene);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.buildLayout();
    this.centerUi();
    this.scale.on("resize", this.centerUi, this);
  }

  private buildLayout(): void {
    const title = this.add
      .text(0, -170, "ARCLINE", {
        fontFamily: TYPOGRAPHY.fontFamilyTitle,
        fontSize: `${TYPOGRAPHY.sizes.headline}px`,
        color: COLORS.accent,
      })
      .setLetterSpacing(10)
      .setOrigin(0.5);

    const tagline = this.add
      .text(0, -104, "Duel d'archers au tour par tour", {
        fontFamily: TYPOGRAPHY.fontFamily,
        fontSize: "17px",
        color: COLORS.textMuted,
      })
      .setOrigin(0.5);

    const divider = this.add.graphics();
    divider.lineStyle(2, colorToNumber(COLORS.border), 1);
    divider.lineBetween(-110, -62, 110, -62);

    const modeLabel = this.add
      .text(0, -34, "Choisissez un mode", {
        fontFamily: TYPOGRAPHY.fontFamily,
        fontSize: `${TYPOGRAPHY.sizes.small}px`,
        color: COLORS.textMuted,
      })
      .setLetterSpacing(3)
      .setOrigin(0.5);

    const soloButton = createButton(
      this,
      0,
      18,
      "Jouer en solo",
      () => this.scene.start(SCENE_KEYS.GameScene),
      {
        width: 280,
        height: 56,
        fontSize: 20,
        fill: COLORS.accent,
        hoverFill: COLORS.accentHover,
        textColor: COLORS.bg,
      },
    );

    const multiplayerButton = createButton(
      this,
      0,
      104,
      "🔒  Multiplayer",
      () => undefined,
      {
        width: 280,
        height: 56,
        fontSize: 20,
        fill: COLORS.surface,
        hoverFill: COLORS.surface,
        textColor: COLORS.textDisabled,
        disabled: true,
      },
    );

    const soonBadge = this.createSoonBadge(220, 104);

    const hint = this.add
      .text(0, 158, "Le mode multijoueur arrive en V2", {
        fontFamily: TYPOGRAPHY.fontFamily,
        fontSize: `${TYPOGRAPHY.sizes.small}px`,
        color: COLORS.textDisabled,
      })
      .setOrigin(0.5);

    this.ui = this.add.container(0, 0, [
      title,
      tagline,
      divider,
      modeLabel,
      soloButton,
      multiplayerButton,
      soonBadge,
      hint,
    ]);
    this.ui.setAlpha(0);
    this.tweens.add({ targets: this.ui, alpha: 1, duration: 450, ease: "sine.out" });
    this.tweens.add({
      targets: title,
      scale: 1.03,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });

    this.footer = this.add
      .text(0, 0, "V1 · Développement", {
        fontFamily: TYPOGRAPHY.fontFamily,
        fontSize: `${TYPOGRAPHY.sizes.tiny}px`,
        color: COLORS.textDisabled,
      })
      .setOrigin(0.5, 1);
  }

  private createSoonBadge(x: number, y: number): Phaser.GameObjects.Container {
    const width = 92;
    const height = 28;
    const bg = this.add.graphics();
    bg.fillStyle(colorToNumber(COLORS.surfaceAlt), 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, RADIUS.lg);
    bg.lineStyle(1, colorToNumber(COLORS.accent), 0.7);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, RADIUS.lg);

    const label = this.add
      .text(0, 0, "Bientôt", {
        fontFamily: TYPOGRAPHY.fontFamily,
        fontSize: `${TYPOGRAPHY.sizes.tiny}px`,
        color: COLORS.accent,
      })
      .setLetterSpacing(1)
      .setOrigin(0.5);

    return this.add.container(x, y, [bg, label]);
  }

  private centerUi(): void {
    const { width, height } = this.scale;
    this.ui?.setPosition(width / 2, height * MENU_CENTER_Y);
    this.footer?.setPosition(width / 2, height - SPACING.sm - 8);
  }
}