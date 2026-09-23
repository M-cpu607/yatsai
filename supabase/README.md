# Base Scolympia en local

Ce dossier fait tourner **sur votre machine** une copie exacte de la base
de production, avec toutes les données stockées chez vous.

---

## D'abord, un point à comprendre

Vous avez demandé « une base de données dans un fichier, connectée au
backend ». Il n'existe pas de backend séparé à connecter : **l'application
parle directement à cinq services**, relevé fait sur le vrai code.

| Service | Ce qu'il sert | Appels dans l'app |
|---|---|---|
| **PostgREST** | l'API REST (`.from()`) | 80 |
| **Realtime** | les websockets | 21 canaux, 30 abonnements |
| **GoTrue** | l'authentification | 10 |
| **Storage** | les fichiers | 9, sur 6 buckets |
| **PostgreSQL** | la base elle-même | — |

Un fichier de base seul ne peut rien servir de tout ça : il n'a pas d'API,
pas de JWT, pas de websockets, pas de stockage de fichiers.

Ce que ce dossier installe, c'est **la pile complète en local** — les cinq
services sur votre Mac. Les données vivent chez vous, et la commande
`dump` les exporte quand vous voulez dans un fichier `.sql` unique.

---

## Démarrer

Il faut **Docker Desktop** installé et lancé ([docker.com](https://www.docker.com/products/docker-desktop)).

```bash
./scripts/db-local.sh start
npm run dev
```

Le premier démarrage télécharge environ 2 Go d'images et prend quelques
minutes. Les suivants démarrent en quelques secondes.

| Commande | Effet |
|---|---|
| `./scripts/db-local.sh start` | démarre la pile et bascule l'app en local |
| `./scripts/db-local.sh stop` | arrête et rebascule sur le cloud |
| `./scripts/db-local.sh reset` | remet la base à zéro (schéma + jeu d'essai) |
| `./scripts/db-local.sh status` | indique où pointe l'application |
| `./scripts/db-local.sh dump` | exporte la base dans `supabase/dumps/*.sql` |

### Comment se fait la bascule

Votre `.env` continue de pointer sur la production. Le script crée un
`.env.local`, auquel Vite donne la priorité. Tant qu'il existe,
l'application parle à votre machine ; `stop` le supprime et tout revient
comme avant. Rien n'est écrasé, aucune modification de code.

**Relancez `npm run dev` après chaque bascule** — Vite ne relit sa
configuration qu'au démarrage.

### Une fois démarré

| | |
|---|---|
| Application | http://localhost:5173 |
| Studio (voir et modifier les données) | http://127.0.0.1:54323 |
| **Boîte mail locale** | http://127.0.0.1:54324 |
| Postgres direct | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

La boîte mail locale mérite votre attention : **tous les e-mails de l'app y
arrivent, sans limite de débit et sans jamais partir sur Internet**. C'est
là que vous pourrez construire et tester « mot de passe oublié » sans
brancher de service d'envoi.

### Comptes d'essai

Mot de passe commun : `scolympia`

| Compte | Rôle |
|---|---|
| `kylian@scolympia.local` | athlète, 2 vidéos |
| `aminata@scolympia.local` | athlète, 1 vidéo |
| `marc@scolympia.local` | recruteur |
| `admin@scolympia.local` | administrateur |

---

## Ce que ça ne fait pas

**Cette base ne peut pas héberger votre lancement.** Elle écoute sur
`127.0.0.1`, une adresse qui ne désigne que votre propre machine. Vos
utilisateurs ne peuvent pas l'atteindre, quel que soit le réglage — et si
votre Mac est éteint ou en veille, il n'y a rien à joindre.

Pour des utilisateurs réels, il faut un serveur accessible depuis
Internet : le projet Supabase hébergé reste la réponse.

En résumé :

| | Local | Cloud |
|---|---|---|
| Développer, tester, casser sans risque | **oui** | déconseillé |
| Travailler sans consommer votre quota | **oui** | non |
| Travailler hors connexion | **oui** | non |
| Tester les e-mails sans limite | **oui** | 2/heure |
| Servir de vrais utilisateurs | **non** | oui |

---

## Contenu

| Fichier | Rôle |
|---|---|
| `migrations/20260915090000_schema_complet.sql` | le schéma, extrait du projet distant |
| `migrations/20260915095519_11_referentiels_position_categorie_saison.sql` | postes, catégories d'âge, saisons |
| `migrations/20260915100601_12_niveau_adversaire_et_numero_maillot.sql` | niveaux de compétition, numéro de maillot |
| `migrations/20260915111404_videos_libelles_derives_referentiels.sql` | recopie des libellés sur les vidéos |
| `migrations/20260917075359_videos_numero_maillot_selon_sport.sql` | garde sur le numéro de maillot |
| `migrations/20260917075436_videos_sync_labels_retrait_garde_maillot_redondante.sql` | retrait de cette garde, redondante |
| `migrations/20260917080212_profiles_libelle_poste_derive.sql` | recopie du libellé de poste sur les profils |
| `migrations/20260917080357_handle_new_user_lit_position_id.sql` | l'inscription lit `position_id` |
| `migrations/20260917080959_recherche_athletes_etendue_aux_videos.sql` | recherche d'athlètes étendue au texte des vidéos |
| `migrations/20260917082343_profils_masquage_age_et_localisation.sql` | `city`/`region`/`country`/`age` deviennent des colonnes générées, masquées selon `hide_location` / `hide_age` |
| `migrations/20260917082547_profils_rls_prive_et_droits_par_colonne.sql` | RLS sur les profils privés, droits de lecture rendus colonne par colonne, `get_my_profile()` |
| `migrations/20260917082606_get_feed_age_affiche_sans_birthdate.sql` | `get_feed` lit `age` au lieu de recalculer depuis `birthdate` |
| `migrations/20260917085629_compte_prive_vidéos_reservees_aux_abonnes.sql` | `videos.author_is_private` et RLS : les vidéos d'un compte privé ne sortent plus, son profil s'ouvre à ses abonnés |
| `migrations/20260917085804_get_feed_colonnes_completes_de_la_carte.sql` | `get_feed` rend toutes les colonnes que la carte du fil utilise, pas treize |
| `migrations/20260917172228_compteur_partages_et_get_feed_complet.sql` | `videos.shares_count`, quatrième compteur dénormalisé, et `get_feed` qui le rend |
| `migrations/20260918082218_search_athletes_absorbe_tous_les_filtres.sql` | localisation, nationalité, niveaux et poste appliqués avant le `limit` |
| `migrations/20260918082352_search_athletes_recherche_generale.sql` | `p_include_recruiters`, plus `organization`, `is_recruiter` et `role` au retour |
| `seed.sql` | jeu d'essai, rejoué à chaque `reset` |
| `config.toml` | configuration des cinq services |

Les deux migrations sur le numéro de maillot se contredisent, et c'est
voulu : la garde ajoutée s'est révélée inatteignable — le trigger
`trg_check_jersey_number` s'exécute avant et lève déjà une erreur. Rejouer
l'historique tel quel est ce qui garantit d'obtenir le schéma hébergé.

**Deux points à connaître avant d'écrire du code sur `profiles`.** Depuis
les migrations du 17/09 :

- `city`, `region`, `country` et `age` sont des colonnes **générées** :
  PostgreSQL refuse qu'on y écrive. La valeur se saisit dans
  `city_private`, `region_private`, `country_private`, `age_private` ; la
  colonne publique en est la copie, remplacée par `null` quand
  `hide_location` ou `hide_age` est coché. La lecture, elle, ne change
  pas.
- `select('*')` sur `profiles` est **refusé** (`permission denied for
  table profiles`). Le droit de lecture a été retiré à `anon` et
  `authenticated` puis rendu colonne par colonne : 37 colonnes sur 48
  sont lisibles. Il faut donc énumérer les colonnes. Pour relire son
  propre profil en entier, y compris `birthdate` et `phone`, il y a
  `get_my_profile()`.

**Et deux points sur `videos`.** Depuis les migrations du 17/09 au soir :

- `author_is_private` recopie le `is_private` de l'auteur, et
  `shares_count` compte les partages. Comme `likes_count`,
  `comments_count` et `saves_count`, ce sont des colonnes **maintenues
  par trigger** : on ne les écrit pas à la main. `author_is_private`
  existe parce qu'une policy RLS qui irait lire `profiles.is_private`
  serait filtrée par la RLS de `profiles` et conclurait l'inverse de ce
  qu'elle cherche.
- `get_feed()` rend désormais **48 colonnes** — 36 de la vidéo, 10 de
  l'auteur, 2 sur l'appelant (`viewer_liked`, `viewer_saved`). L'instantané
  du 15/09 en rendait 23, dont 13 seulement de la vidéo : pas de
  `video_url`, pas de `tracking_points`, pas de `video_type`, pas de
  `user_id` — de quoi ne pas afficher une carte de fil.

Le schéma reproduit : 25 tables, 230 colonnes, 109 contraintes, 84 index,
38 fonctions, 23 triggers, 66 policies RLS, 11 tables publiées en Realtime,
6 buckets de stockage.

La confirmation par e-mail est **désactivée**, comme en production : le
code d'`Auth.jsx` attend une session immédiatement après l'inscription et
resterait bloqué si la confirmation était exigée.

---

## Vérifications effectuées

Le schéma et le jeu d'essai ont été **réellement exécutés** dans PostgreSQL
(PGlite) avant livraison, pas seulement relus.

| Contrôle | Résultat |
|---|---|
| Migrations jouées instruction par instruction | 439 instructions, 8 échecs — tous imputables à `pg_trgm` et `unaccent`, absentes de PGlite (détail plus bas) |
| Jeu d'essai joué | 0 échec |
| Tables / colonnes / contraintes vs production | 25 / 230 / 109 — identiques |
| Triggers / policies / tables sous RLS | 23 / 66 / 25 — identiques |
| Fonctions / index vs production | 37 / 81 contre 38 / 84 — l'écart est entièrement dû à `unaccent` et `pg_trgm` (ci-dessous) |
| Sports / buckets | 20 / 6 — identiques |
| Référentiels chargés | 120 postes, 15 catégories d'âge, 20 saisons, 10 niveaux |
| Recopie des libellés (vidéo, profil) | libellé juste, poste d'un autre sport refusé |
| Numéro de maillot | refusé hors sport à maillot, et au-delà de 99 |
| Trigger d'inscription | 4 comptes → 4 profils créés |
| Compteurs dénormalisés | likes 2, abonnés 2, vidéos 2 — justes |
| Triggers de notification | 7 notifications produites |
| Colonnes générées de `profiles` | `city`, `region`, `country`, `age` — les 4 attendues |
| Masquage | `hide_location` + `hide_age` cochés → `city` et `age` passent à `null`, les colonnes `_private` gardent la valeur |
| Écriture directe dans `city` | refusée (`column "city" can only be updated to DEFAULT`) |
| Colonnes de `profiles` lisibles par `anon` / `authenticated` | 37 / 37 — identique à la production ; `birthdate`, `phone`, `level_proof_url`, `is_admin`, les `_private` et les 3 colonnes d'état interne : 0 droit |
| `select *` sur `profiles` en tant qu'`anon` | refusé ; l'énumération des colonnes publiques passe |
| Règle `profiles_select` | privé visible du propriétaire, d'un administrateur et — depuis le 17/09 au soir — de ses abonnés |
| `search_athletes` | `SECURITY DEFINER`, `search_path` vide, exclusion des profils privés présente |
| `get_feed` après substitution | ne référence plus `birthdate`, lit `p.age` |
| Recopie de `author_is_private` | profil passé en privé → la vidéo suit ; repassé en public → elle redescend ; la vidéo d'un autre auteur n'est pas touchée |
| Vidéos d'un compte privé | inconnu : 1 vidéo sur 2 ; abonné : 2 ; propriétaire : 2 |
| Profil d'un compte privé | invisible de l'inconnu, **visible de son abonné** |
| `shares_count` | 0 → 2 partages → suppression d'un partage → 1 |
| `get_feed` | 48 colonnes, dont `video_url`, `tracking_points`, `video_type`, `shares_count`, `author_level`, `author_is_recruiter` |
| `search_athletes` étendue | 14 paramètres ; filtre ville, filtre niveau et `p_include_recruiters` appliqués **avant** le `limit` ; `organization`, `is_recruiter` et `role` au retour |

Un bug a été trouvé et corrigé par ces tests : le jeu d'essai donnait à un
profil un niveau appartenant à l'énumération des *vidéos*. Les deux
énumérations `level` sont différentes et ne doivent pas être confondues :

- `profiles` : `amateur`, `young_pro`, `senior_amateur`, `senior_semi_pro`, `senior_pro`, `no_club`
- `videos` : `amateur`, `semi_pro`, `pro`, `entrainement`

**Ce qui n'a pas pu être vérifié ici :** le démarrage de la pile Docker
elle-même, l'environnement de développement utilisé n'ayant pas de daemon
Docker. Trois index trigram (`profiles_name_trgm_idx`,
`profiles_club_trgm_idx`, `videos_text_trgm_idx`) n'ont pas pu être créés
non plus, PGlite n'embarquant pas `pg_trgm` — l'extension est présente sur
Supabase, et c'est la seule raison de leur échec.

`unaccent` manque pour la même raison, et c'est elle qui explique le reste
de l'écart : `immutable_unaccent` ne peut pas être créée, donc
`public.search_key()` non plus, donc aucune des fonctions de recherche qui
s'appuient dessus. Sur les **17 fichiers, 439 instructions** rejoués, les
**8 échecs** se répartissent ainsi : 2 `create extension`, 2 fonctions
dépendant d'`unaccent`, 3 index trigram et le `comment` posé sur l'un
d'eux. En substituant à `search_key()` un équivalent sans `unaccent`, les
439 instructions passent moins ces 8 — dont **0 dans les cinq migrations
du 17 au 18/09**. Aucun défaut du schéma n'est en cause.

Le décompte des contraintes demande une précaution : PGlite tourne sur
PostgreSQL 18, qui inscrit les contraintes `NOT NULL` dans
`pg_constraint`, ce que PostgreSQL 17.6 — la version du projet hébergé —
ne fait pas. Compté à l'identique des deux côtés (`contype <> 'n'`), le
total est bien de 109 de part et d'autre ; compté naïvement, PGlite en
annonce 221.

---

## Rester aligné sur la production

La pile locale est **à jour** : les seize migrations appliquées sur le projet
hébergé depuis l'instantané ont été écrites dans `migrations/`, jusqu'à
`20260918082352_search_athletes_recherche_generale` incluse. Un `reset` reproduit
le schéma hébergé.

L'instantané lui-même date du 15/09/2026. Quand la production évoluera,
récupérez les changements :

```bash
npx supabase link --project-ref uvsxteuhqqfgbmdgabfo
npx supabase db pull          # écrit une nouvelle migration
./scripts/db-local.sh reset   # la rejoue en local
```

Dans l'autre sens, une migration écrite et testée en local se pousse avec
`npx supabase db push`. **Testez toujours en local d'abord** : c'est
précisément ce que ce dossier vous permet.

---

## Fonctions Edge

| Fonction | JWT | Rôle |
|---|---|---|
| `scout-chatbot` | exigé | assistant de recrutement |
| `delete-account` | exigé | suppression de compte |
| `lecteur-youtube` | **non exigé** | collecteur des balises du lecteur YouTube |

### `lecteur-youtube`

**Collecteur de balises**, rien d'autre. La page relais du lecteur YouTube
fait partie du site, servie par Vercel (`public/lecteur-youtube/`, voir
`hebergement/README.md`) et signale ici chacune
de ses étapes — `page-chargee`, `api-chargee`, `pret`, `etat-<n>`,
`erreur-<code>`… — par `?v=<id>&journal=<étape>`. La fonction répond 204 ;
l'intérêt est que chaque appel apparaît dans les journaux du projet, ce qui
permet de voir à distance ce qui se passe dans la WebView d'un téléphone.

Elle a d'abord servi la page elle-même, et c'était une impasse : **Supabase
réécrit en `text/plain` tout HTML servi par une fonction Edge** (et son
Storage fait de même). La page arrivait bien — 200 dans les journaux — mais
son script ne s'exécutait jamais. C'est l'absence totale de balises qui l'a
montré.

Sans JWT, parce que `navigator.sendBeacon` ne peut pas porter d'en-tête
`Authorization`. En contrepartie elle ne lit ni n'écrit aucune donnée et ne
renvoie jamais de contenu.

```bash
npx supabase functions deploy lecteur-youtube --no-verify-jwt
```

Le faux backend d'`e2e/` sert la vraie page sous `/lecteur-reel/` et un
relais d'essai sous `/lecteur/`, où `ESSAI_LECTEUR=pret|noir|refus|muet|absent`
force chacun des scénarios sans dépendre du réseau.
