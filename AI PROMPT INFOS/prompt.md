# PROJET : Duel d’archers web multijoueur

Je veux créer un jeu web inspiré du principe de **Bowman**, mais avec une identité, un code, une interface et des assets originaux.

Le principe est simple :

* 2 joueurs s’affrontent à l’arc
* jeu au tour par tour
* chaque joueur règle son angle et sa puissance
* la flèche suit une trajectoire balistique
* le vent influence éventuellement la trajectoire
* les dégâts dépendent de la zone touchée
* le premier joueur à perdre tous ses PV perd la partie

Je veux commencer par une **V1 propre, jouable et fonctionnelle**, conçue pour pouvoir évoluer ensuite vers une V2 et une V3.

---

## ⚠️ MISE À JOUR DE VISION (à lire avant tout le reste)

**Nouvelle structure du projet :**

1. Le jeu s'ouvre sur un **menu au chargement** avec deux entrées : **Solo** et **Multiplayer**.
2. **Le Solo est développé EN PREMIER.** Le Multiplayer est verrouillé pendant la V1
   (bouton visible avec « Bientôt ») puis développé ensuite.
3. En conséquence :
   - la section « Party privées » (§5), le serveur autoritaire (§9), la synchronisation
     du projectile (§10) et l'authentification Kyros relèvent du **Multiplayer (V2)** ;
   - le **Solo (V1)** consiste en un duel joueur ↔ **bot (IA)** entièrement côté client,
     avec le même cœur de gameplay (visée, physique, vent, dégâts, tours, victoire).
4. La **logique de gameplay pure** (physique, dégâts, tours, validation de tir) doit vivre
   dans `packages/shared` pour être réutilisée telle quelle côté serveur en V2.
5. Le menu remplace l'« écran d'accueil » décrit en §4 : pas de champ pseudo ni de rooms
   en V1, uniquement les boutons Solo / Multiplayer.

La ROADMAP complète est dans `ROADMAP.md`, le déroulement dans `TODO.md`.

---

# 1. Stack technique

Utiliser :

## Frontend

* TypeScript
* Phaser 3
* Vite
* HTML / CSS
* interface responsive desktop en priorité

## Backend

* Node.js
* TypeScript
* WebSocket

Utiliser de préférence la librairie :

```text
ws
```

Éviter Socket.IO sauf justification technique réellement pertinente.

## Gestion des dépendances

IMPORTANT :

**NE PAS utiliser npm.**

Utiliser exclusivement :

```bash
pnpm
```

Toutes les commandes, scripts, documentation et exemples doivent utiliser `pnpm`.

Exemples :

```bash
pnpm install
pnpm dev
pnpm build
pnpm start
```

---

# 2. Architecture souhaitée

Créer un monorepo pnpm.

Structure indicative :

```text
bow-game/
├── apps/
│   ├── client/
│   └── server/
│
├── packages/
│   └── shared/
│
├── docs/
│
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

Le package `shared` doit contenir les types communs entre client et serveur :

* événements WebSocket
* joueurs
* parties
* tirs
* résultats
* configuration de gameplay

Ne pas dupliquer les interfaces TypeScript côté client et serveur.

---

# 3. Convention importante pour les fichiers

Dans les fichiers de code où cela est pertinent, ajouter en première ligne un commentaire indiquant le chemin ou le nom du fichier.

Exemple :

```ts
// apps/server/src/game/GameRoom.ts
```

ou :

```ts
// Player.ts
```

---

# 4. V1

La V1 doit rester raisonnablement petite.

Je veux une première version réellement jouable avant d'ajouter des fonctionnalités secondaires.

## Écran d'accueil (MENU)

Créer un écran de menu au chargement avec :

* titre du jeu (`Arcline`)
* bouton `Solo` → lance la partie contre le bot (V1)
* bouton `Multiplayer` → affiché mais **verrouillé** en V1 (« Bientôt »)

> Remplacé en V1 : plus de champ pseudo, plus de rooms. Le menu, puis le duel contre le bot.
> Le multi (pseudo, créer/rejoindre) reviendra avec la V2 (voir MISE À JOUR DE VISION).

---

# 5. Parties privées

Lorsqu'un joueur crée une partie :

* le serveur génère un code court
* exemple :

```text
F7KD2
```

Le joueur obtient ce code et peut l'envoyer à un autre joueur.

Le second joueur saisit le code pour rejoindre.

Maximum :

```text
2 joueurs
```

Lorsque les deux joueurs sont connectés :

```text
WAITING
→
STARTING
→
PLAYING
```

---

# 6. Gameplay

Chaque joueur possède :

```text
100 HP
```

La partie est au tour par tour.

Exemple :

```text
Joueur 1
↓
vise
↓
tire
↓
animation du projectile
↓
résultat
↓
Joueur 2
```

Le joueur actif peut régler :

* angle
* puissance

Exemple :

```text
angle : 0 → 90°
puissance : 0 → 100 %
```

L'interface doit clairement afficher :

* joueur actif
* angle
* puissance
* PV joueur 1
* PV joueur 2
* direction du vent
* puissance du vent

---

# 7. Contrôle du tir

Je veux retrouver une sensation proche du Bowman original.

Le joueur doit pouvoir utiliser la souris.

Concept :

```text
clic
↓
drag
↓
définition angle + puissance
↓
relâchement
↓
tir
```

Afficher visuellement :

* direction
* puissance
* éventuellement une petite ligne d'aide

Mais ne pas afficher toute la trajectoire réelle de la flèche.

---

# 8. Physique

La trajectoire doit utiliser une vraie formule balistique simple.

Prendre en compte :

* vitesse initiale
* angle
* gravité
* vent

Exemple conceptuel :

```text
vx = cos(angle) * power
vy = sin(angle) * power
```

Puis :

```text
x += vx * dt
y += vy * dt

vy += gravity * dt
vx += wind * dt
```

Les constantes doivent être configurables.

Créer par exemple :

```ts
export const GAME_CONFIG = {
  gravity: ...,
  maxPower: ...,
  maxWind: ...,
};
```

Ne pas disperser des valeurs magiques dans le projet.

---

# 9. Serveur autoritaire

POINT IMPORTANT.

Le client ne doit pas décider :

* si un joueur a été touché
* combien de dégâts sont infligés
* qui gagne
* quel joueur joue
* du résultat final de la trajectoire

Le client envoie uniquement une intention.

Exemple :

```ts
{
  type: "SHOOT",
  angle: 42,
  power: 78
}
```

Le serveur vérifie :

* que c'est bien le tour du joueur
* que l'angle est valide
* que la puissance est valide
* que la partie est en cours

Puis le serveur calcule le tir.

Le serveur reste la source de vérité.

---

# 10. Synchronisation du projectile

Une fois le tir validé, les deux joueurs doivent voir la même action.

Le serveur peut envoyer :

```ts
{
  type: "SHOT_STARTED",
  playerId: "...",
  angle: 42,
  power: 78,
  wind: -2
}
```

Puis le client reproduit visuellement la trajectoire.

À la fin, le serveur envoie le résultat officiel.

Par exemple :

```ts
{
  type: "SHOT_RESULT",
  hit: true,
  bodyPart: "HEAD",
  damage: 50,
  remainingHp: 50
}
```

---

# 11. Hitboxes

Créer plusieurs zones simples sur le personnage.

Minimum :

```text
HEAD
BODY
LEGS
```

Exemple de dégâts :

```text
HEAD = 50
BODY = 30
LEGS = 20
```

Ces valeurs doivent être configurables.

---

# 12. Terrain

V1 :

un seul terrain.

Style :

* extérieur
* simple
* lisible
* deux joueurs séparés
* éventuellement différences légères de hauteur

Pas besoin de générateur procédural pour le moment.

Utiliser des graphismes temporaires simples si aucun asset n'est disponible.

Ne jamais bloquer le développement parce qu'il manque un asset.

---

# 13. Direction des joueurs

Le joueur situé à gauche tire vers la droite.

Le joueur situé à droite tire vers la gauche.

Adapter correctement :

* calcul de l'angle
* sprite
* lancement
* animation
* trajectoire

---

# 14. Vent

À chaque nouveau round ou nouveau tour, selon le choix d'architecture retenu, générer un vent.

Exemple :

```text
-10 ←──── 0 ────→ +10
```

Afficher une flèche dans l'interface :

```text
← 6
```

ou :

```text
3 →
```

Le vent doit réellement modifier la trajectoire.

---

# 15. Conditions de victoire

Lorsqu'un joueur atteint :

```text
0 HP
```

la partie passe en :

```text
FINISHED
```

Afficher :

```text
Victoire
```

ou :

```text
Défaite
```

avec un bouton :

```text
Revanche
```

La revanche doit pouvoir relancer une nouvelle partie avec les mêmes joueurs.

---

# 16. Déconnexion

Prévoir correctement :

* fermeture volontaire
* perte réseau
* actualisation accidentelle

Pour la V1, une reconnexion simple peut être implémentée avec un token temporaire.

Exemple :

```text
playerSessionId
```

Conserver temporairement le slot du joueur pendant quelques dizaines de secondes.

Si le joueur revient :

```text
RECONNECT
```

Sinon l'autre joueur gagne éventuellement par abandon.

Ne pas construire un système complexe de compte utilisateur.

---

# 17. WebSocket

Créer un protocole clair.

Par exemple :

## Client → Server

```text
CREATE_ROOM
JOIN_ROOM
PLAYER_READY
SHOOT
REQUEST_REMATCH
PING
RECONNECT
```

## Server → Client

```text
ROOM_CREATED
ROOM_JOINED
PLAYER_JOINED
GAME_START
TURN_STARTED
SHOT_STARTED
SHOT_RESULT
PLAYER_DAMAGED
GAME_FINISHED
PLAYER_DISCONNECTED
PLAYER_RECONNECTED
ERROR
PONG
```

Créer les types dans :

```text
packages/shared
```

Utiliser des discriminated unions TypeScript.

Exemple :

```ts
type ClientMessage =
  | {
      type: "SHOOT";
      angle: number;
      power: number;
    }
  | {
      type: "JOIN_ROOM";
      roomCode: string;
    };
```

---

# 18. Validation

Toutes les données reçues depuis WebSocket doivent être validées.

Ne jamais faire confiance aux données envoyées par le navigateur.

Vérifier notamment :

```text
angle
power
roomCode
playerId
état de la partie
tour actuel
```

---

# 19. Sécurité minimale

Prévoir :

* limitation de taille des messages WebSocket
* rate limiting léger
* validation stricte
* protection contre le spam de `SHOOT`
* impossible de jouer lorsque ce n'est pas son tour
* impossible de rejoindre une partie pleine
* impossible de continuer une partie terminée

---

# 20. UI

Je veux quelque chose de moderne mais simple.

Pendant une partie :

```text
┌──────────────────────────────────────────────┐
│ Player1 ❤️ 100       Vent → 4      100 ❤️ P2 │
├──────────────────────────────────────────────┤
│                                              │
│                                              │
│     O                                 O      │
│    /|\                               /|\     │
│    / \                               / \     │
│                                              │
│______________________________________________│
│                                              │
│ Angle: 43°         Puissance: ███████ 72%   │
└──────────────────────────────────────────────┘
```

L'interface finale peut évidemment être plus jolie.

---

# 21. Responsive

Priorité :

```text
Desktop
```

Mais prévoir une architecture qui permettra plus tard :

```text
mobile
tablette
```

Ne pas passer trop de temps sur le tactile pendant la V1.

---

# 22. Son

Préparer un système audio permettant plus tard :

* tir
* impact
* ambiance
* interface

Quelques sons libres peuvent être utilisés si leur licence le permet.

Documenter leurs licences.

Si aucun son n'est disponible, utiliser des placeholders ou ne rien utiliser.

---

# 23. Assets

Ne pas copier les assets originaux de Bowman.

Créer une identité originale.

Il est possible d'utiliser :

* assets CC0
* assets libres
* formes Phaser temporaires
* assets générés spécifiquement pour le projet

Toute ressource externe doit être documentée :

```text
nom
URL
licence
auteur si nécessaire
```

Créer :

```text
docs/ASSETS.md
```

---

# 24. README

Créer un README complet avec :

* description du projet
* architecture
* prérequis
* installation
* développement
* build
* démarrage serveur
* ports utilisés
* variables d'environnement
* protocole WebSocket
* structure des dossiers

Toutes les commandes doivent utiliser :

```text
pnpm
```

et jamais npm.

---

# 25. Environnement

Créer des fichiers :

```text
.env.example
```

Exemple :

```env
PORT=3001
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Ne jamais commit de secret.

---

# 26. Qualité du code

Je veux :

* TypeScript strict
* pas de `any` sauf justification
* fonctions courtes
* responsabilités séparées
* noms explicites
* logique métier indépendante du rendu Phaser quand possible
* commentaires uniquement lorsqu'ils apportent réellement quelque chose

Éviter la sur-ingénierie.

La priorité reste :

```text
JEU JOUABLE
>
ARCHITECTURE PARFAITE
```

---

# 27. Tests

Tester au minimum les éléments critiques :

* calcul trajectoire
* validation des tirs
* calcul dégâts
* changement de tour
* victoire
* room pleine
* mauvais code de room
* joueur essayant de jouer hors tour

Utiliser un framework compatible TypeScript tel que Vitest.

---

# 28. TODO LIST OBLIGATOIRE

AVANT de commencer réellement le développement, créer :

```text
TODO.md
```

Cette TODO doit être organisée par phases.

Exemple :

```markdown
# TODO

## Phase 1 - Bootstrap

- [ ] Monorepo pnpm
- [ ] Client Phaser
- [ ] Serveur WebSocket
- [ ] Shared package

## Phase 2 - Networking

- [ ] Création room
- [ ] Join room
- [ ] Synchronisation joueurs

## Phase 3 - Gameplay

- [ ] Terrain
- [ ] Joueurs
- [ ] Aim
- [ ] Power
- [ ] Projectile
- [ ] Collisions

...
```

Mettre à jour cette TODO au fur et à mesure.

Cocher réellement les tâches terminées.

Ne jamais considérer une tâche comme terminée si elle n'est pas fonctionnelle.

---

# 29. ROADMAP

Créer également :

```text
ROADMAP.md
```

Elle doit comporter :

# V1

La V1 développée actuellement.

Objectif :

> Duel d'archers 1v1 jouable en ligne.

Fonctionnalités essentielles :

* parties privées
* WebSocket
* visée
* puissance
* physique
* vent
* dégâts
* tours
* victoire
* revanche

---

# V2 - Proposition

Imaginer et documenter une évolution raisonnable.

Pistes possibles :

## Matchmaking

* matchmaking automatique
* file d'attente

## Compte joueur

Optionnel :

* pseudo permanent
* statistiques

## Progression

* victoires
* défaites
* précision
* headshots

## Gameplay

* plusieurs terrains
* obstacles
* distances variables
* types d'arcs
* météo

## Personnalisation

* skins
* arcs
* flèches

## Spectateurs

Permettre d'observer une partie.

## Mobile

Ajouter de vrais contrôles tactiles.

---

# V3 - Proposition

La V3 peut transformer le projet en jeu beaucoup plus complet.

Imaginer notamment :

## Classement

* ranking
* saisons
* Elo ou système similaire

## Tournois

```text
8 joueurs
16 joueurs
32 joueurs
```

Bracket automatique.

## Modes

* 1v1 classique
* mort subite
* vent extrême
* distance aléatoire
* obstacle
* best of 3

## Amis

* liste d'amis
* invitation directe

## Replay

Le serveur stocke les actions essentielles :

```text
seed
angle
power
wind
résultat
```

et permet de rejouer un match.

## Spectateur temps réel

Observer les compétitions.

## Progression cosmétique

Déblocages uniquement visuels.

Éviter tout système pay-to-win.

## Classements

* mondial
* amis
* saison
* victoires
* précision
* headshots

---

# 30. Important concernant V2/V3

NE PAS implémenter la V2 et V3 maintenant.

Je veux uniquement :

```text
V1 = développement
V2 = proposition documentée
V3 = proposition documentée
```

Ne pas commencer à développer une fonctionnalité V2 parce qu'elle semble intéressante.

Terminer la V1 en premier.

---

# 31. Méthode de développement

Procéder progressivement.

Ordre conseillé :

```text
1. architecture
2. TODO
3. serveur WebSocket minimal
4. connexion client
5. rooms
6. terrain
7. joueurs
8. système de tour
9. visée
10. projectile
11. physique
12. collisions
13. dégâts
14. victoire
15. revanche
16. reconnexion
17. polish UI
18. tests
19. documentation
```

Après chaque grande étape :

* vérifier que le projet compile
* vérifier les erreurs TypeScript
* lancer les tests
* corriger avant de continuer

Ne pas accumuler 30 fichiers cassés avant de tester.

---

# 32. Première mission (ordre mis à jour : Solo d'abord)

Commence maintenant par :

1. analyser cette spécification (y compris la MISE À JOUR DE VISION)
2. créer l'architecture proposée
3. créer `TODO.md`
4. créer `ROADMAP.md`
5. créer le monorepo pnpm
6. initialiser client, serveur et shared
7. vérifier que tout démarre
8. construire ensuite le **Menu (Solo / Multiplayer)** puis le **jeu Solo** contre le bot

Ne saute pas directement à l'aspect graphique, mais le Solo passe avant le réseau :
le serveur WebSocket et Kyros ne sont branchés qu'en V2 (Multiplayer), pas en V1.
La logique de gameplay (physique, dégâts, tours) doit rester dans `packages/shared`
pour être réutilisée ensuite côté serveur sans réécriture.

---

# 33. Intégration Kyros (pour la V2 Multiplayer)

Arcline sera connecté à **Kyros**, le service central d'authentification / SSO de
l'écosystème LUMA. **Attention :** cela concerne le **Multiplayer (V2)**, pas le Solo (V1).
En V1, le jeu solo ne demande aucune authentification.

Toutes les informations techniques détaillées (env, endpoints, flow SSO, vérification
JWT, authentification WebSocket, mode dev, erreurs) sont dans :

```text
AI PROMPT INFOS/kyros-integration.md
```

Lire ce fichier AVANT de commencer le développement. Résumé :

- Le jeu utilise le mode `sso` : le joueur est redirigé vers Kyros pour se connecter.
- Pas de compte local : l'identité vient du profil Kyros (`display_name` / `username`).
- Le `sub` de Kyros est l'identifiant stable du joueur (utilisé comme `playerId`).
- Le serveur WebSocket vérifie la session Kyros via le cookie httpOnly lors du handshake.
- En dev local sans configuration Kyros, le SSO est désactivé et un joueur fictif est
  utilisé pour que le jeu reste jouable.
- Toutes les clés d'environnement suivent le contrat commun : `KYROS_BASE_URL`,
  `KYROS_AUTHORIZE_URL`, `KYROS_TOKEN_URL`, `KYROS_CLIENT_ID`, `KYROS_CLIENT_SECRET`,
  `KYROS_JWT_SECRET`, `KYROS_RESOURCE_AUDIENCE` (`kyros:sso:arcline`), etc.

L'écran d'accueil de la section `# 4` reste tel quel, mais le pseudo du joueur est
pré-rempli depuis la session Kyros au lieu d'un champ libre.

---

# 34. Infos IA centralisées

Toute information nécessaire pour coder le projet (spécifications, intégration Kyros,
nouveautés) doit être documentée dans le dossier :

```text
AI PROMPT INFOS/
```

Chaque IA travaillant sur ce projet doit :

1. lire `prompt.md` (la spécification complète),
2. lire les fichiers complémentaires du dossier `AI PROMPT INFOS/`,
3. mettre à jour ces documents quand une décision importante est prise,
4. ne rien implémenter qui contredise cette documentation sans la mettre à jour.