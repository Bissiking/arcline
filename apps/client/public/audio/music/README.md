# Musique (SUNO ou autre)

Déposez ici vos fichiers de musique (`.ogg` recommandé, `.mp3` accepté) puis
ajoutez chaque piste au fichier `manifest.json` :

```json
{
  "tracks": [
    {
      "id": "main-theme",
      "title": "Arcline Theme",
      "author": "SUNO",
      "file": "main-theme.ogg"
    }
  ]
}
```

- `id` : identifiant unique (servira de clé de chargement Phaser).
- `title` : nom affiché dans le HUD (bandeau « ♪ … » en haut de l'écran).
- `author` : crédit affiché à côté du titre (ex. SUNO).
- `file` : nom du fichier, relatif à ce dossier.
- `role` : `"title"` pour la piste de l'écran de titre (jouée sur le menu).
  Sans rôle, la piste est une piste de partie, tirée au sort à chaque partie.

La piste d'écran titre (rôle `title`) est jouée sur le menu principal ; les
autres pistes sont mélangées en jeu. Sans aucune piste `title`, le menu reprend
la première ; sans piste de partie, ce sont les pistes restantes.

Si le tableau `tracks` est vide ou qu'aucun fichier n'est présent, le jeu joue
une musique d'ambiance procédurale en repli. Le rendu reste contrôlable via
le menu « Réglages » (musique on/off, volume).
