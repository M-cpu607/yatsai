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

Le schéma reproduit : 25 tables, 228 colonnes, 109 contraintes, 83 index,
35 fonctions, 20 triggers, 66 policies RLS, 11 tables publiées en Realtime,
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
| Migrations jouées instruction par instruction | 0 échec |
| Jeu d'essai joué | 0 échec |
| Tables / colonnes / contraintes vs production | 25 / 228 / 109 — identiques |
| Triggers / policies / tables sous RLS | 20 / 66 / 25 — identiques |
| Fonctions / index vs production | 35 / 83 — identiques, aux 3 index trigram près (ci-dessous) |
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
| Règle `profiles_select` | privé visible du seul propriétaire ou d'un administrateur |
| `search_athletes` | `SECURITY DEFINER`, `search_path` vide, exclusion des profils privés présente |
| `get_feed` après substitution | ne référence plus `birthdate`, lit `p.age` |

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

---

## Rester aligné sur la production

La pile locale est **à jour** : les onze migrations appliquées sur le projet
hébergé depuis l'instantané ont été écrites dans `migrations/`, jusqu'à
`20260917082606_get_feed_age_affiche_sans_birthdate` incluse. Un `reset` reproduit
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
