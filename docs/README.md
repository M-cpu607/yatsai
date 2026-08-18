# Classement du feed — pourquoi pas la popularité brute

`docs/ranking-simulation.mjs` compare des stratégies de classement sur
des données simulées. Chaque vidéo reçoit une **qualité cachée** (la
probabilité qu'un spectateur la like) ; l'algorithme ne voit jamais cette
qualité, seulement les vues et les likes accumulés. La question posée est :
lequel retrouve les bonnes vidéos, et lequel laisse une chance à tout le
monde ?

```bash
node docs/ranking-simulation.mjs
```

## Résultats

200 vidéos, une nouvelle par tick, 10 000 sessions.

| Stratégie | Top 10 % des vues | Jamais vues | Top 20 réel retrouvé | Bonnes tardives percées |
|---|---|---|---|---|
| `ORDER BY likes DESC` | 100 % | 190/200 | 1/20 | 0/12 |
| Taux lissé, sans exploration | 100 % | 166/200 | 2/20 | 3/12 |
| **Taux lissé + 20 % exploration** | 42 % | 0/200 | 13/20 | 9/23 |
| **Taux lissé + 30 % exploration** | 38 % | 0/200 | 14/20 | 9/18 |
| Taux lissé + 50 % exploration | 31 % | 0/200 | 13/20 | 9/18 |
| Chronologique | 10 % | 0/200 | 1/20 | 12/12 |

## Ce qu'il faut en retenir

**Classer par popularité brute est destructeur pour cette app.**
`ORDER BY likes_count DESC` laisse 190 vidéos sur 200 sans une seule vue.
Une vidéo bien classée reçoit des vues, donc des likes, donc reste bien
classée : le classement finit par mesurer l'exposition passée, pas la
qualité. Sur une plateforme de détection de talents, cela revient à ne
montrer que les athlètes déjà repérés — l'inverse du service rendu.

**Le taux d'engagement seul ne suffit pas.** Contre l'intuition, passer au
taux lissé sans rien d'autre ne corrige presque rien (166/200 toujours
invisibles). Logique : classer sur un taux ne sert à rien tant qu'une
vidéo n'a pas de vues pour en produire un.

**L'exploration est le mécanisme décisif.** Réserver une part du feed à
des vidéos peu vues fait passer les invisibles de 166 à 0, et la détection
de qualité de 2/20 à 13/20. C'est ce composant-là qu'il ne faut pas
oublier, pas le raffinement du score.

**30 % est le point d'équilibre.** Au-delà, on ne gagne plus rien.

**Le chronologique est équitable mais aveugle** : personne n'est oublié,
mais il ne retrouve que 1/20 des meilleures vidéos. C'est un bon défaut
tant que le volume est faible — il n'a aucun paramètre à régler et ne
défavorise personne.

## Limites

La simulation suppose une qualité intrinsèque, identique pour tous les
spectateurs. C'est faux ici : ce qui compte n'est pas « quelle vidéo plaît
le plus » mais « quel athlète correspond au besoin de ce recruteur ». Un
gardien U17 en Bretagne n'a pas à concurrencer un attaquant U21 — ils ne
s'adressent pas aux mêmes recruteurs. C'est un problème d'**appariement**,
et il renforce la conclusion : côté recruteur, les filtres et la recherche
comptent davantage qu'un classement global.

## Décision

Rester en tri chronologique tant que le volume est faible. Le jour où un
vrai classement sera mis en place, **l'exploration doit y être dès le
premier jour**. Et dans tous les cas, ne pas « simplifier » en triant par
`likes_count desc`.
