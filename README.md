# Arcline — Duel d'archers

Duel d'archers 1v1, tour par tour, inspiré du principe de **Bowman** avec une identité, un code et
des assets originaux. À chaque tour, le vent change, on vise à la souris et la flèche suit une
vraie physique balistique. Le **mode Solo** (joueur contre une IA) est terminé ; le **Multiplayer**
(WebSocket + SSO Kyros) est prévu pour la V2.

## Fonctionnalités (V1 — Solo)

- **Menu** avec « Jouer en solo » (multijoueur verrouillé « Bientôt »)
- **Visée à la souris** : clic → drag → relâcher pour tirer (angle 0–90°, puissance 0–100 %)
- **Physique balistique** : gravité + vent régénéré à chaque tour, réellement appliqué au vol
- **3 terrains tirés au sort** (`Prairie à l'aube`, `Canyon crépusculaire`, `Hauts plateaux
  venteux`), chacun avec une **gravité propre** qui change la portée et la courbure des tirs
- **Distance variable** : le bot est placé plus ou moins loin à chaque partie (toujours dans la
  portée d'un tir max)
- **Dégâts par zone** : HEAD (50), BODY (30), LEGS (20), 100 PV par camp
- **Bot (IA)** : choisit angle + puissance (stratégie + bruit), windup animé visible, délais
  aléatoires
- **HUD** : bannières de tour, compteur de tour + nom de carte, PV animés avec chiffres, vent,
  aide à la visée (tracé pointillé + risque coloré)
- **Rétroactions** : recul de l'archer, flinch de la cible, particules d'impact, shake caméra,
  sons procéduraux + piste musicale
- **Réglages en jeu** : volume (musique/sons), tracé de la dernière flèche, aide à la visée
- **Fin de partie** : victoire/défaite, revanche, retour au menu

## Architecture

Monorepo **pnpm** avec trois packages :

```text
apps/
  client/   Vite + Phaser 3 — rendu, scènes, HUD, sons, contrôles (port 5173)
  server/   Node.js + Express + ws — WebSocket multi (V2), SSO Kyros (port 3002)
packages/
  shared/   Logique pure et testable : config, physique, hitboxes, tours, victoire, bot, protocole
docs/           Assets et conventions
AI PROMPT INFOS/ Spécification + guide d'intégration Kyros
```

La règle d'or : **la logique de gameplay vit dans `packages/shared`** (aucune dépendance au
rendu), pour être réutilisée à l'identique côté serveur en multijoueur. Le client ne fait que
piloter l'affichage et les entrées.

### Côté client

- Scènes Phaser : `BootScene` → `MenuScene` → `GameScene` (+ réglages en overlay)
- Modules : `archer`, `aim`, `arrow`, `audio`, `environment`, `terrain`, `layout`
- UI : `button`, `pill`, `settings-menu`, tokens de design (couleurs, typo, rayons, espacements)

## Prérequis

- **Node.js ≥ 20** (testé sur la version LTS)
- **pnpm ≥ 9** (le repo utilise `pnpm@11.22.0`)
- Un navigateur desktop récent (Chrome, Edge, Firefox, Safari)

## Installation

```bash
git clone <votre-depot> arcline
cd arcline
pnpm install
```

## Développement

```bash
pnpm dev
```

- Compile `shared`, puis lance le **client** (Vite, HMR) et le **serveur** en parallèle.
- Client : <http://localhost:5173> (port libre suivant sinon)
- Serveur : <http://localhost:3002>, healthcheck sur `/health`
- **Le port 3001 est réservé à Kyros** : ne pas l'utiliser.

Config serveur : copier `apps/server/.env.example` vers `apps/server/.env` puis adapter.
Les variables `KYROS_*` ne sont utilisées que pour la V2.

## Build & vérifications

```bash
pnpm build        # compile shared, server et client (prod)
pnpm typecheck    # TypeScript strict sur les 3 packages
pnpm test         # Vitest (shared + client)
```

Toutes les commandes doivent se terminer sans erreur. Le client en production peut être servi
avec `pnpm --filter @arcline/client preview` après un build.

## Ports

| Service | Port  | Rôle |
| --- | --- | --- |
| Client Vite (dev) | 5173 | Jeu (serveur de dev / preview) |
| Serveur Node | 3002 | API / WebSocket (V2), `/health` |
| Kyros (SSO) | 3001 | Ne pas utiliser — réservé |

## Documentation

- `TODO.md` — avancement phase par phase (0 → 12)
- `ROADMAP.md` — feuille de route V1 / V2 / V3
- `docs/ASSETS.md` — assets, sons et workflow Suno
- `AI PROMPT INFOS/` — spécification + guide d'intégration Kyros (pour IA)
