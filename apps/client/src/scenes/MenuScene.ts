// apps/client/src/scenes/MenuScene.ts
// Menu principal — « panneau de tournoi » : bannière, cibles décoratives,
// boutons Solo (→ GameScene) et Multi verrouillé.

import Phaser from "phaser";
import { GameAudio } from "../game/audio.js";
import { VIEWPORT } from "../game/layout.js";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type GameSettings,
} from "../game/settings.js";
import { createButton } from "../ui/button.js";
import { createIconButton } from "../ui/icon-button.js";
import { createPill } from "../ui/pill.js";
import {
  createSettingsMenu,
  type SettingsMenuHandle,
} from "../ui/settings-menu.js";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, colorToNumber } from "../ui/tokens.js";
import { SCENE_KEYS } from "./keys.js";

const MENU_CENTER_Y = 0.42;

export class MenuScene extends Phaser.Scene {
  private ui?: Phaser.GameObjects.Container;
  private footer?: Phaser.GameObjects.Text;
  private audio?: GameAudio;
  private settingsButton?: Phaser.GameObjects.Container;
  private settings: GameSettings = DEFAULT_SETTINGS;
  private settingsOpen = false;
  private settingsMenu?: SettingsMenuHandle;

  constructor() {
    super(SCENE_KEYS.MenuScene);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.settings = loadSettings();
    this.drawBackdrop();
    this.buildLayout();
    this.createSettingsButton();
    this.centerUi();
    this.scale.on("resize", this.centerUi, this);
    this.events.once("shutdown", () => this.scale.off("resize", this.centerUi, this));

    this.audio = new GameAudio(this, this.settings, "menu");
    this.input.once("pointerdown", () => this.audio?.unlock());
    this.events.once("shutdown", () => {
      this.audio?.destroy();
      this.settingsMenu?.destroy();
    });
  }

  private createSettingsButton(): void {
    this.settingsButton = createIconButton(
      this,
      0,
      0,
      "gear",
      () => this.openSettings(),
      { size: 48 },
    );
  }

  private openSettings(): void {
    if (this.settingsOpen) return;
    this.settingsOpen = true;
    this.settingsButton?.setVisible(false);
    this.settingsMenu = createSettingsMenu(this, {
      x: this.scale.width / 2,
      y: this.scale.height / 2,
      settings: this.settings,
      onChange: (next) => {
        this.settings = next;
        saveSettings(next);
        this.audio?.applySettings(next);
      },
      onClose: () => this.closeSettings(),
    });
  }

  private closeSettings(): void {
    this.settingsOpen = false;
    this.settingsButton?.setVisible(true);
    this.settingsMenu?.destroy();
    this.settingsMenu = undefined;
  }

  private drawBackdrop(): void {
    const g = this.add.graphics().setDepth(0);
    g.fillGradientStyle(
      colorToNumber("#20331f"),
      colorToNumber("#20331f"),
      colorToNumber("#0e150d"),
      colorToNumber("#0e150d"),
      1,
    );
    g.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height);

    // Vaste ciel rond (lumière tamisée par-dessus)
    g.fillStyle(colorToNumber(COLORS.accent), 0.03);
    g.fillCircle(VIEWPORT.width / 2, VIEWPORT.height * 0.36, 320);
    g.fillStyle(colorToNumber(COLORS.accent), 0.05);
    g.fillCircle(VIEWPORT.width / 2, VIEWPORT.height * 0.36, 200);

    // Anneaux de cible en filigrane
    const ringsX = VIEWPORT.width / 2;
    const ringsY = VIEWPORT.height * 0.34;
    g.lineStyle(2, colorToNumber(COLORS.accent), 0.12);
    const radii = [150, 116, 82, 48, 14];
    for (const radius of radii) {
      g.strokeCircle(ringsX, ringsY, radius);
    }

    // Herméneutique : large halo de sol
    g.fillStyle(colorToNumber(COLORS.surface), 0.35);
    g.fillEllipse(VIEWPORT.width / 2, VIEWPORT.height + 60, 1400, 260);
  }

  private buildLayout(): void {
    // Les éléments sont ajoutés puis regroupés dans `this.ui` centré.
    const elements: Phaser.GameObjects.GameObject[] = [];

    // Bannière derrière le titre
    const banner = this.add.graphics();
    banner.fillStyle(colorToNumber(COLORS.surface), 0.92);
    banner.fillRoundedRect(-240, -105, 480, 158, RADIUS.lg);
    banner.lineStyle(2, colorToNumber(COLORS.border), 0.9);
    banner.strokeRoundedRect(-240, -105, 480, 158, RADIUS.lg);
    banner.fillStyle(colorToNumber(COLORS.accent), 0.7);
    banner.fillRoundedRect(-240, 45, 480, 6, 3);
    elements.push(banner);

    // Titre en ombre portée puis plein
    const shadow = this.add
      .text(2, -96, "ARCLINE", {
        fontFamily: TYPOGRAPHY.fontFamilyTitle,
        fontSize: `${TYPOGRAPHY.sizes.headline}px`,
        color: "#00000055",
      })
      .setLetterSpacing(7)
      .setOrigin(0.5);

    const title = this.add
      .text(0, -100, "ARCLINE", {
        fontFamily: TYPOGRAPHY.fontFamilyTitle,
        fontSize: `${TYPOGRAPHY.sizes.headline}px`,
        color: COLORS.text,
      })
      .setLetterSpacing(7)
      .setOrigin(0.5);
    elements.push(shadow, title);

    const tagline = this.add
      .text(0, -44, "DUEL D'ARCHERS · TOUR PAR TOUR", {
        fontFamily: TYPOGRAPHY.fontFamily,
        fontSize: "15px",
        color: COLORS.textMuted,
      })
      .setFont(`${TYPOGRAPHY.weights.semibold} 15px ${TYPOGRAPHY.fontFamily}`)
      .setLetterSpacing(3)
      .setOrigin(0.5);
    elements.push(tagline);

    const soloButton = createButton(
      this,
      0,
      40,
      "Jouer en solo",
      () => this.scene.start(SCENE_KEYS.GameScene),
      {
        width: 330,
        height: 58,
        fontSize: 24,
        fontFamily: TYPOGRAPHY.fontFamilyTitle,
        letterSpacing: 3,
        uppercase: true,
        fill: COLORS.accent,
        hoverFill: COLORS.accentHover,
        textColor: COLORS.surface,
        border: COLORS.goldSoft,
      },
    );
    elements.push(soloButton);

    const multiplayerButton = createButton(
      this,
      0,
      118,
      "Multijoueur",
      () => undefined,
      {
        width: 330,
        height: 58,
        fontSize: 22,
        fontFamily: TYPOGRAPHY.fontFamilyTitle,
        letterSpacing: 3,
        uppercase: true,
        fill: COLORS.surfaceAlt,
        textColor: COLORS.textDisabled,
        border: COLORS.border,
        disabled: true,
      },
    );
    elements.push(multiplayerButton);

    const soon = createPill(
      this,
      208,
      118,
      "Bientôt",
      {
        fill: COLORS.surfaceAlt,
        textColor: COLORS.accent,
        border: COLORS.goldSoft,
        fontSize: TYPOGRAPHY.sizes.tiny,
        paddingX: 10,
        height: 24,
        shadow: false,
      },
    );
    elements.push(soon.container);

    const hint = this.add
      .text(0, 176, "Le mode multijoueur arrive dans la V2", {
        fontFamily: TYPOGRAPHY.fontFamily,
        fontSize: `${TYPOGRAPHY.sizes.small}px`,
        color: COLORS.textDisabled,
      })
      .setOrigin(0.5);
    elements.push(hint);

    this.ui = this.add.container(0, 0, elements);
    this.ui.setAlpha(0);
    this.tweens.add({ targets: this.ui, alpha: 1, duration: 550, ease: "sine.out" });
    this.tweens.add({
      targets: title,
      scale: 1.02,
      duration: 1400,
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

  private centerUi(): void {
    const { width, height } = this.scale;
    this.ui?.setPosition(width / 2, height * MENU_CENTER_Y);
    this.footer?.setPosition(width / 2, height - SPACING.sm - 8);
    this.settingsButton?.setPosition(width - SPACING.md - 24, SPACING.md + 24);
  }
}