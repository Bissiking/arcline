// packages/shared/src/bot.test.ts

import { describe, expect, it } from "vitest";
import { GAME_CONFIG } from "./config.js";
import { chooseBotShot, powerForDistance } from "./bot.js";

describe("powerForDistance", () => {
  it("augmente avec la distance (angle fixe)", () => {
    const p50 = powerForDistance(600, 45);
    const p90 = powerForDistance(900, 45);
    expect(p90).toBeGreaterThan(p50);
  });

  it("reste dans les bornes configurées", () => {
    expect(powerForDistance(5, 45)).toBeGreaterThanOrEqual(GAME_CONFIG.powerMin);
    expect(powerForDistance(5000, 45)).toBeLessThanOrEqual(GAME_CONFIG.powerMax);
  });

  it("angle nul → puissance max (tir plat impossible)", () => {
    expect(powerForDistance(900, 0)).toBe(GAME_CONFIG.powerMax);
  });

  it("gravité plus haute → plus de puissance pour la même portée", () => {
    const pLight = powerForDistance(900, 45, 500);
    const pHeavy = powerForDistance(900, 45, 900);
    expect(pHeavy).toBeGreaterThan(pLight);
  });
});

describe("chooseBotShot", () => {
  it("produit toujours un tir valide", () => {
    for (let i = 0; i < 200; i += 1) {
      const shot = chooseBotShot(900);
      expect(shot.angle).toBeGreaterThanOrEqual(GAME_CONFIG.angleMin);
      expect(shot.angle).toBeLessThanOrEqual(GAME_CONFIG.angleMax);
      expect(shot.power).toBeGreaterThanOrEqual(GAME_CONFIG.powerMin);
      expect(shot.power).toBeLessThanOrEqual(GAME_CONFIG.powerMax);
    }
  });

  it("est reproductible avec un RNG donné", () => {
    const makeRng = () => {
      let seed = 42;
      return () => {
        seed = (seed * 1103515245 + 12345) % 2147483648;
        return seed / 2147483648;
      };
    };
    expect(chooseBotShot(900, makeRng())).toEqual(
      chooseBotShot(900, makeRng()),
    );
    expect(chooseBotShot(900, makeRng())).not.toEqual(
      chooseBotShot(900, () => Math.random()),
    );
  });
});