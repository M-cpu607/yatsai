# Hébergement de la page relais du lecteur YouTube

`lecteur-youtube/` contient **une page web statique** qui doit être servie en
`https` depuis un vrai hébergeur. L'application l'affiche dans une iframe
pour lire les vidéos YouTube dans le fil.

## Pourquoi c'est nécessaire

Dans l'application iOS, la page tourne sous `capacitor://localhost`. Une
iframe YouTube posée là n'envoie aucun référent `http(s)`, et YouTube refuse
de jouer : **« erreur 153 »**. Servie depuis une adresse `https`, cette page
donne au lecteur le référent qui lui manque.

Elle ne peut pas vivre chez Supabase : fonctions Edge comme Storage
réécrivent tout HTML en `text/plain`, et le script ne s'exécute jamais.

## Mise en ligne — Netlify, gratuit, deux minutes

1. Créer un compte gratuit sur **netlify.com** (« Sign up with GitHub »).
2. Ouvrir **app.netlify.com/drop**.
3. Glisser-déposer **le dossier `lecteur-youtube`** (le dossier entier, pas
   le fichier) dans la zone.
4. Netlify donne une adresse du type `https://nom-au-hasard.netlify.app`.
   On peut la renommer : *Site configuration → Change site name*, par
   exemple `yatsai-lecteur` → `https://yatsai-lecteur.netlify.app`.

Vérification : `https://<adresse>/?v=dQw4w9WgXcQ` doit jouer une vidéo.

## Brancher l'application

Ajouter à `.env`, à la racine du projet :

```
VITE_LECTEUR_YOUTUBE_URL=https://yatsai-lecteur.netlify.app/
```

Puis reconstruire : `npm run mobile:ios`. Vite lit `.env` **au moment du
build**, pas à l'exécution.

Sans cette variable, l'application garde l'iframe directe d'avant — qui
marche sur le web, pas dans l'app iOS.

## Diagnostic à distance

La page signale chacune de ses étapes à la fonction Edge `lecteur-youtube`
du projet : `page-chargee`, `api-chargee`, `pret`, `etat-<n>`,
`erreur-<code>`, `silence`, `api-injoignable`. Elles apparaissent dans les
journaux Supabase (*Edge Functions → lecteur-youtube → Logs*).

Enchaînement normal : `page-chargee → api-chargee → pret → etat-1`.

## Toute modification de `index.html`

… doit être re-déposée sur Netlify (même glisser-déposer, sur la page
*Deploys* du site) : l'application pointe sur la version en ligne, pas sur
celle du dépôt.
