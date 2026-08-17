// apps/client/src/game/music-manifest.ts
// Pistes de musique déclarées dans public/audio/music/manifest.json,
// partagées entre la scène de boot (chargement) et GameAudio (lecture).

export interface MusicTrack {
  id: string;
  title: string;
  author: string;
  file: string;
}

let tracks: readonly MusicTrack[] = [];

export function setMusicTracks(value: readonly MusicTrack[]): void {
  tracks = value;
}

export function getMusicTracks(): readonly MusicTrack[] {
  return tracks;
}
