# ASSETS — Arcline

Règles :

- Ne jamais copier les assets originaux de Bowman.
- Chaque ressource externe doit être documentée ci-dessous : nom, URL, licence, auteur.
- En l'absence d'asset, utiliser des formes Phaser temporaires.
- Ne jamais bloquer le développement faute d'asset.

## Assets utilisés

| Nom | URL | Licence | Auteur | Statut |
| --- | --- | --- | --- | --- |
| — (aucun pour l'instant) | — | — | — | placeholder |

## Musique (générée)

Les pistes sont générées avec [Suno](https://suno.com). Chaque piste est
déposée dans `apps/client/public/audio/music/` et déclarée dans
`apps/client/public/audio/music/manifest.json` (id, titre, auteur, fichier).
Le jeu charge le manifest au boot, joue la première piste en boucle et affiche
son titre dans le HUD. En l'absence de piste, une musique procédurale de repli
est jouée.