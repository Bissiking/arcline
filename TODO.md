# TODO — Arcline (V1 = Menu + Solo)

Duel d'archers 1v1. **V1 : menu + Solo (contre un bot).** Multiplayer = V2 (roome, WebSocket,
Kyros), documenté en fin de fichier et non codé en V1.
Tâches **petites et précises** ; cochées uniquement quand elles sont **fonctionnelles et
vérifiées** (compilation, types, tests).
Sources : `AI PROMPT INFOS/prompt.md` et `AI PROMPT INFOS/kyros-integration.md`.

---

## Phase 0 — Fondations & documentation (fait)

- [x] Écrire la spécification V1 (`AI PROMPT INFOS/prompt.md`)
- [x] Documenter l'intégration Kyros (`AI PROMPT INFOS/kyros-integration.md`)
- [x] Créer `TODO.md` (ce fichier)
- [x] Créer `ROADMAP.md` (menu Solo/Multiplayer, Solo d'abord)
- [x] Initialiser `docs/ASSETS.md` (placeholder, règles + tableau)

## Phase 1 — Bootstrap monorepo pnpm (fait)

- [x] Racine monorepo : `pnpm-workspace.yaml` (+ `allowBuilds` esbuild), `package.json`, `.gitignore`
- [x] `packages/shared` (TypeScript, lib, build via `prepare`)
- [x] `apps/server` (Node + TypeScript + `ws`) et `apps/client` (Vite + Phaser 3 + TS)
- [x] `maxPayload` WebSocket limité ; `pnpm install/build/typecheck/test` OK
- [x] `.env.example` serveur (contrat Kyros appliqué)

## Phase 2 — Menu principal (Solo / Multiplayer) (fait)

- [x] Scène `MenuScene` au chargement : titre « Arcline »
- [x] Bouton **Solo** → démarre la partie solo (placeholder `GameScene`)
- [x] Bouton **Multiplayer** affiché mais verrouillé (« Bientôt » en V1)
- [x] Navigation de scènes : menu → partie → retour menu
- [ ] Fin de partie → revanche (arrivée avec Phase 8)
- [x] Design tokens visuels partagés (couleurs, typo, espacements) dans `src/ui/tokens.ts`

## Phase 3 — Terrain & archer (base solo) (fait)

- [x] Scène de partie : monde fixe 1280×720 (`Scale.FIT`), fond, terrain simple lisible
- [x] Sprite archer côté gauche (formes Phaser temporaires, arc + flèche)
- [x] Hitboxes HEAD / BODY / LEGS sur le personnage (positions relatives) dans `packages/shared/src/hitbox.ts` + visualisation overlay
- [x] Constantes de layout : tailles, positions, hauteurs (`src/game/layout.ts`)

## Phase 4 — Visée à la souris

- [ ] Clic → drag → angle (0-90°) + puissance (0-100) → relâchement → tir
- [ ] Affichage direction + puissance pendant le drag (pas la trajectoire complète)
- [ ] Validation client des valeurs avant simulation

## Phase 5 — Projectile & physique

- [ ] Trajectoire balistique (`GAME_CONFIG` : gravité, échelle vitesse)
- [ ] Animation de la flèche le long de la trajectoire
- [ ] Arrêt au contact du sol / hors du monde

## Phase 6 — Vent

- [ ] Génération du vent par tour (`GAME_CONFIG.windMin/max`)
- [ ] Écart de trajectoire réel sous l'effet du vent
- [ ] Affichage direction + force du vent

## Phase 7 — Bot adverse (IA simple)

- [ ] Bot qui choisit angle + puissance (stratégie simple + bruit)
- [ ] Alternance des tours joueur ↔ bot (délai de tir du bot)
- [ ] Sauvegarde du choix de tir du bot dans la logique partagée

## Phase 8 — Dégâts, victoire & revanche

- [ ] Détection d'impact par hitbox, dégâts config (`HEAD=50, BODY=30, LEGS=20`)
- [ ] Barres de PV (100 HP)
- [ ] Condition de victoire / défaite + écran de fin
- [ ] Revanche : relancer une partie contre le bot

## Phase 9 — HUD & polish

- [ ] HUD : joueur actif, angle, puissance, PV ×2, vent
- [ ] Rétroactions : tir, impact, dégâts (flash / shake)
- [ ] Style moderne et simple, desktop prioritaire

## Phase 10 — Son (placeholder possible)

- [ ] Module audio (tir, impact) avec placeholders si aucun asset
- [ ] Sons libres documentés dans `docs/ASSETS.md` (nom, URL, licence) ou rien

## Phase 11 — Tests solo (Vitest)

- [ ] Trajectoire (angle, vent, gravité)
- [ ] Validation du tir (angle/power hors limites)
- [ ] Dégâts par hitbox
- [ ] Changement de tour (joueur → bot → joueur)
- [ ] Condition de victoire / fin de partie
- [ ] Vent : modifie réellement la portée
- [ ] Bot : produit un angle/power valides

## Phase 12 — Documentation livrable V1

- [ ] `README.md` complet (description, architecture, prérequis, install, dev, build, ports)
- [ ] Mettre à jour `TODO.md` / `ROADMAP.md` à l'avancement
- [ ] Vérification finale : `pnpm build`, `pnpm typecheck`, `pnpm test` sans erreur

---

# V2 — Multiplayer (PROCHAIN, PAS codé en V1)

Ne pas commencer ces tâches tant que la V1 (solo) n'est pas jouable.

## Protocol & serveur WebSocket

- [ ] Types partagés : discriminated unions `ClientMessage` / `ServerMessage`
- [ ] Types : `Player`, `Room`, `Shot`, `ShotResult`, `GameConfig`
- [ ] Serveur `ws` : PING/PONG, validation stricte, rate limiting
- [ ] Limitation taille des messages, protection anti-spam `SHOOT`

## Authentification Kyros

- [ ] `KYROS_*` dans `.env`, validation config au démarrage
- [ ] `/auth/login` → `state` + cookie httpOnly + redirection `/authorize`
- [ ] `/auth/callback` : échange code, vérif JWT (HS256, iss, aud, resource_aud)
- [ ] Session locale + cookie `arcline.sid`, refresh token avec rotation
- [ ] Handshake WebSocket authentifié (session valide exigée)
- [ ] Fallback dev : joueur fictif si Kyros non configuré

## Rooms & synchronisation

- [ ] `CREATE_ROOM`/`JOIN_ROOM`, code court, max 2 joueurs, erreurs (pleine/inconnue)
- [ ] `/auth` serveur autoritaire : tour, dégâts, victoire, résultat de trajectoire
- [ ] `SHOT_STARTED` / `SHOT_RESULT` synchronisés chez les 2 joueurs
- [ ] `GAME_START` / `TURN_STARTED` / `GAME_FINISHED`
- [ ] Revanche multi, déconnexion / reconnexion (`playerSessionId`, slot temporaire)
- [ ] Bouton **Multiplayer** activé dans le menu