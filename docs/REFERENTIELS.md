# Référentiels : postes, catégories d'âge, saisons

Trois dimensions qui étaient (ou allaient être) du texte libre sont
désormais des tables de référence.

## Pourquoi

Un filtre promet l'exhaustivité : « montre-moi les attaquants » doit
renvoyer **tous** les attaquants.

Sur du texte libre, les athlètes écrivent `Attaquant`, `attaquant`,
`Avant-centre`, `AC`, `Buteur`, `n°9`, `attaquat`. Le filtre en trouve une
fraction — et affiche trois résultats avec l'air d'avoir bien travaillé.
**Il ne signale jamais ce qu'il a raté.**

C'est le défaut déjà corrigé sur `sport`, où le filtre comparait un
libellé à un slug et masquait silencieusement toutes les vraies vidéos.

## Les tables

| Table | Contenu |
|---|---|
| `positions` | **120 postes**, les 20 sports couverts |
| `age_categories` | 15 catégories, de U10 à Vétéran |
| `seasons` | 20 saisons, 2015-2016 → 2034-2035 |

### `positions` — clé composite

La clé primaire est `(sport_id, id)`, pas `id` seul. Un même identifiant
existe dans plusieurs sports avec un sens différent : `pivot` est un poste
au handball et au basket, `gardien` au football, au handball et au hockey.

La clé étrangère sur `videos` et `profiles` porte donc sur le **couple** :

```sql
foreign key (sport, position_id) references positions(sport_id, id)
```

Conséquence vérifiée : attribuer un poste de basket à une vidéo de tennis
est **refusé par la base**, indépendamment de ce que fait le client.

### `age_categories` — la compétition, pas la personne

Décrit le niveau d'âge de la **compétition filmée** (U15, Senior…), pas
l'âge de l'athlète.

L'âge de l'athlète reste calculé depuis `profiles.birthdate` : un âge
stocké devient faux au premier anniversaire — c'est précisément la raison
d'être de la colonne `age_last_reminded_at`.

Démarre à U10. Rien en dessous, conformément à la décision produit.

### `seasons`

Saison sportive de septembre à août, identifiant `2025-2026`. Générée
jusqu'à 2034-2035 ; au-delà, une ligne à ajouter.

## Colonnes ajoutées

Sur `videos` : `position_id`, `age_category_id`, `season_id`, `match_date`.
Sur `profiles` : `position_id`.

Ce sont des colonnes **neuves**. Les anciennes colonnes texte
(`videos.position`, `videos.age_category`, `videos.championship`,
`profiles.position`) sont conservées le temps que le front bascule, et
pourront être supprimées ensuite.

`match_date` vaut d'être distingué de `created_at` : un recruteur veut
savoir quand l'action a été **jouée**, pas quand la vidéo a été publiée.

## Ce qui reste en texte libre, volontairement

**`championship`.** Les championnats dépendent du sport, de la catégorie
d'âge et du pays — des milliers de combinaisons, impossibles à figer
correctement sans se tromper. Le laisser libre est le bon choix pour
l'instant. Il deviendra une table le jour où les données réelles montreront
les valeurs qui reviennent.

**`description`.** C'est du texte de présentation, pas un critère. Il doit
alimenter la **recherche libre** (pertinence), jamais les **filtres**
(exhaustivité). Les deux sont complémentaires :

| | Filtres | Recherche libre |
|---|---|---|
| Promesse | exhaustif | pertinent |
| Répond à | « attaquants U19 en Bretagne » | « coup franc » |
| Source | champs structurés | titres, descriptions |

## Vérifications

Cinq contrôles joués sur la base réelle, dans une transaction annulée :

| Test | Résultat |
|---|---|
| Poste de basket sur une vidéo de tennis | refusé par la FK |
| Poste de tennis sur une vidéo de tennis | accepté |
| Catégorie d'âge inexistante (`u9`) | refusée par la FK |
| Saison inexistante (`2099-2100`) | refusée par la FK |
| U19 + saison 2025-2026 + date de match | accepté |

Couverture : 120 postes, **20 sports sur 20**, aucun sans poste.

## Une incohérence trouvée au passage

Un profil porte `position = 'milieu'` avec **`sport` à `null`**. Un poste
sans sport ne veut rien dire, et c'est exactement ce que la nouvelle clé
étrangère empêche désormais.

Cette ligne n'a pas été reprise automatiquement : son sport est
indevinable. À corriger à la main, ou à laisser — c'est un compte d'essai.

## Niveau de l'adversaire et numéro de maillot

### `competition_levels` — ordonné, et c'est essentiel

Dix niveaux, de `loisir` à `international`. Trois buts contre une équipe
de district ne valent pas trois buts en National : sans cette information,
un recruteur ne peut pas juger une performance.

La colonne **`rank`** est la raison d'être de cette table. Une simple liste
de libellés ne permettrait que « exactement district ». Avec un rang
ordonné, on écrit le filtre que le recruteur veut réellement :

```sql
-- « régional ou mieux » : 7 niveaux sur 10
where cl.rank >= (select rank from competition_levels where id = 'regional')
```

| Rang | Niveau |
|---|---|
| 1 | Loisir / non compétitif |
| 2 | District |
| 3 | Départemental |
| 4 | **Régional** |
| 5 | Inter-régional |
| 6 à 8 | National, 3e à 1er échelon |
| 9 | Professionnel |
| 10 | International |

**Comparer sur `rank`, jamais sur `id`.** Les identifiants n'ont pas
d'ordre alphabétique utile.

### `jersey_number` — seulement là où ça existe

Neuf des vingt sports n'utilisent pas de numéro de maillot : un nageur,
un golfeur ou un boxeur n'en porte pas.

La colonne `sports.has_jersey_number` marque les **onze** qui en ont :
football, basket, rugby, handball, volley, cricket, football américain,
baseball, hockey, karting, esport. Elle pilote l'affichage du champ dans
le formulaire.

Deux garde-fous côté base, indépendants du client :

- une contrainte borne la valeur entre 0 et 99 ;
- un trigger refuse tout numéro sur un sport qui n'en utilise pas.

### Vérifications

Cinq contrôles joués sur la base réelle, en transaction annulée :

| Test | Résultat |
|---|---|
| Numéro 10 sur une vidéo de tennis | refusé par le trigger |
| Numéro 9 sur une vidéo de football | accepté |
| Numéro 150 (hors bornes) | refusé par la contrainte |
| Niveau `ligue_des_champions` (inexistant) | refusé par la FK |
| Filtre « régional ou mieux » | 7 niveaux — correct |

Sur ce dernier point, le test annonçait d'abord 6 niveaux attendus et a
signalé un écart. Vérification faite, **la base avait raison** : les rangs
4 à 10 font bien 7 niveaux. C'était une erreur de calcul dans le test, pas
dans les données.

### `skills` — repoussé

Volontairement non implémenté pour l'instant. À reprendre quand les
premières données réelles montreront les qualités que les recruteurs
cherchent effectivement.

## Branchement du front

### Le problème à résoudre d'abord

L'application lit les vidéos avec `select *` à une douzaine d'endroits et
affiche `position` et `age_category` directement. Passer aux identifiants
aurait donc voulu dire modifier chaque requête pour y ajouter une
jointure, et chaque affichage pour lire la valeur jointe — beaucoup de
surface pour un gain nul à l'écran.

Un **trigger** (`videos_sync_labels`) recopie à l'écriture le libellé du
référentiel dans la colonne texte correspondante :

| Identifiant écrit | Libellé recopié |
|---|---|
| `position_id` | `position` |
| `age_category_id` | `age_category` |
| `season_id` | `season` *(colonne ajoutée)* |
| `opponent_level_id` | `opponent_level` *(colonne ajoutée)* |

Les **identifiants restent la source de vérité** : ce sont eux que
contraignent les clés étrangères et sur eux que portent les filtres. Le
texte n'est qu'un reflet, et il n'est jamais à écrire à la main.

Un texte libre saisi **sans** identifiant est laissé intact : les vidéos
antérieures ne sont pas touchées.

Contrôles joués sur la base réelle, en transaction annulée :

| Test | Résultat |
|---|---|
| Insertion avec les quatre identifiants | les quatre libellés recopiés |
| Changement de sport **et** de poste | libellé suit (`Gardien de but` → `Meneur`) |
| Retour des identifiants à `null` | libellés effacés |

### Formulaire de publication

- **Poste** : liste déroulante, restreinte aux postes du sport choisi.
  Changer de sport invalide le choix précédent — obtenu en ne retenant la
  valeur que tant qu'elle figure dans la liste du sport courant, plutôt
  qu'en la remettant à zéro dans un effet.
- **Catégorie d'âge**, **saison**, **niveau de l'adversaire** : listes
  déroulantes.
- **Date du match** : sélecteur de date, borné à aujourd'hui.
- **Numéro de maillot** : affiché seulement pour les sports concernés,
  borné à 0–99. La liste des sports concernés est **lue dans
  `sports.has_jersey_number`**, pas recopiée dans le code — sans quoi
  elle finirait par diverger de celle que le trigger fait respecter.

L'ordre des saisons proposées mérite un mot : le référentiel va jusqu'à
2034-2035. Présentée telle quelle, la liste se serait ouverte sur une
saison dix ans en avant. Elle est donc réordonnée — saison en cours en
tête, précédentes ensuite, à venir en fin.

### Filtres de recherche

Les deux panneaux de filtres (recherche du fil, recherche du recruteur)
passent des champs de texte aux listes déroulantes pour le poste et la
catégorie d'âge, et gagnent le niveau d'adversaire.

Ce dernier est un **« ce niveau ou mieux »**, comparé sur `rank` :
demander « régional » renvoie aussi l'inter-régional, le national, le
professionnel et l'international. Les vidéos sans niveau renseigné sont
écartées quand le filtre est actif — l'interface le dit.

Côté profils, le poste reste stocké en texte libre : le filtre compare
donc au **libellé** du poste choisi de ce côté-là, et à l'**identifiant**
du côté des vidéos.

### Recherche libre

Les libellés de saison et de niveau d'adversaire alimentent désormais la
recherche libre, aux côtés du titre, de la description et du championnat.

## Reste à faire

1. Étendre `search_athletes` aux titres et descriptions de vidéos.
2. Faire basculer `profiles.position` sur `position_id` — la colonne et sa
   clé étrangère existent, seul le formulaire de profil est encore en
   texte libre.

## Attention : la pile locale est en retard

Les migrations `11_referentiels_position_categorie_saison`,
`12_niveau_adversaire_et_numero_maillot` et
`videos_libelles_derives_referentiels` ont été appliquées **sur le projet
hébergé**. L'instantané `supabase/migrations/20260915090000_schema_complet.sql`
leur est antérieur : la pile locale ne les a donc pas, et le front
branché ne fonctionnerait pas contre elle.

Avant de relancer la pile locale, récupérez-les :

```bash
npx supabase link --project-ref uvsxteuhqqfgbmdgabfo
npx supabase db pull          # écrit les migrations manquantes
./scripts/db-local.sh reset
```
