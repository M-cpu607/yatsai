# Backend Scolympia — notes d'architecture

Projet Supabase : `uvsxteuhqqfgbmdgabfo` (région `eu-north-1`, PostgreSQL 17.6).

Ce document décrit le travail de mise à l'échelle réalisé sur la base, et
ce qu'il reste à faire pour tenir une charge réelle.

---

## 1. Ce qui a été corrigé

Un audit de la base a remonté **120 problèmes de performance** et
**67 problèmes de sécurité**. Les causes racines :

### RLS — 54 policies réévaluées par ligne

Toutes les policies appelaient `auth.uid()` directement. Écrit ainsi,
PostgreSQL considère l'appel comme volatile et le réévalue **pour chaque
ligne examinée**. Enveloppé dans `(select auth.uid())`, il devient un
InitPlan calculé une seule fois par requête.

Sur une table de 100 000 lignes : 1 appel au lieu de 100 000.

### RLS — 31 policies permissives en doublon

Les policies s'étaient accumulées au fil des migrations, en version
française *et* anglaise de la même règle. `videos` portait **3 policies
SELECT identiques**. Les policies permissives sont combinées en `OR` et
PostgreSQL les évalue **toutes**, pour chaque ligne — donc 3× le travail
sur la requête la plus fréquente de l'application.

Résultat : une seule policy par couple (table, action), sémantique
d'accès inchangée.

### Compteurs dénormalisés

`videos` n'avait ni `likes_count` ni `comments_count`. Afficher 20 vidéos
imposait 40 `COUNT(*)`. Un `COUNT(*)` parcourt toutes les lignes
correspondantes : afficher « 50K likes » coûtait la lecture de 50 000
lignes.

Ajout de `videos.likes_count / comments_count / saves_count` et
`profiles.followers_count / following_count / videos_count`, maintenus par
triggers `SECURITY DEFINER` (nécessaire : celui qui like n'a pas le droit
d'écrire sur la vidéo d'autrui).

`reconcile_counters()` recalcule tout depuis la source de vérité en cas de
dérive — à brancher sur `pg_cron` en production.

### Intégrité référentielle des sports

`videos.sport` et `profiles.sport` étaient du texte libre. C'est ce qui a
permis au front de faire circuler un sport tantôt en slug (`'foot'`,
stocké en base) tantôt en libellé (`'Football'`, données de démonstration)
— au point que filtrer par sport masquait **toutes** les vraies vidéos.

Une table de référence `sports` (20 entrées, le slug fait autorité) et
deux clés étrangères rendent désormais la dérive impossible côté base,
indépendamment de ce que fait le client.

### 15 clés étrangères non indexées

Dont `videos.user_id`, utilisée par le feed *et* par chaque page de profil.

### Sécurité

- **50 fonctions `SECURITY DEFINER` appelables par `anon`** via
  `/rest/v1/rpc/<nom>`. Supabase accorde `EXECUTE` à `anon`/`authenticated`
  sur toute fonction du schéma `public` par défaut. `reconcile_counters()`
  exposée publiquement = déni de service à une requête. `EXECUTE` retiré
  sur toutes les fonctions de trigger et d'administration.
- **16 fonctions `SECURITY DEFINER` à `search_path` mutable** — vecteur
  d'élévation de privilèges. `search_path` figé sur toutes.

---

## 2. La pagination du feed

### Le bug initial

L'application chargeait **toutes** les vidéos à chaque ouverture :

```js
supabase.from('videos').select('*, profiles!...').order('created_at', ...)
// aucun LIMIT
```

### Le piège du curseur

La première version du RPC écrivait :

```sql
where (p_cursor is null or (v.created_at, v.id) < (p_cursor, p_cursor_id))
```

`p_cursor is null` porte sur un **paramètre**, non résoluble à la
planification. La comparaison de tuples se retrouve enfermée dans un `OR`
non résoluble et se voit rétrogradée d'`Index Cond` à simple filtre : le
parcours redevient linéaire.

Correction par sentinelle — la comparaison est toujours présente, donc
toujours utilisable comme condition d'index :

```sql
where (v.created_at, v.id) < (
  coalesce(p_cursor_created_at, 'infinity'::timestamptz),
  coalesce(p_cursor_id, 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid))
```

### Mesures (200 000 vidéos, instance free tier)

| Profondeur | `OR IS NULL` | Sentinelle |
|---|---|---|
| 1 000 | 2,28 ms | 0,78 ms |
| 20 000 | 6,43 ms | 0,90 ms |
| 100 000 | 27,89 ms | 0,78 ms |
| 190 000 | **50,91 ms** | **0,25 ms** |

Correction vérifiée : 5 pages consécutives → 100 lignes, 100 identifiants
uniques, ordre identique aux 100 vidéos les plus récentes.

### Note sur `SET search_path`

`get_feed` et `search_athletes` n'ont **volontairement** pas de
`SET search_path` : cette clause empêche PostgreSQL d'inliner une fonction
SQL (~×2,5 de surcoût mesuré). Sans risque ici — ces fonctions sont
`SECURITY INVOKER` (aucun privilège à détourner) et toutes leurs
références sont qualifiées par schéma. Les fonctions `SECURITY DEFINER`,
elles, gardent leur `SET`.

---

## 3. API

```js
// Feed paginé — vidéo + auteur + état du spectateur en un aller-retour
supabase.rpc('get_feed', {
  p_limit: 20,
  p_cursor_created_at: cursor?.created_at ?? null,
  p_cursor_id: cursor?.id ?? null,
  p_sport: null,
})

// Recherche d'athlètes (filtre d'âge traduit en intervalle de dates,
// donc indexable)
supabase.rpc('search_athletes', {
  p_query: 'dupont', p_sport: 'foot', p_gender: 'M',
  p_age_min: 16, p_age_max: 21,
})

// Vues groupées — 100 identifiants maximum par appel
supabase.rpc('increment_video_views_batch', { p_video_ids: [...] })
```

---

## 4. Capacité réelle — mesurée, pas estimée

**L'organisation est sur le plan `free`.** L'instance est un nano à
`max_connections = 60`.

L'objectif était formulé comme « 10 000 utilisateurs faisant une requête
chaque seconde », soit 10 000 req/s. Cette formulation surestime largement
la charge réelle : un utilisateur qui fait défiler charge 20 vidéos d'un
coup puis ne redemande rien pendant une trentaine de secondes, soit
**0,033 req/s** et non 1. 10 000 utilisateurs *simultanés* représentent
donc environ **300 req/s** (calcul détaillé au §5).

### Mesures

Relevé avec `loadtest/quick.mjs` depuis un poste en France, contre le
projet réel sur le plan gratuit.

| Concurrence | req/s | p50 | p95 | p99 | Erreurs |
|---|---|---|---|---|---|
| 1 | 12 | 75 ms | 151 ms | 237 ms | 0 % |
| 5 | 63 | 73 ms | 141 ms | 180 ms | 0 % |
| 10 | 139 | 70 ms | 82 ms | 137 ms | 0 % |
| 25 | 329 | 70 ms | 98 ms | 239 ms | 0 % |
| 50 | 656 | 72 ms | 94 ms | 153 ms | 0 % |
| 100 | **911** | 102 ms | 154 ms | 275 ms | **0 %** |

**Le p50 reste plat à ~70 ms de 1 à 50 connexions simultanées.** Le serveur
ne force pas : cette latence est le trajet réseau jusqu'à `eu-north-1`, pas
du travail de base. Le débit monte quasi linéairement, sans une seule
erreur. À 100 connexions le p50 passe à 102 ms — premier signe de
saturation, mais **le test s'est arrêté faute de paliers configurés, pas
parce que quelque chose a cédé. Le plafond n'a pas été atteint.**

> **Correction.** Une version antérieure de ce document estimait que le
> plan gratuit encaissait « de l'ordre de 1 à 2 % de 10 000 req/s », soit
> 100 à 200 req/s. La mesure donne **911 req/s sans erreur**, soit environ
> cinq fois plus. L'estimation était fausse ; ce sont les chiffres
> ci-dessus qui font foi.

À 0,033 req/s par personne, 911 req/s correspond à environ **27 000
utilisateurs actifs simultanés**.

### Réserves sur ces mesures

- La base ne contenait **qu'une vidéo** : chaque page pesait 0,6 Ko au lieu
  des 13,8 Ko d'un vrai feed. Ce test mesure donc le réseau et le surcoût
  PostgREST, pas le coût de la requête. Ce dernier a été mesuré séparément
  (0,25 ms sur 200 000 vidéos, §2) et n'est pas le facteur limitant.
- À 100 connexions, Node devient lui-même un facteur : les 911 req/s sont
  probablement **sous-estimés**. Au-delà, utiliser `loadtest/feed.k6.js`.
- Le plancher de ~70 ms dépend de la distance au datacenter.

### La vraie contrainte est la bande passante

Puisque le CPU tient, c'est l'egress qui devient le facteur limitant. Sur
la base de ~5 pages par session et 13,8 Ko la page :

| Actifs / jour | Egress / mois | Situation |
|---|---|---|
| 10 000 | ~21 Go | confortable |
| 100 000 | ~207 Go | atteint les 250 Go inclus au plan Pro |
| 1 000 000 | ~2 To | ~160 $/mois d'egress supplémentaire |

Ce qui déplace la première priorité : **alléger la charge utile avant
d'ajouter du compute**. `get_feed` renvoie aujourd'hui `description` et
plusieurs champs que la carte du feed n'affiche pas ; les retirer réduit
directement la facture.

### Ordre des actions

1. **Alléger la réponse de `get_feed`.** Levier direct sur le poste de
   coût qui saturera en premier.
2. **Rester sur le plan gratuit** tant que le p95 ne dérive pas. La marge
   est réelle et mesurée.
3. **Realtime uniquement sur la messagerie.** Le plan gratuit plafonne à
   200 connexions simultanées. Ne jamais abonner le feed en temps réel.
4. **Amplification d'écriture.** Chaque like déclenche 1 insert `likes` +
   1 update `videos.likes_count` + 1 insert `notifications`. À fort volume,
   les notifications devraient partir en file (`pgmq` est disponible)
   plutôt qu'en trigger synchrone.
5. **Contention sur les lignes chaudes.** Les compteurs par trigger
   sérialisent les écritures sur une même ligne. Correct jusqu'à quelques
   centaines d'écritures/seconde par vidéo ; au-delà, sharder le compteur.
6. **Cacher le feed en amont**, seulement si le trafic le justifie. Il est
   lisible sans session (policy `using (true)`), donc cacheable.

## 5. Grandir au-delà — les paliers suivants

### D'abord, l'arithmétique

Trois nombres qu'on confond systématiquement. Les distinguer change la
nature du problème :

```
inscrits
  × taux d'actifs quotidiens        (~15 %, ratio courant)
  × part du trafic à l'heure de pic (~15 % de la journée)
  × durée de session / 60 min       (~8 min)
  = utilisateurs simultanés au pic

simultanés × 0,033 req/s            (une page de 20 vidéos toutes les ~30 s)
  = requêtes par seconde
```

| Inscrits | Actifs / jour | Simultanés au pic | Req/s soutenues |
|---|---|---|---|
| 10 000 | 1 500 | ~30 | ~1 |
| 100 000 | 15 000 | ~300 | ~10 |
| 1 000 000 | 150 000 | ~3 000 | ~100 |
| 10 000 000 | 1 500 000 | ~30 000 | **~1 000** |

**10 millions d'inscrits, c'est de l'ordre de 1 000 req/s soutenues**, et
peut-être 5 000 en pic réel. Pas des millions.

À rapprocher du §4 : l'instance gratuite a tenu **911 req/s sans erreur**,
sans avoir atteint son plafond. Côté calcul, elle est donc déjà dans cet
ordre de grandeur. C'est l'**egress** qui bloquerait bien avant le CPU.

Pour situer : « des millions de requêtes par seconde » sur une API, aucune
application grand public ou presque ne le fait. Y arriver supposerait de
l'ordre du milliard d'utilisateurs, ou un usage radicalement différent de
celui-ci. Ces chiffres sont un modèle, pas une mesure — refaites-les avec
vos propres ratios dès que vous les connaîtrez.

### Ce qui casse, dans l'ordre

Chaque palier casse autre chose. On ne saute pas les étapes : l'architecture
est réécrite en chemin, et c'est normal.

| Palier | Ce qui casse | Ce qu'on fait |
|---|---|---|
| **~10 req/s** | rien | Plan Pro, pooler activé. C'est la prochaine étape. |
| **~100 req/s** | Postgres seul en lecture | Réplicas de lecture, cache devant le feed. Le Realtime devient un poste de coût : le limiter à la messagerie. |
| **~1 000 req/s** | le feed calculé à la demande | Feed **pré-calculé** et poussé dans un cache. Compteurs par trigger passés en file (`pgmq`). C'est aussi le moment où le Postgres managé cesse d'être rentable face à de l'infrastructure gérée soi-même. |
| **au-delà** | l'organisation, pas la technique | Partitionnement, multi-région, équipes dédiées. Cela ne se prépare pas à l'avance : on recrute les gens qui le feront. |

### La meilleure décision d'architecture est déjà prise

**Les vidéos sont sur YouTube.**

Stocker et diffuser de la vidéo est la partie la plus chère et la plus
difficile d'une application comme celle-ci — et la seule dont le coût
explose vraiment avec le nombre d'utilisateurs. En la déléguant, cette
partie passe à l'échelle gratuitement, sans rien faire. La base ne
transporte que du texte et des identifiants.

C'est pour cette raison que 10 millions d'inscrits coûteraient ici bien
moins cher qu'à une plateforme qui héberge ses médias. Ne pas revenir
là-dessus sans une raison très solide.

### Les signaux qui déclenchent le palier suivant

Plutôt que de deviner, surveiller :

- **Latence p95 qui monte à trafic constant** → la base sature, ajouter du compute.
- **Connexions en attente** → activer le pooler.
- **Les écritures ralentissent les lectures** → sortir les notifications du chemin synchrone.
- **La même requête revient des milliers de fois par seconde** → c'est là qu'un cache devient rentable, et pas avant.

### Ne rien construire de tout cela maintenant

La quasi-totalité des applications meurent à 100 utilisateurs, pas à
10 millions. Bâtir aujourd'hui pour 10 millions ajoute de la complexité,
des pannes et des coûts, précisément pendant la phase où il faut aller vite.

Ce qui a été fait suffit largement pour les 10 000 premiers utilisateurs.
Et surtout : **rien de ce qui a été fait ne devra être défait pour aller
plus loin.** Compteurs dénormalisés, pagination par curseur, RLS propre —
c'est le socle commun de tous les paliers suivants.

## 6. Outils fournis

| Dossier | Rôle |
|---|---|
| `e2e/` | Test de fumée navigateur contre un faux Supabase local — vérifie que l'app tourne sans consommer de quota ni toucher à la base |
| `loadtest/` | Test de charge du feed, pour mesurer la capacité réelle plutôt que l'estimer |
| `docs/` | Simulation comparant les stratégies de classement du feed, et la décision qui en découle |

## 7. Versionner les migrations

Les changements de schéma vivent aujourd'hui uniquement dans l'historique
Supabase (60 migrations, dont 8 issues de ce travail). Ils ne sont pas dans
le dépôt. Pour les y ramener, avec la CLI Supabase :

```bash
npx supabase link --project-ref uvsxteuhqqfgbmdgabfo
npx supabase db pull          # écrit supabase/migrations/*.sql
git add supabase/ && git commit -m "Versionne les migrations de schéma"
```

Passer par `db pull` plutôt que par des fichiers écrits à la main garantit
que le contenu correspond exactement à ce qui est réellement appliqué —
y compris les 52 migrations antérieures à ce travail.

## 8. Points en suspens

- **Chaîne complète confirmée en conditions réelles.** Le transport HTTP
  n'avait pas pu être testé depuis l'environnement de développement (la
  politique d'egress y bloque `*.supabase.co`). Il l'a été depuis un poste
  réel : la requête de contrôle du test de charge appelle `get_feed` en
  HTTPS sur le vrai projet et reçoit une réponse valide, puis 911 req/s
  sans erreur. Les trois couches sont donc vérifiées :
  - **Base** : autorisation validée en endossant les rôles `anon` et
    `authenticated` avec de vraies revendications JWT — droits, RLS et
    `auth.uid()` à travers le RPC (7/7).
  - **Application** : test de fumée navigateur contre un faux backend
    local (`e2e/`), de la connexion au défilement infini (8/8).
  - **Transport** : `get_feed` appelé en HTTPS sur le projet réel (§4).

- **Le dépôt porte deux historiques sans ancêtre commun.** La branche de
  ce travail (`claude/build-application-YkNgl`, racine `32eb53e`) et
  `main` (racine `6005845`, ~50 commits) n'ont **aucune base commune** :
  `git merge-base` ne renvoie rien.

  Conséquences :
  - Le travail sur la **base de données est intact et valide** — les
    migrations ont été appliquées directement sur le projet Supabase, qui
    est indépendant de Git.
  - Les **outils** (`loadtest/`, `e2e/`, `docs/`, ce fichier) sont des
    fichiers autonomes, récupérables avec
    `git checkout origin/claude/build-application-YkNgl -- <dossier>`.
  - En revanche les modifications de **`src/App.jsx` de cette branche sont
    à écarter** : elles ont été faites sur une version du fichier qui n'est
    pas celle de `main`. Le branchement sur `get_feed` et la normalisation
    des sports (§1) restent **à refaire sur le vrai `App.jsx`**.
  - La PR ouverte n'est pas fusionnable telle quelle.

- **`profiles` porte à la fois `age` et `birthdate`.** `age` devient faux
  au premier anniversaire (d'où la colonne `age_last_reminded_at` et son
  système de rappel). Les RPC calculent désormais l'âge depuis
  `birthdate` ; `age` ne sert plus que de repli et devrait être retiré une
  fois les profils complétés.
- **20 index signalés « inutilisés »** par le linter Supabase. Ce verdict
  s'appuie sur des statistiques d'usage encore vides — ils ont été
  conservés volontairement.
- **Protection des mots de passe compromis désactivée** (vérification
  HaveIBeenPwned). C'est un réglage de la console Auth, pas du schéma :
  Authentication → Policies → « Leaked password protection ».
- **Le test de rejet de la clé étrangère `sports` n'a pas pu être
  exécuté** (instabilité du connecteur Supabase). La contrainte est en
  place et validée contre les données existantes — un `ADD CONSTRAINT`
  échoue si une ligne la viole — mais l'essai d'écriture d'une valeur
  invalide reste à faire.
