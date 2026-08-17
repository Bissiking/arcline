// apps/client/src/ui/tokens.ts
// Design tokens partagés — monde « champ de tir à l'aube » : forêt sombre,
// or de cible, prairie ensoleillée.

import Phaser from "phaser";

export const COLORS = {
  // Sol / fond
  bg: "#16231a",
  // Surfaces (panneaux) : bois-vert sombre
  surface: "#22352a",
  surfaceAlt: "#2b4133",
  border: "#3d5746",
  // Accent : or du centre de cible
  accent: "#f0b64c",
  accentHover: "#ffcf6e",
  goldSoft: "#c9972f",
  // Texte
  text: "#f4efe2",
  textMuted: "#b6c5a9",
  textDisabled: "#74876c",
  // États
  danger: "#e0644a",
  success: "#7bc87f",
  // Monde « jour » (ciel / prairie)
  skyTop: "#3f76c9",
  skyMid: "#6fa8e0",
  skyHorizon: "#ffe9b3",
  sun: "#fff3c4",
  cloud: "#ffffff",
  hillDistant: "#8aa8c0",
  hillFar: "#77a25a",
  hillNear: "#5f8a44",
  grassTop: "#93c265",
  grassSurface: "#7aa94e",
  grassBody: "#5c8540",
  grassEdge: "#466b31",
  dirt: "#c2a05e",
  dirtEdge: "#a1854a",
  daisy: "#ffffff",
  daisyHeart: "#f7ce4e",
} as const;

export const TYPOGRAPHY = {
  fontFamily: '"Manrope", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  fontFamilyTitle: '"Bebas Neue", "Arial Narrow", "Trebuchet MS", system-ui, sans-serif',
  sizes: {
    headline: 92,
    heading: 46,
    body: 18,
    small: 14,
    tiny: 12,
  },
  weights: {
    normal: 400,
    semibold: 600,
    bold: 800,
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
  xxl: 64,
} as const;

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
} as const;

export function colorToNumber(hex: string): number {
  return Phaser.Display.Color.HexStringToColor(hex).color;
}

/** Variante éclaircie (t>0) ou assombrie (t<0) d'une couleur hex. */
export function colorShift(hex: string, t: number): number {
  const c = Phaser.Display.Color.ValueToColor(hex);
  const factor = 1 + t;
  return (
    (Math.min(255, Math.round(c.red * factor)) << 16) |
    (Math.min(255, Math.round(c.green * factor)) << 8) |
    Math.min(255, Math.round(c.blue * factor))
  );
}