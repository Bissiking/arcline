// packages/shared/src/game-types.ts

export type BodyPart = "HEAD" | "BODY" | "LEGS";
export type GameSide = "left" | "right";
export type GameStatus = "WAITING" | "STARTING" | "PLAYING" | "FINISHED";

export interface PlayerInfo {
  playerId: string;
  name: string;
}

export interface PlayerState extends PlayerInfo {
  hp: number;
  side: GameSide;
  ready: boolean;
}

export interface ShotParams {
  angle: number;
  power: number;
}

export interface ShotResult {
  hit: boolean;
  bodyPart: BodyPart | null;
  damage: number;
  remainingHp: number;
  hitX?: number;
  hitY?: number;
}

export interface RoomState {
  code: string;
  players: PlayerState[];
  status: GameStatus;
  currentTurnId: string | null;
  wind: number;
  turnNumber: number;
}