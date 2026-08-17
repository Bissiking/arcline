// apps/server/src/index.ts

import { createServer } from "node:http";
import express from "express";
import cookieParser from "cookie-parser";
import { WebSocketServer, WebSocket } from "ws";
import { loadEnv } from "./env.js";

function authEnabled(config: ReturnType<typeof loadEnv>): boolean {
  return Boolean(config.kyros.clientId && config.kyros.jwtSecret);
}

function main(): void {
  const config = loadEnv();
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.set("trust proxy", true);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime(), sso: authEnabled(config) });
  });

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, maxPayload: 4096 });

  wss.on("connection", (ws: WebSocket) => {
    ws.on("message", (data) => {
      const text = data.toString();
      if (text === JSON.stringify({ type: "PING" }) || JSON.parse(text).type === "PING") {
        ws.send(JSON.stringify({ type: "PONG" }));
      }
    });
    ws.on("error", () => ws.terminate());
  });

  httpServer.listen(config.port, () => {
    console.log(`🚀 Arcline server ready on http://localhost:${config.port}`);
    if (!authEnabled(config)) {
      console.log(
        config.nodeEnv === "development"
          ? "  ⚠ dev : SSO désactivé, joueur fictif (Kyros non configuré)"
          : "  ⚠ production : KYROS_CLIENT_ID/JWT_SECRET manquants → jeu inaccessible",
      );
    }
  });
}

main();