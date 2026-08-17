// apps/client/src/scenes/BootScene.ts
// Scène de démarrage : charge le manifest de musique et les pistes, puis menu.

import Phaser from "phaser";
import { setMusicTracks, type MusicTrack } from "../game/music-manifest.js";
import { SCENE_KEYS } from "./keys.js";

const MANIFEST_PATH = "audio/music/manifest.json";

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.BootScene);
  }

  create(): void {
    this.loadMusic(() => this.scene.start(SCENE_KEYS.MenuScene));
  }

  private loadMusic(done: () => void): void {
    fetch(MANIFEST_PATH)
      .then((response) => (response.ok ? response.json() : null))
      .then((manifest: { tracks?: MusicTrack[] } | null) => {
        const tracks = manifest?.tracks ?? [];
        setMusicTracks(tracks);

        for (const track of tracks) {
          this.load.audio(track.id, `audio/music/${track.file}`);
        }

        if (tracks.length === 0) {
          done();
          return;
        }

        this.load.once("complete", done);
        this.load.start();
      })
      .catch(() => done());
  }
}
