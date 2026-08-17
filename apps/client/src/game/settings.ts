// apps/client/src/game/settings.ts
// Réglages du joueur, persistés dans le navigateur (localStorage).

export interface GameSettings {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  /** Volume global 0..1. */
  volume: number;
  /** Affiche la trajectoire de la dernière flèche tirée. */
  showLastTrace: boolean;
  /** Aide : marqueur du point d'atterrissage pendant la visée. */
  showAid: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  musicEnabled: true,
  sfxEnabled: true,
  volume: 0.7,
  showLastTrace: false,
  showAid: true,
};

const STORAGE_KEY = "arcline-settings";

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return {
      musicEnabled:
        typeof parsed.musicEnabled === "boolean"
          ? parsed.musicEnabled
          : DEFAULT_SETTINGS.musicEnabled,
      sfxEnabled:
        typeof parsed.sfxEnabled === "boolean"
          ? parsed.sfxEnabled
          : DEFAULT_SETTINGS.sfxEnabled,
      volume:
        typeof parsed.volume === "number" && Number.isFinite(parsed.volume)
          ? Math.min(1, Math.max(0, parsed.volume))
          : DEFAULT_SETTINGS.volume,
      showLastTrace:
        typeof parsed.showLastTrace === "boolean"
          ? parsed.showLastTrace
          : DEFAULT_SETTINGS.showLastTrace,
      showAid:
        typeof parsed.showAid === "boolean"
          ? parsed.showAid
          : DEFAULT_SETTINGS.showAid,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // stockage indisponible : on ignore
  }
}
