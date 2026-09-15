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

## Reste à faire côté application

Les tables sont prêtes, le front n'est pas branché :

1. Remplacer les champs de saisie `position`, `age_category` par des listes
   déroulantes alimentées par ces tables. La liste des postes se filtre sur
   le sport déjà choisi.
2. Ajouter à la publication : saison, date du match, niveau de
   l'adversaire, et numéro de maillot — ce dernier affiché seulement si
   `sports.has_jersey_number` est vrai pour le sport choisi.
3. Brancher ces dimensions dans les filtres de recherche du recruteur.
4. Étendre `search_athletes` aux titres et descriptions de vidéos, pour la
   recherche libre.
