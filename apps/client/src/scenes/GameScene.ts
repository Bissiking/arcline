// apps/client/src/scenes/GameScene.ts
// Scène de partie : monde, terrain, archer, visée, vol de la flèche,
// tours joueur ↔ IA, dégâts par hitbox, victoire/défaite et revanche.

import Phaser from "phaser";
import {
  ARCHER_HITBOXES,
  GAME_CONFIG,
  chooseBotShot,
  evaluateVictory,
  generateWind,
  resolveBodyPart,
  simulateTrajectory,
  type BodyPart,
  type GameSide,
  type TrajectoryPoint,
} from "@arcline/shared";
import { AIM, AimController } from "../game/aim.js";
import { Archer } from "../game/archer.js";
import { ArrowShot } from "../game/arrow.js";
import { GameAudio } from "../game/audio.js";
import { pickEnvironment, type Environment } from "../game/environment.js";
import {
  ARCHER_HEIGHT,
  GROUND_Y,
  PLAYER_FEET_X,
  SIDE_LABEL,
  WORLD,
  randomBotFeetX,
} from "../game/layout.js";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type GameSettings,
} from "../game/settings.js";
import { drawTerrain } from "../game/terrain.js";
import { createButton } from "../ui/button.js";
import { createPill, type Pill } from "../ui/pill.js";
import {
  createSettingsMenu,
  type SettingsMenuHandle,
} from "../ui/settings-menu.js";
import { COLORS, RADIUS, TYPOGRAPHY, colorShift, colorToNumber } from "../ui/tokens.js";
import { SCENE_KEYS } from "./keys.js";

/** Sous-échantillonnage du segment de vol pour éviter de traverser une hitbox. */
const HIT_STEPS = 4;

const HP_BAR = {
  width: 260,
  height: 18,
  y: 96,
} as const;

const HUD_BAND = {
  height: 76,
  y: 52,
} as const;

export class GameScene extends Phaser.Scene {
  private aim?: AimController;
  private archer?: Archer;
  private botArcher?: Archer;
  private arrows: ArrowShot[] = [];
  /** Vent du tour courant (régénéré à chaque tour). */
  private wind = 0;
  private windPill?: Pill;
  private turnPill?: Pill;
  /** Côté dont c'est le tour. */
  private currentSide: GameSide = "left";
  /** Vrai dès qu'un tir est parti, jusqu'à ce que toutes les flèches se soient fondues. */
  private awaitingTurn = false;
  private botTimer?: Phaser.Time.TimerEvent;

  private playerHp: number = GAME_CONFIG.maxHp;
  private botHp: number = GAME_CONFIG.maxHp;
  private winner: GameSide | null = null;
  private gameOver = false;
  private hpPlayer?: Phaser.GameObjects.Graphics;
  private hpBot?: Phaser.GameObjects.Graphics;
  private endScreen?: Phaser.GameObjects.Rectangle;

  private settings: GameSettings = DEFAULT_SETTINGS;
  private settingsOpen = false;
  private settingsMenu?: SettingsMenuHandle;
  private audio?: GameAudio;
  private lastTrace?: Phaser.GameObjects.Graphics;
  private aidGraphics?: Phaser.GameObjects.Graphics;

  /** Carte et gravité de la partie en cours. */
  private env: Environment = pickEnvironment();
  /** Position des pieds du bot — variable d'une partie à l'autre. */
  private botX = 1090;
  /** Numéro de tour du joueur (incrémenté à chaque « Votre tour »). */
  private turnNumber = 0;
  /** PV affichés (animés vers les PV réels). */
  private hpAnim = { left: GAME_CONFIG.maxHp, right: GAME_CONFIG.maxHp };
  private hpPlayerText?: Phaser.GameObjects.Text;
  private hpBotText?: Phaser.GameObjects.Text;
  private infoLine?: Phaser.GameObjects.Text;
  private botAimRay?: Phaser.GameObjects.Graphics;
  private botWindupActive = false;

  constructor() {
    super(SCENE_KEYS.GameScene);
  }

  create(): void {
    this.resetFields();
    this.env = pickEnvironment();
    this.botX = randomBotFeetX();
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.settings = loadSettings();

    this.audio = new GameAudio(this, this.settings);
    this.input.once("pointerdown", () => this.audio?.unlock());

    drawTerrain(this, this.env, PLAYER_FEET_X.left, this.botX);

    this.archer = new Archer(this, {
      x: PLAYER_FEET_X.left,
      feetY: GROUND_Y,
      side: "left",
      label: SIDE_LABEL.left,
      showHitboxes: true,
    });

    this.botArcher = new Archer(this, {
      x: this.botX,
      feetY: GROUND_Y,
      side: "right",
      label: SIDE_LABEL.right,
      showHitboxes: true,
    });

    const aimOriginY = GROUND_Y - AIM.originHeight;
    this.aim = new AimController(this, {
      originX: PLAYER_FEET_X.left,
      originY: aimOriginY,
      onShot: (angle, power) => this.handleShot(angle, power),
      onAim: (angle, power) => {
        this.archer?.setAim(angle, power);
        if (this.settings.showAid) this.showAidMarker(angle, power);
      },
      onAimEnd: () => {
        this.archer?.idle();
        this.hideAidMarker();
      },
    });

    this.add
      .text(12, WORLD.height - 30, "Cliquez et glissez vers la cible · relâchez pour tirer", {
        fontFamily: TYPOGRAPHY.fontFamily,
        fontSize: `${TYPOGRAPHY.sizes.small}px`,
        color: COLORS.textMuted,
      })
      .setOrigin(0, 0)
      .setDepth(2);

    this.drawHudBand();
    this.createHudButtons();
    this.createWindPill();
    this.createTurnPill();
    this.createHpBars();
    this.createInfoLine();

    const track = this.audio?.getCurrentTrack();
    this.add
      .text(
        WORLD.width / 2,
        WORLD.height - 30,
        track
          ? `♪ ${track.title}${track.author ? ` · ${track.author}` : ""}`
          : "",
        {
          fontFamily: TYPOGRAPHY.fontFamily,
          fontSize: `${TYPOGRAPHY.sizes.tiny}px`,
          color: COLORS.textDisabled,
        },
      )
      .setOrigin(0.5)
      .setDepth(2);

    this.add
      .text(WORLD.width - 8, WORLD.height - 26, "V1 · Développement", {
        fontFamily: TYPOGRAPHY.fontFamily,
        fontSize: `${TYPOGRAPHY.sizes.tiny}px`,
        color: COLORS.textDisabled,
      })
      .setOrigin(1, 1)
      .setDepth(2);

    this.beginTurn("left");

    this.events.once("shutdown", () => {
      this.audio?.destroy();
      this.aim?.destroy();
      for (const arrow of this.arrows) arrow.destroy();
    });
  }

  private drawHudBand(): void {
    const g = this.add.graphics().setDepth(4);
    g.fillStyle(0x0e1810, 0.66);
    g.fillRect(0, 0, WORLD.width, HUD_BAND.height);
    g.lineStyle(1, colorToNumber(COLORS.accent), 0.5);
    g.lineBetween(0, HUD_BAND.height, WORLD.width, HUD_BAND.height);
  }

  private createHudButtons(): void {
    createButton(
      this,
      70,
      HUD_BAND.y / 2,
      "Menu",
      () => this.scene.start(SCENE_KEYS.MenuScene),
      {
        width: 112,
        height: 36,
        fontSize: TYPOGRAPHY.sizes.small,
        uppercase: true,
        fill: COLORS.surface,
        hoverFill: COLORS.surfaceAlt,
      },
    ).setDepth(5);

    createButton(
      this,
      198,
      HUD_BAND.y / 2,
      "Réglages",
      () => this.openSettings(),
      {
        width: 128,
        height: 36,
        fontSize: TYPOGRAPHY.sizes.small,
        uppercase: true,
        fill: COLORS.surface,
        hoverFill: COLORS.surfaceAlt,
      },
    ).setDepth(5);
  }

  private createWindPill(): void {
    this.windPill = createPill(this, 0, HUD_BAND.y / 2, "", {
      fill: COLORS.surface,
      textColor: COLORS.accent,
      fontSize: TYPOGRAPHY.sizes.small,
      uppercase: true,
      height: 34,
    });
    this.windPill.container.setDepth(5);
    this.setWind(this.wind);
  }

  private createTurnPill(): void {
    this.turnPill = createPill(this, WORLD.width / 2, HUD_BAND.y / 2, "", {
      fontSize: TYPOGRAPHY.sizes.body,
      fontFamily: TYPOGRAPHY.fontFamilyTitle,
      letterSpacing: 3,
      uppercase: true,
      height: 42,
      fill: COLORS.surfaceAlt,
    });
    this.turnPill.container.setDepth(5);
  }

  update(_time: number, delta: number): void {
    for (const arrow of this.arrows) {
      arrow.update(delta);
      if (this.gameOver || arrow.finished || arrow.hit) continue;

      const part = this.findHitOnTarget(arrow);
      if (part) {
        const pos = arrow.position;
        arrow.stick(pos.x, pos.y, pos.angle);
        this.handleArrowImpact(arrow, pos.x, pos.y, pos.angle, part);
      }
    }
  }

  private handleShot(angle: number, power: number): void {
    if (this.currentSide !== "left" || this.gameOver) return;
    this.archer?.release();
    this.fireShot("left", angle, power);
  }

  /** Lance une flèche depuis le côté donné (le bot tire vers la gauche). */
  private fireShot(side: GameSide, angle: number, power: number): void {
    const originX = side === "left" ? PLAYER_FEET_X.left : this.botX;
    const originY = GROUND_Y - AIM.originHeight;

    const points = simulateTrajectory({
      angle,
      power,
      wind: this.wind,
      gravity: this.env.gravity,
      groundBelow: GROUND_Y - originY,
      boundsX:
        side === "left"
          ? { min: -originX, max: WORLD.width - originX }
          : { min: originX - WORLD.width, max: originX },
    });

    if (points.length < 2) return;

    this.recoilArcher(side);

    if (this.settings.showLastTrace) {
      this.drawLastTrace(points, originX, originY, side === "right");
    }
    this.audio?.playShot();

    const arrow = new ArrowShot(this, {
      points,
      originX,
      originY,
      side,
      mirror: side === "right",
      onImpact: (shot, x, y, impactAngle) =>
        this.handleArrowImpact(shot, x, y, impactAngle),
    });
    this.arrows.push(arrow);
    this.awaitingTurn = true;
  }

  /** Un léger recul de l'archer au moment du tir. */
  private recoilArcher(side: GameSide): void {
    const target = side === "left" ? this.archer?.sprite : this.botArcher?.sprite;
    if (!target) return;
    const offset = side === "left" ? -12 : 12;
    this.tweens.add({
      targets: target,
      x: target.x + offset,
      duration: 90,
      ease: "quad.out",
      yoyo: true,
    });
  }

  /** Le personnage touché vacille (flinch) après un impact. */
  private flinchArcher(side: GameSide): void {
    const target = side === "left" ? this.archer?.sprite : this.botArcher?.sprite;
    if (!target) return;
    const offset = side === "left" ? -14 : 10;
    this.tweens.add({
      targets: target,
      x: target.x + offset,
      duration: 70,
      ease: "quad.out",
      yoyo: true,
      repeat: 1,
    });
  }

  private handleArrowImpact(
    shot: ArrowShot,
    x: number,
    y: number,
    angle: number,
    hitPart?: BodyPart | null,
  ): void {
    const targetSide = shot.side === "left" ? "right" : "left";
    const part = hitPart ?? this.resolveImpact(targetSide, x, y);
    const plantY = Math.min(y, GROUND_Y);

    if (part && !this.gameOver) {
      this.applyDamage(targetSide, part);
      this.flinchArcher(targetSide);
      this.spawnImpactRing(x, plantY, COLORS.accent);
      this.burst(x, plantY, COLORS.accent, 10);
    } else {
      this.audio?.playImpact();
      if (plantY >= GROUND_Y - 2) {
        this.burst(x, plantY, COLORS.dirt, 7);
      }
    }

    shot.sprite.setPosition(x, plantY).setRotation(angle);

    this.tweens.add({
      targets: shot.sprite,
      alpha: 0,
      delay: 1000,
      duration: 500,
      onComplete: () => {
        shot.destroy();
        this.arrows = this.arrows.filter((a) => a !== shot);
        if (this.gameOver) {
          this.showEndScreen();
        } else if (this.awaitingTurn && this.arrows.length === 0) {
          this.awaitingTurn = false;
          this.beginTurn(this.currentSide === "left" ? "right" : "left");
        }
      },
    });
  }

  /** Partie du corps touchée par le point (si la flèche traverse la cible ce frame). */
  private findHitOnTarget(shot: ArrowShot): BodyPart | null {
    const targetSide = shot.side === "left" ? "right" : "left";
    const pos = shot.position;
    const prev = shot.previousPosition;

    for (let i = 0; i <= HIT_STEPS; i += 1) {
      const t = i / HIT_STEPS;
      const x = prev.x + (pos.x - prev.x) * t;
      const y = prev.y + (pos.y - prev.y) * t;
      const part = this.resolveImpact(targetSide, x, y);
      if (part) return part;
    }
    return null;
  }

  private resolveImpact(
    targetSide: GameSide,
    x: number,
    y: number,
  ): BodyPart | null {
    const feetX =
      targetSide === "left" ? PLAYER_FEET_X.left : this.botX;
    return resolveBodyPart(ARCHER_HITBOXES, x, y, feetX, GROUND_Y);
  }

  private applyDamage(targetSide: GameSide, part: BodyPart): void {
    const damage = GAME_CONFIG.damage[part];
    if (targetSide === "left") {
      this.playerHp = Math.max(0, this.playerHp - damage);
    } else {
      this.botHp = Math.max(0, this.botHp - damage);
    }

    this.animateHpTo(targetSide);
    this.redrawHpBars();
    this.flashBar(targetSide);
    this.spawnDamageNumber(targetSide, damage);
    this.audio?.playHit();
    this.cameras.main.shake(120, 0.004);

    const { finished, winner } = evaluateVictory(this.playerHp, this.botHp);
    if (finished) {
      this.winner = winner ?? "left";
      this.gameOver = true;
      this.aim?.setEnabled(false);
      if (this.turnPill) {
        const won = this.winner === "left";
        this.turnPill.setTone(
          won ? COLORS.success : COLORS.danger,
          won ? "#0e2013" : COLORS.text,
        );
        this.turnPill.setText(won ? "VICTOIRE !" : "DÉFAITE…");
        this.pulse(this.turnPill.container);
      }
    }
  }

  /** Anime les barres PV vers la valeur réelle (avec les chiffres). */
  private animateHpTo(side: "left" | "right"): void {
    const target = side === "left" ? this.playerHp : this.botHp;
    const proxy = { v: this.hpAnim[side] };
    this.tweens.killTweensOf(proxy);
    this.tweens.add({
      targets: proxy,
      v: target,
      duration: 320,
      ease: "quad.out",
      onUpdate: () => {
        this.hpAnim[side] = proxy.v;
        this.redrawHpBars();
        this.updateHpText(side);
      },
    });
    this.updateHpText(side);
  }

  private updateHpText(side: "left" | "right"): void {
    const text = side === "left" ? this.hpPlayerText : this.hpBotText;
    text?.setText(`${Math.round(this.hpAnim[side])}/${GAME_CONFIG.maxHp}`);
  }

  /** Démarre le tour du côté donné : vent, droit de viser, et tir du bot si besoin. */
  private beginTurn(side: GameSide): void {
    this.currentSide = side;
    this.setWind(generateWind());
    this.archer?.idle();
    this.botArcher?.idle();
    this.aim?.setEnabled(side === "left");

    if (side === "left") {
      this.turnNumber += 1;
      this.updateInfoLine();
    }

    if (this.turnPill) {
      if (side === "left") {
        this.turnPill.setTone(COLORS.accent, COLORS.surface, COLORS.goldSoft);
        this.turnPill.setText("VOTRE TOUR");
      } else {
        this.turnPill.setTone(COLORS.surfaceAlt, COLORS.text);
        this.turnPill.setText("TOUR DE L'IA");
      }
      this.pulse(this.turnPill.container);
    }

    if (side === "right") this.scheduleBotShot();
  }

  private createInfoLine(): void {
    this.infoLine = this.add
      .text(WORLD.width / 2, 58, "", {
        fontFamily: TYPOGRAPHY.fontFamily,
        fontSize: `${TYPOGRAPHY.sizes.tiny}px`,
        color: COLORS.textMuted,
      })
      .setLetterSpacing(2)
      .setOrigin(0.5)
      .setDepth(5);
    this.updateInfoLine();
  }

  private updateInfoLine(): void {
    this.infoLine?.setText(
      `TOUR ${this.turnNumber} · ${this.env.name.toUpperCase()}`,
    );
  }

  /* Petit effet « pop » quand un état change (bannière, vent). */
  private pulse(target: Phaser.GameObjects.Container): void {
    target.setScale(1.08);
    this.tweens.add({
      targets: target,
      scale: 1,
      duration: 260,
      ease: "quad.out",
    });
  }

/** Le bot vise (windup animé + rayon rouge) puis tire après un délai variable. */
  private scheduleBotShot(): void {
    if (this.botWindupActive) return;
    const distance = this.botX - PLAYER_FEET_X.left;
    const shot = chooseBotShot(distance, Math.random, this.env.gravity);
    const thinkMs = 550 + Math.random() * 550;
    const windupMs = 480 + Math.random() * 380;
    const holdMs = 180 + Math.random() * 320;

    this.botTimer = this.time.delayedCall(thinkMs, () => {
      if (this.currentSide !== "right" || this.gameOver) return;
      if (!this.botArcher) return;
      this.botWindupActive = true;

      const progress = { v: 0 };
      this.drawBotAimRay(progress.v);
      this.tweens.add({
        targets: progress,
        v: 1,
        duration: windupMs,
        ease: "quad.in",
        onUpdate: () => {
          const lerpAngle = 14 + (shot.angle - 14) * progress.v;
          const lerpPower = shot.power * progress.v;
          this.botArcher?.setAim(lerpAngle, lerpPower);
          this.drawBotAimRay(progress.v);
        },
        onComplete: () => {
          this.botTimer = this.time.delayedCall(holdMs, () => {
            if (this.currentSide !== "right" || this.gameOver) return;
            this.botWindupActive = false;
            this.fadeBotAimRay();
            this.botArcher?.release();
            this.fireShot("right", shot.angle, shot.power);
          });
        },
      });
    });
  }

  /** Rayon de visée du bot (rouge, pointant vers la gauche). */
  private drawBotAimRay(progress: number): void {
    if (!this.botAimRay) {
      this.botAimRay = this.add.graphics().setDepth(14);
    }
    const g = this.botAimRay;
    const originX = this.botX;
    const originY = GROUND_Y - AIM.originHeight;
    const angle = 14 + 45 * progress;
    const power = 90 * progress;
    const rad = (angle * Math.PI) / 180;
    const length = 30 + power * 3;
    const endX = originX - Math.cos(rad) * length;
    const endY = originY - Math.sin(rad) * length;

    g.clear();
    g.lineStyle(3, colorToNumber(COLORS.danger), 0.7);
    g.lineBetween(originX, originY, endX, endY);
    g.fillStyle(colorToNumber(COLORS.danger), 0.8);
    g.fillCircle(originX, originY, 4);
  }

  private fadeBotAimRay(): void {
    if (!this.botAimRay) return;
    const g = this.botAimRay;
    this.botAimRay = undefined;
    this.tweens.add({
      targets: g,
      alpha: 0,
      duration: 240,
      onComplete: () => g.destroy(),
    });
  }

  private createHpBars(): void {
    this.hpPlayer = this.add.graphics().setDepth(30);
    this.hpBot = this.add.graphics().setDepth(30);

    this.hpPlayerText = this.add
      .text(12 + HP_BAR.width / 2, HP_BAR.y + HP_BAR.height / 2, "", {
        fontFamily: TYPOGRAPHY.fontFamilyTitle,
        fontSize: "14px",
        color: COLORS.text,
      })
      .setLetterSpacing(1)
      .setOrigin(0.5)
      .setDepth(31);

    this.hpBotText = this.add
      .text(
        WORLD.width - 12 - HP_BAR.width / 2,
        HP_BAR.y + HP_BAR.height / 2,
        "",
        {
          fontFamily: TYPOGRAPHY.fontFamilyTitle,
          fontSize: "14px",
          color: COLORS.text,
        },
      )
      .setLetterSpacing(1)
      .setOrigin(0.5)
      .setDepth(31);

    this.add
      .text(12, HP_BAR.y - 5, "VOUS", {
        fontFamily: TYPOGRAPHY.fontFamilyTitle,
        fontSize: "15px",
        color: COLORS.textMuted,
      })
      .setLetterSpacing(2)
      .setOrigin(0, 1)
      .setDepth(2);

    this.add
      .text(WORLD.width - 12, HP_BAR.y - 5, "IA", {
        fontFamily: TYPOGRAPHY.fontFamilyTitle,
        fontSize: "15px",
        color: COLORS.textMuted,
      })
      .setLetterSpacing(2)
      .setOrigin(1, 1)
      .setDepth(2);

    this.redrawHpBars();
    this.updateHpText("left");
    this.updateHpText("right");
  }

  private redrawHpBars(): void {
    if (!this.hpPlayer || !this.hpBot) return;

    const ratioPlayer = this.hpAnim.left / GAME_CONFIG.maxHp;
    const ratioBot = this.hpAnim.right / GAME_CONFIG.maxHp;

    this.drawHpBar(
      this.hpPlayer,
      12,
      HP_BAR.y,
      HP_BAR.width,
      HP_BAR.height,
      ratioPlayer,
      COLORS.success,
    );
    this.drawHpBar(
      this.hpBot,
      WORLD.width - 12 - HP_BAR.width,
      HP_BAR.y,
      HP_BAR.width,
      HP_BAR.height,
      ratioBot,
      COLORS.danger,
    );
  }

  private drawHpBar(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    ratio: number,
    color: string,
  ): void {
    g.clear();
    g.fillStyle(colorToNumber(COLORS.surface), 1);
    g.fillRoundedRect(x, y, width, height, RADIUS.sm);

    const fillW = Phaser.Math.Clamp(ratio, 0, 1) * width;
    if (fillW > 0) {
      const fillTop = colorShift(color, 0.18);
      g.fillGradientStyle(fillTop, fillTop, colorToNumber(color), colorToNumber(color), 1);
      g.fillRoundedRect(x + 1, y + 1, Math.max(fillW - 2, 0), height - 2, RADIUS.sm - 1);
    }

    g.lineStyle(1, colorToNumber(COLORS.border), 0.9);
    g.strokeRoundedRect(x, y, width, height, RADIUS.sm);
  }

  private flashBar(side: GameSide): void {
    const x = side === "left" ? 12 : WORLD.width - 12 - HP_BAR.width;
    const flash = this.add.graphics().setDepth(31);
    flash.fillStyle(colorToNumber(COLORS.danger), 0.5);
    flash.fillRoundedRect(x, HP_BAR.y, HP_BAR.width, HP_BAR.height, RADIUS.sm);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 400,
      onComplete: () => flash.destroy(),
    });
  }

  private spawnDamageNumber(side: GameSide, damage: number): void {
    const feetX = side === "left" ? PLAYER_FEET_X.left : this.botX;
    const label = this.add
      .text(feetX, GROUND_Y - ARCHER_HEIGHT - 8, `-${damage}`, {
        fontFamily: TYPOGRAPHY.fontFamilyTitle,
        fontSize: `${TYPOGRAPHY.sizes.heading}px`,
        color: COLORS.danger,
      })
      .setOrigin(0.5)
      .setDepth(40);
    this.tweens.add({
      targets: label,
      y: label.y - 48,
      alpha: 0,
      duration: 800,
      ease: "Cubic.easeOut",
      onComplete: () => label.destroy(),
    });
  }

  private showEndScreen(): void {
    if (this.endScreen) return;
    const won = this.winner === "left";

    this.endScreen = this.add
      .rectangle(
        WORLD.width / 2,
        WORLD.height / 2,
        WORLD.width,
        WORLD.height,
        0x0a0d14,
        0.72,
      )
      .setDepth(50);

    this.add
      .text(
        WORLD.width / 2,
        WORLD.height / 2 - 70,
        won ? "Victoire !" : "Défaite…",
        {
          fontFamily: TYPOGRAPHY.fontFamilyTitle,
          fontSize: `${TYPOGRAPHY.sizes.headline}px`,
          color: won ? COLORS.success : COLORS.danger,
        },
      )
      .setOrigin(0.5)
      .setDepth(51);

    this.add
      .text(
        WORLD.width / 2,
        WORLD.height / 2 + 4,
        won
          ? "Vous éliminez l'adversaire."
          : "Vous êtes éliminé par l'IA.",
        {
          fontFamily: TYPOGRAPHY.fontFamily,
          fontSize: `${TYPOGRAPHY.sizes.small}px`,
          color: COLORS.textMuted,
        },
      )
      .setOrigin(0.5)
      .setDepth(51);

    createButton(
      this,
      WORLD.width / 2 - 85,
      WORLD.height / 2 + 64,
      "Revanche",
      () => this.scene.restart(),
      {
        width: 150,
        height: 44,
        fontSize: TYPOGRAPHY.sizes.body,
        fill: COLORS.accent,
        hoverFill: COLORS.accentHover,
        textColor: COLORS.bg,
      },
    ).setDepth(51);

    createButton(
      this,
      WORLD.width / 2 + 85,
      WORLD.height / 2 + 64,
      "Menu",
      () => this.scene.start(SCENE_KEYS.MenuScene),
      {
        width: 150,
        height: 44,
        fontSize: TYPOGRAPHY.sizes.body,
      },
    ).setDepth(51);
  }

  /** Remise à zéro des champs pointant vers des objets détruits (replay de scène). */
  private resetFields(): void {
    this.aim = undefined;
    this.archer = undefined;
    this.botArcher = undefined;
    this.arrows = [];
    this.windPill = undefined;
    this.turnPill = undefined;
    this.botTimer = undefined;
    this.currentSide = "left";
    this.awaitingTurn = false;
    this.wind = 0;
    this.playerHp = GAME_CONFIG.maxHp;
    this.botHp = GAME_CONFIG.maxHp;
    this.winner = null;
    this.gameOver = false;
    this.hpPlayer = undefined;
    this.hpBot = undefined;
    this.hpPlayerText = undefined;
    this.hpBotText = undefined;
    this.infoLine = undefined;
    this.botAimRay = undefined;
    this.botWindupActive = false;
    this.hpAnim = { left: GAME_CONFIG.maxHp, right: GAME_CONFIG.maxHp };
    this.turnNumber = 0;
    this.endScreen = undefined;
    this.settingsOpen = false;
    this.settingsMenu = undefined;
    this.audio = undefined;
    this.lastTrace = undefined;
    this.aidGraphics = undefined;
  }

  private openSettings(): void {
    if (this.settingsOpen || this.gameOver) return;
    this.settingsOpen = true;
    this.aim?.setEnabled(false);
    this.settingsMenu = createSettingsMenu(this, {
      x: WORLD.width / 2,
      y: WORLD.height / 2,
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
    this.settingsMenu?.destroy();
    this.settingsMenu = undefined;
    if (!this.gameOver && this.currentSide === "left") {
      this.aim?.setEnabled(true);
    }
  }

  /** Tracé persistant de la dernière trajectoire (option « Tracé »). */
  private drawLastTrace(
    points: TrajectoryPoint[],
    originX: number,
    originY: number,
    mirror: boolean,
  ): void {
    if (this.lastTrace) {
      this.lastTrace.destroy();
      this.lastTrace = undefined;
    }

    const g = this.add.graphics().setDepth(12);
    g.lineStyle(1.5, colorToNumber(COLORS.accent), 0.35);
    g.beginPath();
    for (const p of points) {
      g.lineTo(originX + (mirror ? -p.x : p.x), originY + p.y);
    }
    g.strokePath();

    this.lastTrace = g;
    this.tweens.add({
      targets: g,
      alpha: 0,
      delay: 2600,
      duration: 800,
      onComplete: () => {
        if (this.lastTrace === g) this.lastTrace = undefined;
        g.destroy();
      },
    });
  }

  /** Aide : tracé pointillé prédit + point d'atterrissage coloré par le risque. */
  private showAidMarker(angle: number, power: number): void {
    const originX = PLAYER_FEET_X.left;
    const originY = GROUND_Y - AIM.originHeight;

    const points = simulateTrajectory({
      angle,
      power,
      wind: this.wind,
      gravity: this.env.gravity,
      groundBelow: GROUND_Y - originY,
      boundsX: { min: -originX, max: WORLD.width - originX },
    });

    if (!this.aidGraphics) {
      this.aidGraphics = this.add.graphics().setDepth(12);
    }
    this.aidGraphics.clear();
    if (points.length < 2) return;

    const last = points[points.length - 1]!;
    const wx = originX + last.x;
    const wy = Math.min(originY + last.y, GROUND_Y);

    // Tracé pointillé (un point tous les ~3 pas)
    this.aidGraphics.fillStyle(colorToNumber(COLORS.accent), 0.4);
    for (let i = 0; i < points.length; i += 3) {
      const p = points[i]!;
      this.aidGraphics.fillCircle(originX + p.x, originY + p.y, 2.2);
    }

    const riskColor = this.landingRiskColor(wx);
    this.aidGraphics.lineStyle(2, colorToNumber(riskColor), 0.95);
    this.aidGraphics.strokeCircle(wx, wy, 13);
    this.aidGraphics.fillStyle(colorToNumber(riskColor), 0.9);
    this.aidGraphics.fillCircle(wx, wy, 3);
  }

  /** Couleur du point d'atterrissage selon la proximité d'un archer. */
  private landingRiskColor(x: number): string {
    const toPlayer = Math.abs(x - PLAYER_FEET_X.left);
    const toBot = Math.abs(x - this.botX);
    const closest = Math.min(toPlayer, toBot);
    if (closest < 50) return COLORS.danger;
    if (closest < 130) return COLORS.accent;
    return COLORS.success;
  }

  /** Petite gerbe de particules circulaires (impact, poussière…). */
  private burst(
    x: number,
    y: number,
    color: string,
    count: number,
  ): void {
    for (let i = 0; i < count; i += 1) {
      const size = 1.6 + Math.random() * 2.4;
      const dot = this.add
        .circle(x, y, size, colorToNumber(color), 0.95)
        .setDepth(16);
      const a = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 130;
      const drift = 40 + Math.random() * 60;
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(a) * speed,
        y: y + Math.sin(a) * speed + drift,
        alpha: 0,
        scale: 0.35,
        duration: 380 + Math.random() * 320,
        ease: "quad.out",
        onComplete: () => dot.destroy(),
      });
    }
  }

  /** Anneau qui s'étend et s'estompe au point d'impact. */
  private spawnImpactRing(x: number, y: number, color: string): void {
    const ring = this.add.graphics().setDepth(15);
    const state = { r: 6 };
    this.tweens.add({
      targets: state,
      r: 34,
      duration: 300,
      ease: "quad.out",
      onUpdate: () => {
        ring.clear();
        ring.lineStyle(2, colorToNumber(color), 0.8);
        ring.strokeCircle(x, y, state.r);
      },
      onComplete: () => ring.destroy(),
    });
  }

  private hideAidMarker(): void {
    this.aidGraphics?.clear();
  }

  private setWind(wind: number): void {
    this.wind = wind;

    if (!this.windPill) return;
    const glyph = wind > 0 ? "→" : wind < 0 ? "←" : "•";
    this.windPill.setText(`VENT ${glyph} ${Math.abs(wind)}`);

    const width = this.windPill.container.getBounds().width;
    this.windPill.container.setX(WORLD.width - 20 - width / 2);
    this.pulse(this.windPill.container);
  }
}