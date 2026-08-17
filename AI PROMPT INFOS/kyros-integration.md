# Arcline ↔ Kyros : Guide d'intégration pour IA

Ce document décrit comment **Arcline** (jeu de duel d'archers) doit se connecter à **Kyros**
(service central d'authentification / SSO de l'écosystème LUMA). N'importe quelle IA
doit pouvoir intégrer Arcline à Kyros en suivant ce guide seul.

Source des infos : dépôts `kyros`, `ct_pasimal`, `ARC`, `nino-backend`, `WinMa`, `nummo`.
Kyros installé actuellement : version **4.4.x** (contrat SSO `kyros_sso_version=4.4.0`).

---

## 1. Ce qu'est Kyros

- Service central d'identité, d'authentification et d'accès des modules LUMA.
- Fournit : inscription, connexion, hub applicatif, SSO par code d'autorisation,
  access tokens JWT courts (HS256), refresh tokens opaques avec rotation.
- L'utilisateur est identifié de façon stable par `sub` (JWT) / `user.id` (réponse `/token`).
  **Ne jamais lier un compte à l'email** (il peut changer).
- Environnement local actuel : **Kyros tourne déjà sur `http://localhost:3001`**
  (lors de l'installation d'Arcline, ne pas occuper ce port). Arcline utilise le port
  **3002**. Toujours lire l'URL Kyros depuis l'environnement, jamais en dur.

## 2. Mode d'intégration retenu pour Arcline

| Élément | Valeur |
| --- | --- |
| Mode | `sso` (recommendé, Kyros possède l'écran de connexion) |
| Scopes demandés | `profile email` (ou `profile` suffit) |
| Audience ressource | `kyros:sso:arcline` |
| Callback URL | `{PUBLIC_BASE_URL}/auth/callback` |
| Owner | `luma` |

Le joueur Arcline passe par le hub Kyros pour se connecter. Le pseudo de la home page
est dérivé du profil Kyros (`display_name` → `username`). Il n'y a **pas** de compte local
ni de formulaire de mot de passe dans Arcline (sauf mode dev fictif, voir §9).

## 3. Prérequis admin (une seule fois, humain)

Un client d'authentification doit exister dans la console admin Kyros (`/admin`) :

1. Créer une application : Nom `Arcline`, mode `sso`, périmètre `standard`.
2. Déclarer la callback : `http://localhost:<PORT>/auth/callback` (dev).
3. Déclarer les scopes autorisés : `profile email`.
4. Audience ressource : `kyros:sso:arcline` (si l'audience est laissée vide, Kyros la
   génère automatiquement sous la forme `kyros:sso:arcline`).
5. Copier le `client_secret` (affiché une seule fois à la création / rotation).
6. Aucune permission entreprise requise pour V1 : toute session Kyros valide suffit.

> Une rotation de secret invalide l'ancien secret, les codes d'autorisation en attente
> et tous les refresh tokens actifs de l'application.

## 4. Contrat d'environnement (clés identiques pour toutes les applications)

```env
# Arcline
PORT=3002                        # 3001 est occupé par Kyros en local
PUBLIC_BASE_URL=http://localhost:3002
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# Contrat SSO Kyros — clés identiques pour toutes les applications
AUTH_PROVIDER=kyros
KYROS_BASE_URL=http://localhost:3001
KYROS_AUTHORIZE_URL=http://localhost:3001/authorize
KYROS_TOKEN_URL=http://localhost:3001/token
KYROS_REVOKE_URL=http://localhost:3001/revoke
KYROS_CLIENT_ID=cli_xxx
KYROS_CLIENT_SECRET=secret_client_fourni_par_kyros
KYROS_JWT_SECRET=secret_jwt_global_partage_par_kyros
KYROS_ISSUER=kyros
KYROS_AUDIENCE=kyros-modules
KYROS_RESOURCE_AUDIENCE=kyros:sso:arcline
KYROS_REQUESTED_SCOPE=profile email
KYROS_REQUIRED_SCOPES=profile email
KYROS_SSO_VERSION=4.4.0
KYROS_EDITION=standard
KYROS_APPLICATION_SCOPE=standard
KYROS_TIMEOUT_SECONDS=5
```

Règles :
- Ne **jamais** committer de secret réel (`.env` dans `.gitignore`, seul `.env.example` est committé).
- Ne **jamais** exposer `client_secret` dans le frontend, les logs ou les erreurs détaillées.
- `KYROS_JWT_SECRET` sert à vérifier localement les access tokens côté backend.
- En dev, on peut activer un fallback sans SSO (voir §9).

## 5. Flow SSO à implémenter (côté serveur `apps/server`)

Le client Phaser n'est pas ouvert avant la fin du SSO : le serveur sert une page de
connexion / redirige vers Kyros. Pattern à suivre (copié du jeu `ct_pasimal`).

### 5.1 `/auth/login` — démarrer le SSO

```ts
const state = crypto.randomBytes(24).toString("hex");
res.cookie("arcline.state", state, {
  httpOnly: true,
  sameSite: "lax",
  maxAge: 10 * 60 * 1000,
});

const url = new URL(KYROS_AUTHORIZE_URL); // /authorize
url.search = new URLSearchParams({
  client_id: KYROS_CLIENT_ID,
  redirect_uri: `${PUBLIC_BASE_URL}/auth/callback`,
  scope: KYROS_REQUESTED_SCOPE,
  state,
  // poignée de main SSO attendue par Kyros :
  kyros_sso_version: KYROS_SSO_VERSION,
  kyros_edition: KYROS_EDITION,
  kyros_application_scope: KYROS_APPLICATION_SCOPE,
}).toString();

res.redirect(url.toString());
// construit l'URL avec URL/URLSearchParams, jamais par concaténation manuelle
```

### 5.2 `/auth/callback` — recevoir le code et l'échanger

```ts
app.get("/auth/callback", async (req, res) => {
  const { code, state } = req.query;
  const savedState = req.cookies["arcline.state"];
  // 1. vérifier state avec une comparaison à temps constant
  if (!state || !savedState || !crypto.timingSafeEqual(
    Buffer.from(String(savedState)), Buffer.from(String(state)),
  )) return res.status(400).json({ error: "invalid_state" });
  res.clearCookie("arcline.state");
  if (!code) return res.status(400).json({ error: "missing_code" });

  // 2. échanger le code (un seul usage, expire après 5 minutes)
  const response = await fetch(KYROS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: KYROS_CLIENT_ID,
      client_secret: KYROS_CLIENT_SECRET,
      code,
      redirect_uri: `${PUBLIC_BASE_URL}/auth/callback`,
      kyros_sso_version: KYROS_SSO_VERSION,
      kyros_edition: KYROS_EDITION,
      kyros_application_scope: KYROS_APPLICATION_SCOPE,
    }),
  });
  if (!response.ok) return res.status(401).json({ error: "token_exchange_failed" });
  const data = await response.json();
  // data = { access_token, expires_in, refresh_token, ..., user: {...} }

  // 3. vérifier le JWT HS256 (voir §6). Échec => 401.
  const decoded = await verifyAccessToken(data.access_token);
  if (!decoded) return res.status(401).json({ error: "invalid_token" });

  // 4. créer la session locale (§7)
  const sid = createSession(userFrom(data, decoded), data.access_token, data.refresh_token);
  res.cookie("arcline.sid", sid, { httpOnly: true, sameSite: "lax", maxAge: SESSION_TTL });
  res.redirect("/");
});
```

### 5.3 `/auth/logout`

```ts
app.get("/auth/logout", async (req, res) => {
  await destroySession(req.sid); // 1. POST /revoke avec refresh_token + métadonnées
  res.clearCookie("arcline.sid");
  res.redirect("/auth/login");   // 2. détruire la session locale
});
```

POST `/revoke` (best effort, ne pas bloquer sur une erreur) :

```json
{
  "client_id": "...",
  "client_secret": "...",
  "refresh_token": "...",
  "kyros_sso_version": "4.4.0",
  "kyros_edition": "standard",
  "kyros_application_scope": "standard"
}
```

Inspiration source : `ct_pasimal/src/auth.js` (flow complet en Node) et
`kyros/docs/ai-auth-quickstart.md`.

## 6. Vérification du JWT `access_token`

Claims à vérifier au minimum :

| Claim | Attendue |
| --- | --- |
| `alg` | `HS256` uniquement (refuser tout autre algorithme) |
| signature | HMAC-SHA256 avec `KYROS_JWT_SECRET`, comparaison à temps constant |
| `iss` | `kyros` |
| `aud` | `kyros-modules` (chaîne OU tableau) |
| `resource_aud` | `kyros:sso:arcline` (claim propre au module) |
| `sub` | chaîne non vide (clé stable du joueur) |
| `iat`/`exp` | pas expiré ; tolérer 30 s de dérive horloge au maximum |
| `scope`/`scopes` | doit contenir les scopes requis (`profile email`) |

Exemple Node avec `jsonwebtoken` (vérifie `iss`/`aud`/signature) + contrôle manuel de
`resource_aud` :

```ts
import jwt from "jsonwebtoken";

function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, KYROS_JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: KYROS_ISSUER,
      audience: KYROS_AUDIENCE,
    });
    if (typeof decoded === "string") return null;
    if (decoded.resource_aud !== KYROS_RESOURCE_AUDIENCE) return null;
    return decoded;
  } catch {
    return null;
  }
}
```

Si on préfère éviter la dépendance `jsonwebtoken`, implémenter HMAC-SHA256 manuellement
comme dans `ARC/kyros_auth.py` (base64url, `crypto.timingSafeEqual`, refus de `alg != HS256`).

## 7. Session locale du serveur (nécessaire pour le WebSocket)

Le serveur garde une Map en mémoire :

```ts
type Session = {
  sid: string;
  user: PlayerIdentity;   // sub / id / name / email / avatar
  accessToken: string;
  refreshToken: string;
  createdAt: number;
  expiresAt: number;      // ex. +12 h
};
```

`PlayerIdentity` pour Arcline :

```ts
type PlayerIdentity = {
  sub: string;                                  // identifiant stable du joueur
  name: string;                                 // display_name || username || name
  email?: string | null;
};
```

- Cookie session `arcline.sid` en `httpOnly`.
- Sur chaque accès : vérifier que `Date.now() < expiresAt`.
- Cette session est le support de l'authentification WebSocket (§8).

## 8. Authentification WebSocket : point spécifique à Arcline

Arcline se joue en WebSocket (`apps/server`). Le navigateur envoie automatiquement ses
cookies (dont `arcline.sid`) pendant le handshake WebSocket, si le WebSocket est
**same-origin** (`CLIENT_URL` == pages servies par le serveur ou proxy).

Au moment du handshake (`server.on("upgrade", ...)` ou `verifyClient`) :

```ts
server.on("upgrade", (req, socket) => {
  const sid = parseCookie(req.headers.cookie ?? "", "arcline.sid");
  const session = sid ? getSession(sid) : null;
  if (!session) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    return socket.destroy();
  }
  req.arclineUser = session.user;  // attaché puis récupéré dans wss.on("connection", ws)
});
```

Règles :
- Si le `sid` est absent ou la session expirée → refuser le handshake (401), pas de partie.
- Le `sub` Kyros devient le `playerId` stable dans les rooms. Le pseudo affiché est
  `session.user.name`.
- Le `playerSessionId` de reconnexion (spec §16) reste émis par le serveur du jeu mais
  se greffe sur la session Kyros : on conserve le slot du joueur pendant ~30-60 s.

Risque CORS/wrong-origin : en dev Vite sur `:5173` et serveur WS sur `:3001` sont deux
origines — soit le client et le serveur sont servis sur le même port (Vite proxy),
soit autoriser explicitement `CLIENT_URL` dans les origines autorisées.

## 9. Mode développement local sans Kyros

Le jeu reste jouable en local sans Kyros (même pattern que `ct_pasimal`) :

```ts
// En NODE_ENV=development et sans (KYROS_CLIENT_ID && KYROS_JWT_SECRET) :
//  - le SSO est désactivé ;
//  - l'utilisateur est fictif ;
const fakeUser = { sub: "dev-user", name: "Archer Dev", email: "dev@localhost" };
```

En `production`, l'absence de configuration Kyros doit **bloquer** la home page
(redirection SSO obligatoire, message d'erreur clair).

## 10. Erreurs Kyros à gérer proprement

| Erreur | Situation |
| --- | --- |
| `invalid_state` | `state` du callback ne correspond pas à la valeur en cookie |
| `invalid_code` | code expiré (5 min), déjà consommé, ou callback ne correspond pas |
| `invalid_client_secret` | secret applicatif incorrect (roté ?) |
| `invalid_redirect_uri` | callback non déclaré dans le client Kyros |
| `app_access_denied` | compte valide mais accès application refusé |
| `direct_login_not_allowed` | client configuré en `sso`, ne pas utiliser le grant `password` |
| `sso_not_allowed` | le client n'autorise pas `/authorize` |
| `unknown_client` | client_id inconnu ou application désactivée |

Mapping HTTP : identifiants invalides → 401 ; accès/scopes refusés → 403 ;
timeout/réseau vers Kyros → 503 ; réponse Kyros incohérente → 502 ;
configuration absente → 500.

## 11. Refresh token (rotation)

Nécessaire seulement si on veut maintenir la session Arcline au-delà de la vie de
l'access token (`expires_in` = 900 s par défaut). L'implémenter côté serveur :

```json
POST /token
{
  "grant_type": "refresh_token",
  "client_id": "...",
  "client_secret": "...",
  "refresh_token": "...",
  "kyros_sso_version": "4.4.0",
  "kyros_edition": "standard",
  "kyros_application_scope": "standard"
}
```

Remplacer **atomiquement** l'ancien refresh token par le nouveau. Kyros recalcule
l'accès au refresh : si les droits ont été retirés, plus aucun token n'est émis.

## 12. Connexion WebSocket ↔ identité : résumé

```text
GET /auth/login        → redirige vers Kyros /authorize (state en cookie httpOnly)
Kyros /authorize       → retour sur /auth/callback?code&state
GET /auth/callback     → check state, POST /token, verify JWT, session + cookie arcline.sid
GET /                  → page du jeu (protégée : requireAuth)
WS upgrade             → cookie arcline.sid → session → user → playerId = sub
api/serveur            → vérifie session arcline.sid pour les routes HTTP (si besoin)
```

## 13. Ce qu'il faut copier d'où

| Info | Source |
| --- | --- |
| Flow SSO complet côté serveur Node | `ct_pasimal/src/auth.js`, `server.js` |
| Vérification JWT manuelle (ARC/Python) | `ARC/kyros_auth.py` |
| Poignée de main SSO (métadonnées) | `kyros/docs/ai-auth-quickstart.md`, `nino-backend/docs/sso-guide.md` |
| Contrat d'env identique pour toutes les apps | `kyros/docs/sso-guide.md` (fin), `ct_pasimal/README.md` |
| Erreurs et revue | `kyros/docs/ai-auth-quickstart.md`, `nino-backend/docs/sso-guide.md` |

## 14. Checklist d'intégration

- [ ] Client `Arcline` créé dans l'admin Kyros (mode `sso`, scope `profile email`,
      audience `kyros:sso:arcline`)
- [ ] `.env.example` avec le contrat complet §4 (aucun secret committé)
- [ ] `/auth/login`, `/auth/callback`, `/auth/logout` implémentés côté `apps/server`
- [ ] Vérification JWT stricte (§6)
- [ ] Session locale + cookie `arcline.sid` httpOnly (§7)
- [ ] WebSocket handshake authentifié via cookie, `playerId = sub` (§8)
- [ ] Fallback dev sans SSO (§9)
- [ ] Refresh token avec rotation (§11)
- [ ] Tests : code invalide, state invalide, JWT altéré, mauvais issuer/audience,
      resource_aud erroné, token expiré, handshake WS refusé sans session, revoke échoué