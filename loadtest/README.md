# Test de charge du feed

Objectif : remplacer une estimation par un chiffre mesuré. Combien de
requêtes par seconde l'infrastructure encaisse-t-elle réellement, et à
partir de quel point la latence devient perceptible.

---

## ⚠ À lire avant de lancer

**Le plan gratuit Supabase inclut 5 Go de bande passante par mois**, et un
test en consomme beaucoup plus vite qu'on ne l'imagine.

Mesuré : une page de 20 vidéos pèse **13,8 Ko**. Lors d'une validation à
faible concurrence, **6 secondes de test ont consommé 118 Mo** — soit 2,3 %
du quota mensuel en six secondes.

Le script s'arrête donc automatiquement à **150 Mo** par défaut, budget
vérifié en cours de palier et non à la fin. Pour aller plus loin, il faut
le demander explicitement :

```bash
node loadtest/quick.mjs --budget-mo 500
```

Les deux scripts sont en **lecture seule** : ils n'écrivent rien en base.

---

## Option A — sans rien installer

```bash
node loadtest/quick.mjs
```

Lit l'URL et la clé depuis le `.env` à la racine. Monte par paliers
(1, 5, 10, 25, 50, 100 connexions simultanées), 8 s chacun, et s'arrête
dès que le plafond est atteint.

```bash
node loadtest/quick.mjs --paliers 1,10,50,100,200 --duration 15
node loadtest/quick.mjs --max 25            # test très léger
node loadtest/quick.mjs --budget-mo 500     # autoriser plus de trafic
node loadtest/quick.mjs --url http://... --key ...   # viser un autre projet
```

Si la requête de contrôle échoue, le script indique la cause probable
selon le code de statut (401 clé refusée, 404 fonction absente, 503 projet
en pause…).

**Limite :** au-delà de ~200 connexions, Node devient lui-même le goulot
d'étranglement — vous mesureriez le client, pas le serveur. Pour aller
plus haut, utilisez k6.

## Option B — k6, pour la vraie montée en charge

```bash
# macOS : brew install k6    ·    autres : https://k6.io/docs/get-started/installation/
k6 run -e SUPABASE_URL=https://xxx.supabase.co -e SUPABASE_KEY=eyJ... loadtest/feed.k6.js
```

Reproduit un usage réel plutôt qu'un martèlement : chaque utilisateur
virtuel charge une page, la « regarde » 10 à 30 s, puis fait défiler sur
1 à 3 pages. C'est ce rapport entre temps de réflexion et requêtes qui
détermine combien de personnes une infrastructure supporte.

Paliers : 50 → 200 → 500 utilisateurs virtuels. Ajustez `stages` dans le
fichier.

---

## Lire les résultats

| Ce que vous voyez | Ce que ça veut dire |
|---|---|
| p95 reste plat quand la concurrence monte | Le serveur absorbe, continuez à monter |
| p95 grimpe fortement | Vous avez trouvé la capacité réelle |
| Erreurs 5xx / timeouts | Plafond dépassé |
| p95 > 500 ms | Le défilement devient perceptible |

**Le chiffre qui compte** est le débit (req/s) au dernier palier resté sain.

### Convertir en nombre d'utilisateurs

10 000 utilisateurs ne font **pas** 10 000 req/s. Quelqu'un qui fait
défiler charge 20 vidéos d'un coup puis ne redemande rien pendant ~30 s,
soit environ **0,033 req/s par personne**.

```
utilisateurs actifs supportés ≈ débit mesuré ÷ 0,033
```

300 req/s mesurés ≈ 9 000 utilisateurs actifs simultanés. C'est pour cela
que la formulation « 10 000 utilisateurs » et « 10 000 requêtes/seconde »
décrivent deux problèmes séparés par deux ordres de grandeur.

---

## Si les chiffres sont décevants

Dans l'ordre d'impact :

1. **Mettre le feed en cache en amont.** C'est ~90 % du trafic et il est
   identique pour tout le monde. La policy le rend lisible sans session,
   donc cacheable — une requête peut alors servir des milliers de
   personnes. C'est le levier qui fait changer d'ordre de grandeur.
2. **Passer au plan Pro** et dimensionner le compute. L'instance gratuite
   est un nano à `max_connections = 60`.
3. **Activer le pooler** (Supavisor) au-delà de quelques centaines de
   connexions.
4. **Sortir les notifications du chemin d'écriture.** Chaque like déclenche
   aujourd'hui 3 écritures, dont un insert `notifications` synchrone.
   `pgmq` est disponible sur le projet.
