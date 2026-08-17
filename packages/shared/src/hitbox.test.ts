// packages/shared/src/hitbox.test.ts

import { describe, expect, it } from "vitest";
import { ARCHER_HITBOXES, hitBodyPart, resolveBodyPart } from "./hitbox.js";

describe("hitBodyPart", () => {
  it("détecte chaque zone au centre de sa hitbox", () => {
    expect(hitBodyPart(ARCHER_HITBOXES, 0, 101)).toBe("HEAD");
    expect(hitBodyPart(ARCHER_HITBOXES, 0, 60)).toBe("BODY");
    expect(hitBodyPart(ARCHER_HITBOXES, 0, 18)).toBe("LEGS");
  });

  it("renvoie null en dehors des zones", () => {
    expect(hitBodyPart(ARCHER_HITBOXES, 0, 140)).toBeNull();
    expect(hitBodyPart(ARCHER_HITBOXES, 30, 60)).toBeNull();
  });

  it("prend en compte les limites des rectangles", () => {
    expect(hitBodyPart(ARCHER_HITBOXES, 14, 60)).toBe("BODY");
    expect(hitBodyPart(ARCHER_HITBOXES, 14.1, 60)).toBeNull();
  });
});

describe("resolveBodyPart", () => {
  const feetX = 190;
  const feetY = 640;

  it("convertit les coordonnées monde en zone relative", () => {
    expect(resolveBodyPart(ARCHER_HITBOXES, feetX, feetY - 101, feetX, feetY)).toBe(
      "HEAD",
    );
    expect(resolveBodyPart(ARCHER_HITBOXES, feetX, feetY - 60, feetX, feetY)).toBe(
      "BODY",
    );
    expect(resolveBodyPart(ARCHER_HITBOXES, feetX, feetY - 18, feetX, feetY)).toBe(
      "LEGS",
    );
  });

  it("renvoie null loin de l'archer", () => {
    expect(resolveBodyPart(ARCHER_HITBOXES, 500, feetY - 60, feetX, feetY)).toBeNull();
    expect(resolveBodyPart(ARCHER_HITBOXES, feetX, feetY - 150, feetX, feetY)).toBeNull();
  });
});