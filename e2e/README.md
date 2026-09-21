# Test de fumée navigateur

Vérifie que l'application tourne réellement — de l'écran de connexion
jusqu'au défilement du feed — **sans toucher au vrai Supabase**.

Utile pour deux choses :

- valider une modification du feed sans consommer votre quota de bande
  passante ni polluer la base ;
- travailler sur l'interface quand le projet Supabase est en pause, ou
  depuis un réseau qui bloque `*.supabase.co`.

## Lancer

```bash
npm i -D playwright && npx playwright install chromium   # une seule fois

node e2e/fake-supabase.mjs &                             # faux backend, port 8901
printf 'VITE_SUPABASE_URL=http://127.0.0.1:8901\nVITE_SUPABASE_ANON_KEY=faux\n' > .env.local
npm run build && npx vite preview --port 4173 &
node e2e/smoke.mjs
rm .env.local                                            # revenir au vrai backend
```

`CHROME_PATH` permet de désigner un Chromium déjà installé,
`SHOT_DIR` le dossier où déposer les captures.

## Ce qui est vérifié

1. La page d'accueil, puis l'écran de connexion, s'affichent.
2. Le lien « mot de passe oublié » mène bien à l'écran de réinitialisation.
3. La connexion fait basculer sur le feed, sans état vide à tort.
4. `author_name` s'affiche — le champ **à plat** renvoyé par `get_feed`,
   là où l'ancien code lisait un objet imbriqué `profiles.full_name`.
5. La carte montre le niveau de l'adversaire et la date du match, et **pas**
   la saison : la date la contient déjà.
6. La première page est bien limitée à 20 cartes, et le défilement infini
   charge la suivante (20 → 60), ce qui valide la pagination par curseur
   de bout en bout.
7. Le formulaire de publication ouvre avec le bloc « Le contexte » replié,
   et son ouverture révèle les cinq listes alimentées par les référentiels :
   postes restreints au sport choisi, saisons avec la courante en tête.
8. La recherche rend des résultats et annonce un nombre « affichés », pas
   « trouvés » — la liste est paginée.
9. Aucune requête applicative en échec.
10. Aucune erreur JavaScript.

Les échecs réseau vers `img.youtube.com` et Google Fonts sont comptés à
part : ce sont des hôtes externes, et ils échouent normalement derrière
un proxy restrictif sans que l'application soit en cause.

## Le faux backend

`fake-supabase.mjs` implémente le strict nécessaire :

| Route | Rôle |
|---|---|
| `POST /auth/v1/token` · `/signup` | renvoie une session valide, quel que soit le mot de passe |
| `GET /auth/v1/user` | l'utilisateur de cette session |
| `POST /rest/v1/rpc/get_feed` | 60 vidéos, **pagination par curseur incluse** |
| `GET /rest/v1/profiles` | un profil d'athlète complet |

Le curseur est réellement honoré (`p_cursor_id` positionne le départ) —
sans quoi le test de défilement infini ne prouverait rien.
