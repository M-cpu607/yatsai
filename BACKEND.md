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

## 4. Objectif 10 000 utilisateurs simultanés — état réel

**L'organisation est sur le plan `free`.** L'instance est un nano à
`max_connections = 60`. 10 000 utilisateurs à 1 requête/seconde = 10 000
requêtes/seconde ; le plan gratuit en encaisse de l'ordre de 1 à 2 %.

Le schéma est maintenant *prêt* pour cette charge — c'est un préalable
nécessaire, pas suffisant. Ce qui reste à faire, par ordre d'impact :

1. **Ne pas faire arriver ces 10 000 req/s jusqu'à Postgres.** Le feed est
   ~90 % du trafic et quasi identique pour tout le monde. Il est lisible
   sans session (policy `using (true)`), donc cacheable en amont — une
   requête peut servir des milliers d'utilisateurs.
2. **Passer au plan Pro** puis dimensionner le compute. Le pooler
   (Supavisor) devient indispensable au-delà de quelques centaines de
   connexions.
3. **Realtime uniquement sur la messagerie.** Le plan gratuit plafonne à
   200 connexions simultanées. Ne jamais abonner le feed en temps réel.
4. **Attention à l'amplification d'écriture.** Chaque like déclenche
   aujourd'hui : 1 insert `likes` + 1 update `videos.likes_count` +
   1 insert `notifications`. À fort volume, les notifications devraient
   partir en file (`pgmq` est disponible) plutôt qu'en trigger synchrone.
5. **Contention sur les lignes chaudes.** Les compteurs par trigger
   sérialisent les écritures sur une même ligne. Correct jusqu'à quelques
   centaines d'écritures/seconde par vidéo ; au-delà, il faut sharder le
   compteur.

## 5. Versionner les migrations

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

## 6. Points en suspens

- **Le chemin REST n'a pas pu être testé** depuis l'environnement de
  développement : la politique d'egress y bloque `*.supabase.co` (403 sur
  le tunnel CONNECT). Contournement explicitement déconseillé par la
  documentation du proxy.
  L'autorisation a en revanche été validée en endossant les rôles
  `anon` et `authenticated` avec de vraies revendications JWT — ce qui
  couvre les droits, la RLS et `auth.uid()`. Seul le transport HTTP reste
  à confirmer depuis le navigateur.
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
