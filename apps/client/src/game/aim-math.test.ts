// apps/client/src/game/aim-math.test.ts

import { describe, expect, it } from "vitest";
import { computeAim, isValidAngle, isValidPower } from "./aim-math.js";

describe("computeAim (drag vers la cible)", () => {
  const startX = 190;
  const startY = 578;

  it("drag horizontal → angle 0°", () => {
    const { angle } = computeAim(startX, startY, startX + 100, startY);
    expect(angle).toBeCloseTo(0, 5);
  });

  it("drag vers le haut → angle 90°", () => {
    const { angle } = computeAim(startX, startY, startX, startY - 100);
    expect(angle).toBeCloseTo(90, 5);
  });

  it("drag en diagonale haut-droite → ~45°", () => {
    const { angle } = computeAim(startX, startY, startX + 100, startY - 100);
    expect(angle).toBeCloseTo(45, 5);
  });

  it("la puissance suit la distance de drag depuis le clic (250 px = 100 %)", () => {
    const { power } = computeAim(startX, startY, startX + 125, startY);
    expect(power).toBeCloseTo(50, 5);
  });

  it("la puissance est plafonnée à 100", () => {
    const { power } = computeAim(startX, startY, startX + 500, startY);
    expect(power).toBe(100);
  });

  it("l'angle reste borné (jamais négatif ni > 90)", () => {
    for (const [cx, cy] of [
      [startX - 200, startY - 100],
      [startX - 200, startY + 100],
      [startX - 200, startY],
    ] as const) {
      const { angle } = computeAim(startX, startY, cx, cy);
      expect(angle).toBeGreaterThanOrEqual(0);
      expect(angle).toBeLessThanOrEqual(90);
    }
  });
});

describe("validation", () => {
  it("valide les bornes angle/puissance", () => {
    expect(isValidAngle(45)).toBe(true);
    expect(isValidAngle(-1)).toBe(false);
    expect(isValidAngle(91)).toBe(false);
    expect(isValidPower(100)).toBe(true);
    expect(isValidPower(101)).toBe(false);
    expect(isValidPower(Math.PI)).toBe(true);
  });
});