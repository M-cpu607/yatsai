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
| `seed.sql` | jeu d'essai, rejoué à chaque `reset` |
| `config.toml` | configuration des cinq services |

Le schéma reproduit : 21 tables, 196 colonnes, 97 contraintes, 70 index,
31 fonctions, 17 triggers, 62 policies RLS, 11 tables publiées en Realtime,
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
| Migration jouée instruction par instruction | 0 échec |
| Jeu d'essai joué | 0 échec |
| Tables / colonnes / contraintes vs production | 21 / 196 / 97 — identiques |
| Triggers / policies / tables sous RLS | 17 / 62 / 21 — identiques |
| Sports / buckets | 20 / 6 — identiques |
| Trigger d'inscription | 4 comptes → 4 profils créés |
| Compteurs dénormalisés | likes 2, abonnés 2, vidéos 2 — justes |
| Triggers de notification | 7 notifications produites |

Un bug a été trouvé et corrigé par ces tests : le jeu d'essai donnait à un
profil un niveau appartenant à l'énumération des *vidéos*. Les deux
énumérations `level` sont différentes et ne doivent pas être confondues :

- `profiles` : `amateur`, `young_pro`, `senior_amateur`, `senior_semi_pro`, `senior_pro`, `no_club`
- `videos` : `amateur`, `semi_pro`, `pro`, `entrainement`

**Ce qui n'a pas pu être vérifié ici :** le démarrage de la pile Docker
elle-même, l'environnement de développement utilisé n'ayant pas de daemon
Docker. Deux index trigram (`profiles_name_trgm_idx`,
`profiles_club_trgm_idx`) n'ont pas pu être créés non plus, PGlite
n'embarquant pas `pg_trgm` — l'extension est présente sur Supabase, et
c'est la seule raison de leur échec.

---

## Rester aligné sur la production

Ce schéma est un instantané du 15/09/2026. Quand la production évoluera,
récupérez les changements :

```bash
npx supabase link --project-ref uvsxteuhqqfgbmdgabfo
npx supabase db pull          # écrit une nouvelle migration
./scripts/db-local.sh reset   # la rejoue en local
```

Dans l'autre sens, une migration écrite et testée en local se pousse avec
`npx supabase db push`. **Testez toujours en local d'abord** : c'est
précisément ce que ce dossier vous permet.
