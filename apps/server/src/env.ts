// apps/server/src/env.ts
// Configuration typée du serveur, lue depuis l'environnement.

import "dotenv/config";

export interface KyrosConfig {
  baseUrl: string;
  authorizeUrl: string;
  tokenUrl: string;
  revokeUrl: string;
  clientId: string;
  clientSecret: string;
  jwtSecret: string;
  issuer: string;
  audience: string;
  resourceAudience: string;
  requestedScope: string;
  requiredScopes: string;
  ssoVersion: string;
  edition: string;
  applicationScope: string;
  timeoutSeconds: number;
}

export interface ServerConfig {
  port: number;
  clientUrl: string;
  publicBaseUrl: string;
  nodeEnv: string;
  kyros: KyrosConfig;
}

function readInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadEnv(): ServerConfig {
  const baseUrl = (process.env.KYROS_BASE_URL ?? "").replace(/\/$/, "");

  return {
    port: readInt(process.env.PORT, 3002),
    clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
    publicBaseUrl: process.env.PUBLIC_BASE_URL ?? "http://localhost:3002",
    nodeEnv: process.env.NODE_ENV ?? "development",
    kyros: {
      baseUrl,
      authorizeUrl:
        process.env.KYROS_AUTHORIZE_URL ?? (baseUrl ? `${baseUrl}/authorize` : ""),
      tokenUrl: process.env.KYROS_TOKEN_URL ?? (baseUrl ? `${baseUrl}/token` : ""),
      revokeUrl: process.env.KYROS_REVOKE_URL ?? (baseUrl ? `${baseUrl}/revoke` : ""),
      clientId: process.env.KYROS_CLIENT_ID ?? "",
      clientSecret: process.env.KYROS_CLIENT_SECRET ?? "",
      jwtSecret: process.env.KYROS_JWT_SECRET ?? "",
      issuer: process.env.KYROS_ISSUER ?? "kyros",
      audience: process.env.KYROS_AUDIENCE ?? "kyros-modules",
      resourceAudience:
        process.env.KYROS_RESOURCE_AUDIENCE ?? "kyros:sso:arcline",
      requestedScope: process.env.KYROS_REQUESTED_SCOPE ?? "profile email",
      requiredScopes: process.env.KYROS_REQUIRED_SCOPES ?? "profile email",
      ssoVersion: process.env.KYROS_SSO_VERSION ?? "4.4.0",
      edition: process.env.KYROS_EDITION ?? "standard",
      applicationScope: process.env.KYROS_APPLICATION_SCOPE ?? "standard",
      timeoutSeconds: readInt(process.env.KYROS_TIMEOUT_SECONDS, 5),
    },
  };
}