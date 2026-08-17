// packages/shared/src/hitbox.test.ts

import { describe, expect, it } from "vitest";
import { ARCHER_HITBOXES, hitBodyPart } from "./hitbox.js";

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