# Page relais du lecteur YouTube

`public/lecteur-youtube/index.html` est une page web statique que
l'application affiche dans une iframe pour lire les vidéos YouTube dans le
fil. Elle fait partie du site : Vite la copie dans le build, et Vercel la
sert à **https://scolympia.vercel.app/lecteur-youtube/** à chaque
déploiement de `main`. Rien à faire à la main.

## Pourquoi elle existe

Dans l'application iOS, la page tourne sous `capacitor://localhost`. YouTube
exige que la page qui intègre son lecteur s'identifie par une adresse
`https` ; faute de quoi il répond **« erreur 153 — configuration du lecteur
vidéo »**. Le code de l'application n'avait pas changé quand l'erreur est
apparue : c'est YouTube qui a durci la règle. Servie en `https`, cette page
fournit l'identification qui manque.

Elle ne peut pas vivre chez Supabase : fonctions Edge comme Storage
réécrivent tout HTML en `text/plain`, et le script ne s'exécute jamais.

## Vérifier qu'elle est en ligne

Ouvrir dans Safari : `https://scolympia.vercel.app/lecteur-youtube/?v=dQw4w9WgXcQ`
— une vidéo doit se lancer (en sourdine). Chaque ouverture laisse aussi des
traces dans les journaux Supabase (ci-dessous).

## Diagnostic à distance

La page signale chacune de ses étapes à la fonction Edge `lecteur-youtube`
du projet : `page-chargee`, `api-chargee`, `pret`, `etat-<n>`,
`erreur-<code>`, `silence`, `api-injoignable`. Elles apparaissent dans les
journaux Supabase (*Edge Functions → lecteur-youtube → Logs*).

Enchaînement normal : `page-chargee → api-chargee → pret → etat-1`.

## Si Vercel ne sert plus le site

L'application pointe par défaut sur l'adresse Vercel ; si la page n'y
répond pas, son minuteur de secours rend l'iframe directe au bout de 9 s.
Pour héberger la page ailleurs — Netlify par exemple (compte gratuit,
glisser-déposer du dossier `public/lecteur-youtube` sur
app.netlify.com/drop) — ajouter à `.env` :

```
VITE_LECTEUR_YOUTUBE_URL=https://<autre-adresse>/
```

puis reconstruire : Vite lit `.env` au moment du build.
