// packages/shared/src/match.test.ts

import { describe, expect, it } from "vitest";
import { OPPOSITE_SIDE, createMatch, evaluateVictory, nextTurn } from "./match.js";

describe("createMatch", () => {
  it("démarre côté gauche, tour 1", () => {
    expect(createMatch()).toEqual({ current: "left", number: 1 });
  });
});

describe("nextTurn", () => {
  it("alterne gauche ↔ droite et incrémente le numéro", () => {
    let turn = createMatch();
    turn = nextTurn(turn);
    expect(turn.current).toBe("right");
    expect(turn.number).toBe(2);

    turn = nextTurn(turn);
    expect(turn.current).toBe("left");
    expect(turn.number).toBe(3);
  });
});

describe("OPPOSITE_SIDE", () => {
  it("inverse chaque côté", () => {
    expect(OPPOSITE_SIDE.left).toBe("right");
    expect(OPPOSITE_SIDE.right).toBe("left");
  });
});

describe("evaluateVictory", () => {
  it("continue tant que les deux combattants ont des PV", () => {
    expect(evaluateVictory(100, 100)).toEqual({ finished: false, winner: null });
    expect(evaluateVictory(10, 45)).toEqual({ finished: false, winner: null });
  });

  it("le bot gagne si le joueur tombe à 0", () => {
    expect(evaluateVictory(0, 40)).toEqual({ finished: true, winner: "right" });
    expect(evaluateVictory(-5, 1)).toEqual({ finished: true, winner: "right" });
  });

  it("le joueur gagne si le bot tombe à 0", () => {
    expect(evaluateVictory(25, 0)).toEqual({ finished: true, winner: "left" });
  });

  it("double K.O. → égalité (winner null)", () => {
    expect(evaluateVictory(0, 0)).toEqual({ finished: true, winner: null });
  });
});