# ROADMAP — Arcline

Duel d'archers en ligne, inspiré du principe de Bowman (identité, code, interface et assets
originaux). Le jeu s'ouvre sur un **menu** au chargement avec deux entrées :

```text
┌──────────────┐
│   ARCLINE    │
│  [ Solo ]    │  ← développé en premier
│ [Multiplayer]│  ← verrouillé ("Bientôt") en V1, développé ensuite
└──────────────┘
```

Le **Solo** est développé en premier. Le **Multiplayer** vient dans la foulée. La logique
de gameplay pure (physique, dégâts, tours) vit dans `packages/shared` afin d'être réutilisée
à l'identique côté serveur pour le multi.

---

## V1 — Menu + Solo (jouable contre une IA)

> Objectif : duel d'archers **solo** jouable sur navigateur desktop (contre un bot).

### Écran de menu

- Titre « Arcline » + boutons **Solo** et **Multiplayer**
- Multiplayer visible mais verrouillé en V1 (« Bientôt »)
- Navigation de scènes (menu → partie → fin de partie → revanche)

### Gameplay solo

- Plusieurs terrains (ciel, relief, flore) tirés au sort, chacun avec une **gravité propre**
- Personnage archer (sprites temporaires si pas d'assets)
- Visée à la souris : clic → drag → angle + puissance → relâchement → tir
- Physique balistique (gravité, vent) configurable via `GAME_CONFIG`
- Distance du bot variable (toujours dans la portée d'un tir max)
- Tours : le joueur tire, le **bot** (IA simple) lui répond
- 100 HP, dégâts par zone touchée (HEAD / BODY / LEGS)
- Vent généré par tour, réellement intégré à la trajectoire
- Victoire / défaite + revanche
- HUD : joueur actif, angle, puissance, PV ×2, direction + force du vent, compteur de tour
- Son (placeholder si aucun asset libre)
- Desktop prioritaire, architecture compatible mobile
- Tout se joue côté client ; la logique pure reste dans `packages/shared`

---

## V2 — Multiplayer (après le Solo)

> L'ancienne "V1 multijoueur" de la spec initiale devient la V2.

- **Parties privées** : code court (ex. `F7KD2`), 2 joueurs max
- **Réalisation technique** : WebSocket (`ws`), serveur autoritaire
- **Authentification** : SSO **Kyros** (voir `AI PROMPT INFOS/kyros-integration.md`)
- Menu : le bouton **Multiplayer** devient actif
- Synchronisation des tirs (`SHOT_STARTED` / `SHOT_RESULT`), même action chez les 2 joueurs
- Tours, dégâts, victoire gérés côté **serveur** (source de vérité)
- Vent communiqué à chaque tour aux deux joueurs
- Revanche entre les mêmes joueurs
- Déconnexion / reconnexion (token temporaire, slot conservé ~30-60 s)
- Écran d'accueil multi : pseudo (Kyros), créer / rejoindre

---

## V3 — Proposition (jeu complet, non implémenté)

### Matchmaking

- matchmaking automatique, file d'attente

### Compte & progression

- pseudo permanent (Kyros), statistiques, victoires / défaites, précision, headshots

### Gameplay

- plusieurs terrains, obstacles, distances variables, types d'arcs, météo

### Personnalisation

- skins, arcs, flèches (cosmétique uniquement, aucun pay-to-win)

### Social

- spectateurs, amis, invitation directe

### Compétition

- classement (mondial / amis / saison), tournois (8 / 16 / 32, bracket auto), modes
  (mort subite, vent extrême, distance aléatoire, best of 3)

### Replay

- stocker les actions essentielles (angle, power, wind, résultat) et rejouer un match

### Mobile

- vrais contrôles tactiles

---

## Règles

- Terminer le **Solo (V1)** avant tout développement multi.
- La V2 (multiplayer) et la V3 restent des propositions documentées tant que la V1 n'est pas jouable.
- Pas d'implémentation d'une fonctionnalité future par simple attrait.