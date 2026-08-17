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

## Phase 4 — Visée à la souris (fait)

- [x] Clic → drag → angle (0-90°) + puissance (0-100) → relâchement → tir
- [x] Affichage direction (rayon + flèche) + puissance pendant le drag (pas la trajectoire complète)
- [x] Validation client des valeurs avant simulation (`aim-math.ts`, tests)
- [x] Réglage physique (`GAME_CONFIG` : gravity 700, arrowSpeedScale 10) pour que le tir atteigne l'adversaire

## Phase 5 — Projectile & physique (fait)

- [x] Trajectoire balistique (`GAME_CONFIG` : gravité, échelle vitesse) + arrêt au sol `groundBelow` / bornes `boundsX` dans `packages/shared`
- [x] Animation de la flèche le long de la trajectoire (`ArrowShot`, rotation suivant le sens)
- [x] Arrêt au contact du sol / hors du monde (flèche plantée puis fondu)

## Phase 6 — Vent (fait)

- [x] Génération du vent (`generateWind()` dans `packages/shared`, bornes `GAME_CONFIG.windMin/max`)
- [x] Écart de trajectoire réel sous l'effet du vent (déjà intégré à `simulateTrajectory`, appliqué)
- [x] Affichage direction + force du vent (« Vent → 4 » en haut de l'écran) — régénéré par tour en Phase 7

## Phase 7 — Bot adverse (IA simple) (fait)

- [x] Bot qui choisit angle + puissance (stratégie simple + bruit)
- [x] Alternance des tours joueur ↔ bot (délai de tir du bot)
- [x] Sauvegarde du choix de tir du bot dans la logique partagée

## Phase 8 — Dégâts, victoire & revanche (fait)

- [x] Détection d'impact par hitbox, dégâts config (`HEAD=50, BODY=30, LEGS=20`)
- [x] Barres de PV (100 HP)
- [x] Condition de victoire / défaite + écran de fin
- [x] Revanche : relancer une partie contre le bot

## Phase 9 — HUD & polish (fait)

- [x] HUD : joueur actif, angle, puissance, PV ×2, vent
- [x] Rétroactions : tir, impact, dégâts (flash / shake + sons)
- [x] Style moderne et simple, desktop prioritaire
- [x] Menu Réglages en jeu : musique, sons, volume, tracé de la dernière flèche, aide (point d'atterrissage)

## Phase 10 — Son

- [x] Module audio (tir, impact, musique) procédural WebAudio + pistes SUNO via manifest.json (dossier `public/audio/music/`)
- [x] Affichage de la piste en cours dans le HUD (« ♪ titre · auteur »)
- [x] Sons libres documentés dans `docs/ASSETS.md` (procédural + workflow Suno)

## Phase 11 — Tests solo (Vitest) (fait)

- [x] Trajectoire (angle, vent, gravité)
- [x] Validation du tir (angle/power hors limites)
- [x] Dégâts par hitbox
- [x] Changement de tour (joueur → bot → joueur)
- [x] Condition de victoire / fin de partie
- [x] Vent : modifie réellement la portée
- [x] Bot : produit un angle/power valides

## Phase 12 — Documentation livrable V1 (fait)

- [x] `README.md` complet (description, architecture, prérequis, install, dev, build, ports)
- [x] Mettre à jour `TODO.md` / `ROADMAP.md` à l'avancement
- [x] Vérification finale : `pnpm build`, `pnpm typecheck`, `pnpm test` sans erreur

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