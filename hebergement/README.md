# Page relais du lecteur YouTube

`public/lecteur-youtube/index.html` est une page web statique que
l'application affiche dans une iframe pour lire les vidéos YouTube dans le
fil. Elle fait partie du site : Vite la copie dans le build, et Netlify —
relié au dépôt GitHub — la sert à
**https://preeminent-dasik-ba7091.netlify.app/lecteur-youtube/** à chaque
déploiement de `main`. Rien à faire à la main.

La racine du site (`https://preeminent-dasik-ba7091.netlify.app/`) affiche
l'application web entière ; la page relais n'est qu'une sous-page.

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

Ouvrir dans Safari : `https://preeminent-dasik-ba7091.netlify.app/lecteur-youtube/?v=dQw4w9WgXcQ`
— une vidéo doit se lancer (en sourdine). Chaque ouverture laisse aussi des
traces dans les journaux Supabase (ci-dessous).

## Diagnostic à distance

La page signale chacune de ses étapes à la fonction Edge `lecteur-youtube`
du projet : `page-chargee`, `api-chargee`, `pret`, `etat-<n>`,
`erreur-<code>`, `silence`, `api-injoignable`. Elles apparaissent dans les
journaux Supabase (*Edge Functions → lecteur-youtube → Logs*).

Enchaînement normal : `page-chargee → api-chargee → pret → etat-1`.

## Si l'adresse du site change

L'application pointe par défaut sur l'adresse Netlify ci-dessus ; si la
page n'y répond pas, son minuteur de secours rend l'iframe directe au bout
de 9 s. Si le site est renommé (Netlify → *Site configuration → Change
site name*) ou hébergé ailleurs, mettre à jour `RELAIS_YOUTUBE_PAR_DEFAUT`
dans `src/App.jsx`, ou ajouter à `.env` :

```
VITE_LECTEUR_YOUTUBE_URL=https://<autre-adresse>/
```

puis reconstruire : Vite lit `.env` au moment du build.
