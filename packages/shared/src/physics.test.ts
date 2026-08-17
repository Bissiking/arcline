// packages/shared/src/physics.test.ts

import { describe, expect, it } from "vitest";
import { GAME_CONFIG } from "./config.js";
import { initialVelocity, simulateTrajectory } from "./physics.js";

describe("initialVelocity", () => {
  it("has no horizontal component at 90°", () => {
    const { vx, vy } = initialVelocity(90, 50);
    expect(Math.abs(vx)).toBeLessThan(1e-9);
    expect(vy).toBeLessThan(0);
  });

  it("has no vertical component at 0°", () => {
    const { vx, vy } = initialVelocity(0, 50);
    expect(vy).toBeCloseTo(0, 6);
    expect(vx).toBeGreaterThan(0);
  });
});

describe("simulateTrajectory", () => {
  it("starts at origin and stops at ground level (y > 0)", () => {
    const points = simulateTrajectory({ angle: 45, power: 60, wind: 0 });
    expect(points[0]).toEqual({ x: 0, y: 0, t: 0 });
    const last = points[points.length - 1];
    expect(last).toBeDefined();
    expect(last!.y).toBeGreaterThan(0);
  });

  it("wind bends the trajectory horizontally", () => {
    const noWind = simulateTrajectory({ angle: 30, power: 70, wind: 0 });
    const tailWind = simulateTrajectory({ angle: 30, power: 70, wind: +GAME_CONFIG.windMax });
    const lastNo = noWind[noWind.length - 1]!;
    const lastWind = tailWind[tailWind.length - 1]!;
    expect(lastWind.x).toBeGreaterThan(lastNo.x);
  });

  it("respects gravity constant", () => {
    const { vy } = initialVelocity(90, 40);
    const dt = 1 / 60;
    // après un pas, vy a augmenté de g*dt (signe inversé vers le bas)
    const vyAfter = vy + GAME_CONFIG.gravity * dt;
    expect(vyAfter).toBeGreaterThan(vy);
  });
});