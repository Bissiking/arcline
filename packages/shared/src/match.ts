// packages/shared/src/match.ts
// Logique de tour (joueurs gauche/droite), insensible au rendu.

import type { GameSide } from "./game-types.js";

export interface TurnState {
  current: GameSide;
  number: number;
}

export const OPPOSITE_SIDE: Record<GameSide, GameSide> = {
  left: "right",
  right: "left",
} as const;

export function createMatch(initialSide: GameSide = "left"): TurnState {
  return { current: initialSide, number: 1 };
}

export function nextTurn(state: TurnState): TurnState {
  return {
    current: OPPOSITE_SIDE[state.current],
    number: state.number + 1,
  };
}

export interface VictoryState {
  finished: boolean;
  winner: GameSide | null;
}

/** Évalue la fin de partie à partir des PV (null = égalité / double K.O.). */
export function evaluateVictory(playerHp: number, botHp: number): VictoryState {
  const finished = playerHp <= 0 || botHp <= 0;
  if (!finished) return { finished: false, winner: null };
  if (playerHp <= 0 && botHp <= 0) return { finished: true, winner: null };
  if (playerHp <= 0) return { finished: true, winner: "right" };
  return { finished: true, winner: "left" };
}