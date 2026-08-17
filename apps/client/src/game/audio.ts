// apps/client/src/game/audio.ts
// Audio : SFX procéduraux WebAudio (aucun asset) + musique. La musique utilise
// de préférence les pistes chargées depuis manifest.json (SUNO...) via Phaser
// Sound ; sinon un tapis procédural de repli. Volume global et interrupteurs
// musique / sons.

import type { GameSettings } from "./settings.js";
import { getMusicTracks } from "./music-manifest.js";

const FALLBACK_CHORDS: readonly (readonly number[])[] = [
  [220, 277.18, 329.63],
  [246.94, 293.66, 369.99],
  [196, 246.94, 293.66],
  [261.63, 329.63, 392],
] as const;

/** Surface des méthodes son que l'on utilise (compatibilité phaser). */
interface MusicHandle {
  play(): void;
  stop(): void;
  destroy(): void;
  setVolume(volume: number): void;
}

export class GameAudio {
  private readonly scene: Phaser.Scene;
  private readonly ctx: AudioContext | null;
  private readonly musicBus: GainNode | null;
  private readonly sfxBus: GainNode | null;

  private musicOn: boolean;
  private sfxOn: boolean;
  private volume: number;

  private music: MusicHandle | null = null;
  private fallbackTimer: number | null = null;
  private currentTrack: { title: string; author: string } | null = null;

  constructor(scene: Phaser.Scene, settings: GameSettings) {
    this.scene = scene;
    const context = (scene.sound as Phaser.Sound.WebAudioSoundManager).context;
    this.ctx = context ?? null;
    this.musicOn = settings.musicEnabled;
    this.sfxOn = settings.sfxEnabled;
    this.volume = settings.volume;

    if (!this.ctx) {
      this.musicBus = null;
      this.sfxBus = null;
      return;
    }

    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = this.volume * 0.5;
    this.musicBus.connect(this.ctx.destination);

    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = this.volume;
    this.sfxBus.connect(this.ctx.destination);

    this.applySettings(settings);
  }

  /** À appeler au premier geste utilisateur (contextes WebAudio suspendus). */
  unlock(): void {
    this.ctx?.resume().catch(() => {});
    this.scene.sound.unlock?.();
  }

  applySettings(settings: GameSettings): void {
    this.musicOn = settings.musicEnabled;
    this.sfxOn = settings.sfxEnabled;
    this.volume = settings.volume;

    if (this.ctx) {
      if (this.musicBus) this.musicBus.gain.value = this.volume * 0.5;
      if (this.sfxBus) this.sfxBus.gain.value = this.volume;
    }
    if (this.music) this.music.setVolume(this.volume * 0.5);

    if (this.musicOn) this.playMusic();
    else this.stopMusic();
  }

  destroy(): void {
    this.stopMusic();
    this.musicBus?.disconnect();
    this.sfxBus?.disconnect();
  }

  /** Titre de la piste en cours, ou null (pas de piste chargée). */
  getCurrentTrack(): { title: string; author: string } | null {
    return this.currentTrack;
  }

  playShot(): void {
    if (!this.canSfx()) return;
    this.tone(340, 0.18, 0.3, "sawtooth", -0.8);
    this.noise(0.12, 0.16);
  }

  playHit(): void {
    if (!this.canSfx()) return;
    this.tone(760, 0.14, 0.35, "triangle", 0.5);
    this.tone(460, 0.2, 0.25, "square", -0.4);
  }

  playImpact(): void {
    if (!this.canSfx()) return;
    this.tone(150, 0.28, 0.5, "sine", -0.9);
    this.noise(0.15, 0.3);
  }

  private playMusic(): void {
    if (!this.musicOn || this.music || this.fallbackTimer !== null) return;

    const track = getMusicTracks()[0];
    if (track && this.scene.cache.audio.exists(track.id)) {
      const sound = this.scene.sound.add(track.id, {
        loop: true,
        volume: this.volume * 0.5,
      });
      sound.play();
      this.music = sound;
      this.currentTrack = { title: track.title, author: track.author };
      return;
    }

    this.startFallbackMusic();
  }

  private stopMusic(): void {
    if (this.music) {
      this.music.stop();
      this.music.destroy();
      this.music = null;
    }
    this.currentTrack = null;
    this.stopFallbackMusic();
  }

  private startFallbackMusic(): void {
    if (!this.ctx || !this.musicBus || !this.musicOn || this.fallbackTimer !== null) {
      return;
    }

    let index = 0;
    const playChord = (): void => {
      if (!this.ctx || !this.musicBus || !this.musicOn) return;
      const chord = FALLBACK_CHORDS[index % FALLBACK_CHORDS.length]!;
      index += 1;
      const t = this.ctx.currentTime;
      for (const freq of chord) {
        const osc = this.ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.05, t + 0.6);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.9);
        osc.connect(g);
        g.connect(this.musicBus);
        osc.start(t);
        osc.stop(t + 2);
      }
    };

    playChord();
    this.fallbackTimer = window.setInterval(playChord, 2400);
  }

  private stopFallbackMusic(): void {
    if (this.fallbackTimer !== null) {
      window.clearInterval(this.fallbackTimer);
      this.fallbackTimer = null;
    }
  }

  private canSfx(): boolean {
    return this.sfxOn && !!this.ctx && !!this.sfxBus;
  }

  private tone(
    freq: number,
    duration: number,
    gain: number,
    type: OscillatorType,
    slide: number,
  ): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide !== 0) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(freq + slide * freq, 20),
        t + duration,
      );
    }
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(g);
    g.connect(this.sfxBus!);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  private noise(duration: number, gain: number): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const length = Math.ceil(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(g);
    g.connect(this.sfxBus!);
    src.start(t);
    src.stop(t + duration + 0.02);
  }
}
