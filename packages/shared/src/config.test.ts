// packages/shared/src/config.test.ts

import { describe, expect, it } from "vitest";
import { GAME_CONFIG, generateWind, isValidAngle, isValidPower } from "./config.js";

describe("generateWind", () => {
  it("reste dans [windMin, windMax] et est entier", () => {
    for (let i = 0; i < 500; i += 1) {
      const wind = generateWind();
      expect(wind).toBeGreaterThanOrEqual(GAME_CONFIG.windMin);
      expect(wind).toBeLessThanOrEqual(GAME_CONFIG.windMax);
      expect(Number.isInteger(wind)).toBe(true);
    }
  });
});

describe("validation", () => {
  it("accepte les angles valides", () => {
    expect(isValidAngle(0)).toBe(true);
    expect(isValidAngle(90)).toBe(true);
    expect(isValidAngle(45)).toBe(true);
  });

  it("rejette les angles hors bornes ou non finis", () => {
    expect(isValidAngle(-1)).toBe(false);
    expect(isValidAngle(91)).toBe(false);
    expect(isValidAngle(Number.NaN)).toBe(false);
    expect(isValidAngle(Infinity)).toBe(false);
  });

  it("accepte les puissances valides", () => {
    expect(isValidPower(0)).toBe(true);
    expect(isValidPower(100)).toBe(true);
  });

  it("rejette les puissances hors bornes", () => {
    expect(isValidPower(-1)).toBe(false);
    expect(isValidPower(101)).toBe(false);
  });
});