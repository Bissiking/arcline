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
- `tracks[0]` est la piste jouée en boucle. Ajoutez-en plusieurs pour pouvoir
  choisir/mélanger plus tard.

Si le tableau `tracks` est vide ou qu'aucun fichier n'est présent, le jeu joue
une musique d'ambiance procédurale en repli. Le rendu reste contrôlable via
le menu « Réglages » (musique on/off, volume).
