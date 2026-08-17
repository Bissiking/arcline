# arcline

Duel d'archers (Bowman-like, identité originale). Menu au chargement avec deux entrées :
**Solo** et **Multiplayer**. Le **Solo** (joueur vs IA) est développé en premier ; le
**Multiplayer** (WebSocket, rooms, SSO Kyros) viendra après.

## Structure

```text
apps/
  client/   Vite + Phaser 3 (port 5173, fallback auto)
  server/   Node.js + ws + Express (port 3002, utilisé pour le multi en V2)
packages/
  shared/   Types communs + logique pure (protocol, config, physique)
docs/       Documentation (assets…)
AI PROMPT INFOS/   Spécification + intégration Kyros (pour IA)
```

## Prise en main

```bash
pnpm install
pnpm dev        # build shared, puis client + serveur en parallèle
```

- Client : http://localhost:5173 (ou port libre suivant)
- Serveur : http://localhost:3002, `/health`
- Le port 3001 est occupé par Kyros : ne pas l'utiliser.

## Scripts

| Commande | Rôle |
| --- | --- |
| `pnpm dev` | Build `shared` puis lance client + serveur |
| `pnpm build` | Construit les 3 packages |
| `pnpm typecheck` | TypeScript strict sur les 3 packages |
| `pnpm test` | Tests Vitest |

## Documentation pour IA

Voir `AI PROMPT INFOS/` (spécification complète + guide Kyros), `TODO.md`, `ROADMAP.md`.