// apps/client/src/ui/tokens.ts
// Design tokens partagés (couleurs, typo, espacements, rayons).

import Phaser from "phaser";

export const COLORS = {
  bg: "#10141c",
  surface: "#1a2230",
  surfaceAlt: "#222d3f",
  border: "#2c3a52",
  accent: "#e0a63c",
  accentHover: "#f0b95a",
  text: "#e8ecf2",
  textMuted: "#8b96a8",
  textDisabled: "#5b6577",
  danger: "#e05a5a",
  success: "#58c98a",
} as const;

export const TYPOGRAPHY = {
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  fontFamilyTitle: "monospace",
  sizes: {
    headline: 64,
    heading: 32,
    body: 18,
    small: 14,
    tiny: 12,
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