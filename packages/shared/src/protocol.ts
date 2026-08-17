// packages/shared/src/protocol.ts
// Événements WebSocket échangés entre le client et le serveur.

import type { BodyPart, PlayerInfo, PlayerState, ShotResult } from "./game-types.js";

export type ClientMessage =
  | { type: "PING" }
  | { type: "CREATE_ROOM" }
  | { type: "JOIN_ROOM"; roomCode: string }
  | { type: "PLAYER_READY" }
  | { type: "SHOOT"; angle: number; power: number }
  | { type: "REQUEST_REMATCH" }
  | { type: "RECONNECT"; playerSessionId: string };

export type ServerMessage =
  | { type: "PONG" }
  | { type: "ROOM_CREATED"; roomCode: string; playerId: string; side: "left" | "right" }
  | { type: "ROOM_JOINED"; roomCode: string; playerId: string; side: "left" | "right" }
  | { type: "PLAYER_JOINED"; player: PlayerInfo }
  | { type: "GAME_START"; players: PlayerState[]; firstTurnId: string; wind: number }
  | { type: "TURN_STARTED"; playerId: string; wind: number; turnNumber: number }
  | { type: "SHOT_STARTED"; playerId: string; angle: number; power: number; wind: number }
  | { type: "SHOT_RESULT"; playerId: string; result: ShotResult }
  | { type: "PLAYER_DAMAGED"; playerId: string; bodyPart: BodyPart; damage: number; remainingHp: number }
  | { type: "GAME_FINISHED"; winnerId: string }
  | { type: "PLAYER_DISCONNECTED"; playerId: string }
  | { type: "PLAYER_RECONNECTED"; playerId: string }
  | { type: "ERROR"; code: string; message?: string };