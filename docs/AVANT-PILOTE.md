# Avant le pilote — état réel avant d'ouvrir à 300 associations

Constat au **17 septembre 2026**, projet Supabase `uvsxteuhqqfgbmdgabfo`
(région `eu-north-1`, PostgreSQL 17.6.1.113, statut `ACTIVE_HEALTHY`,
créé le 4 mai 2026). **Plan gratuit.**

Ce document constate. Deux points y ont été traités depuis sa rédaction —
le **A2** (confidentialité des profils) et le **B6** (index morts), où
l'état avant/après est reporté ; tout le reste est à faire.

---

## Comment lire ce document

Quelques mots reviennent partout. Ils sont expliqués une fois ici.

- **RLS** (*Row Level Security*, « sécurité au niveau de la ligne ») : la
  règle, écrite dans la base de données elle-même, qui décide qui a le
  droit de lire quelle ligne. C'est la seule barrière qui compte : tout ce
  qui est filtré uniquement par le code de l'application peut être
  contourné en appelant l'API directement.
- **Clé anon** : la clé d'accès public que l'application embarque dans le
  code envoyé au navigateur. **Elle est publique par construction** —
  n'importe qui peut la lire en ouvrant les outils de développement de son
  navigateur. Elle ne protège rien ; c'est la RLS qui protège.
- **Egress / bande passante** : le volume de données que Supabase envoie
  vers les utilisateurs. C'est un poste facturé, et c'est celui qui sature
  en premier ici.
- **Realtime** : le mécanisme qui pousse une information vers les
  applications ouvertes sans qu'elles aient à la redemander (nouveau
  message, nouvelle vidéo).
- **Advisor** : l'outil d'audit automatique de Supabase, qui signale des
  problèmes de sécurité et de performance. Il signale ; il ne juge pas.
  Ce document juge.

---

## Chiffres mesurés sur le projet réel

| Mesure | Valeur relevée | Quota du plan gratuit |
|---|---|---|
| Taille de la base | **122 Mo** (127 511 699 octets) — **15 Mo** après le `REINDEX` du point B6 | 500 Mo |
| dont index de la table `videos` | **107 Mo** pour **1 seule ligne** — **368 ko** après | — |
| Fichiers stockés (Storage) | **18,4 Mo**, 5 fichiers | 1 Go |
| Comptes créés | **8** | — |
| Comptes actifs sur 30 jours | **1** | 50 000 utilisateurs actifs/mois |
| Connexions PostgreSQL maximum | **60** | 60 (instance « nano ») |
| Connexions en cours au relevé | **13** | — |
| Réservoir de connexions de l'API | **10** | — |
| Plafond serveur de lignes renvoyées | **aucun** (`pgrst.db_max_rows` vide) | — |
| E-mails de réinitialisation jamais envoyés | **0** | — |

**Ce que je n'ai pas pu mesurer, et que je n'estime pas :**

- La consommation d'egress du mois en cours. Les outils dont je dispose
  n'exposent pas les compteurs de facturation. À lire dans la console
  Supabase, onglet *Usage*.
- La configuration SMTP (le service d'envoi d'e-mails). Elle n'est pas
  lisible par les outils dont je dispose. Voir le point B2.
- Le nombre de connexions Realtime simultanées atteint jusqu'ici.
- Le poids réel d'une page de feed en production : la base ne contient
  qu'**une** vidéo, donc toute mesure faite aujourd'hui ne dit rien de
  demain.

---

# 1. Ce qui bloque le lancement

## A1. « Mot de passe oublié » n'existe pas

**Ce que c'est.** La fonction qui envoie un lien de réinitialisation par
e-mail s'appelle `resetPasswordForEmail`. Je l'ai cherchée dans tout le
code source : **zéro occurrence**. Le fichier d'authentification
(`src/Auth.jsx`) ne contient que deux appels : créer un compte
(`signUp`) et se connecter (`signInWithPassword`). Il existe bien un
changement de mot de passe dans les réglages (`src/App.jsx`, appel
`updateUser`), mais il exige d'**être déjà connecté** — donc inutile à
qui a oublié son mot de passe.

Confirmation côté base : sur les 8 comptes existants, **aucun** n'a jamais
reçu de demande de réinitialisation (`recovery_sent_at` vide partout).

**Conséquence concrète.** Un dirigeant d'association oublie son mot de
passe deux semaines après l'inscription. Il n'a aucun moyen de revenir
dans son compte. Aucun écran ne le lui propose. Il doit vous écrire, et
vous devez intervenir à la main dans la console Supabase. Sur 300
associations, en tablant sur un taux d'oubli très bas de 5 %, cela fait
**15 interventions manuelles**, réparties de façon imprévisible.

**Action.** Ajouter l'écran « mot de passe oublié » et l'écran « choisir
un nouveau mot de passe » avant d'envoyer la moindre invitation. Ce point
dépend du point B2 (envoi d'e-mails) : sans SMTP correct, l'écran existera
mais l'e-mail n'arrivera pas.

---

## A2. Les profils « privés » sont lisibles par tout le monde

**Ce que c'est.** La règle de lecture de la table `profiles` est
`using (true)` pour le rôle `public` — autrement dit : **tout le monde,
même sans être connecté, peut lire toutes les colonnes de tous les
profils.** J'ai vérifié la règle directement en base.

Or l'application propose deux réglages de confidentialité : « profil
privé » (`is_private`) et « masquer ma localisation » (`hide_location`).
Ces deux réglages ne sont appliqués **que dans le code JavaScript** qui
tourne dans le navigateur — de simples filtres du type
`.filter(p => !p.is_private)` à quatre endroits de `src/App.jsx`. La base
de données, elle, ne les connaît pas.

**Conséquence concrète.** Une athlète de 16 ans coche « profil privé » et
« masquer ma ville ». L'application lui affiche un cadenas. En réalité,
n'importe qui muni de la clé anon — c'est-à-dire **n'importe qui ayant
ouvert l'application une fois** — peut récupérer en une requête son nom,
sa date de naissance, sa ville, son club, son niveau et sa biographie.
Le cadenas est un dessin.

Avec 300 associations et des athlètes mineurs, ce n'est pas un défaut de
finition : c'est un manquement au RGPD sur des données de mineurs, et le
type de sujet qui arrête un partenariat institutionnel.

**Action — faite.** Trois migrations ont été appliquées le 17 septembre
2026, après la rédaction de ce constat :
`20260917082343_profils_masquage_age_et_localisation`,
`20260917082547_profils_rls_prive_et_droits_par_colonne` et
`20260917082606_get_feed_age_affiche_sans_birthdate`. La confidentialité
n'est plus affaire de JavaScript.

*Le profil privé.* La règle `profiles_select` n'est plus `using (true)` :
une ligne dont `is_private` est coché n'est visible que de son
propriétaire et des administrateurs. L'athlète de 16 ans de l'exemple
ci-dessus disparaît maintenant des résultats de qui n'est pas elle.

*La localisation et l'âge.* La RLS masque des lignes, jamais des
colonnes, et les droits par colonne sont globaux, pas par ligne : ni l'un
ni l'autre ne sait « cacher la ville de ceux qui l'ont demandé ». Le sens
des colonnes a donc été inversé. `city`, `region`, `country` et `age`
sont devenues des colonnes **générées** qui recopient
`city_private`, `region_private`, `country_private` et `age_private` — ou
`null` si `hide_location` / `hide_age` est coché. L'écriture vise
désormais les colonnes `_private` ; la lecture, elle, n'a pas bougé, donc
la quarantaine d'endroits de l'application qui lisent `city` sont
corrects sans avoir été touchés.

*Les colonnes qui ne devaient jamais sortir.* Le droit de lecture sur
`profiles` a été retiré à `anon` et `authenticated`, puis rendu colonne
par colonne. Ne sont plus lisibles : `birthdate`, `phone`,
`level_proof_url`, `is_admin`, les quatre colonnes `_private` et trois
colonnes d'état interne. **37 colonnes sur 48** restent lisibles. La date
de naissance, celle qui rendait ce point grave, ne sort plus de la base :
seul `age`, cache d'affichage masquable, sort.

| | Avant | Après |
|---|---|---|
| Règle de lecture de `profiles` | `using (true)` | privé réservé au propriétaire et aux administrateurs |
| `select('*')` sur `profiles` sans compte | renvoie tout | `permission denied for table profiles` |
| Colonnes lisibles sans compte | 44 sur 44 | **37 sur 48** |
| `birthdate` lisible par un tiers | oui | **non** |
| « Masquer ma ville » appliqué par | le navigateur | la base |

Trois conséquences de bord ont été traitées dans la foulée :
`get_my_profile()` (`SECURITY DEFINER`, restreinte à `auth.uid()`) rend à
chacun son propre profil complet, que les droits par colonne lui
refusaient désormais ; `search_athletes` est passée `SECURITY DEFINER`
avec `SET search_path TO ''` parce qu'elle filtre sur `birthdate`, et
exclut explicitement les profils privés, la RLS ne s'appliquant plus à
elle ; `get_feed` lit `age` au lieu de le recalculer depuis `birthdate`,
qu'elle n'a plus le droit de lire. Côté application, les quatre
`select('*')` sur `profiles` ont été corrigés — ils échoueraient sinon.

L'ensemble a été rejoué instruction par instruction dans un vrai
PostgreSQL avant d'être consigné : voir `supabase/README.md`, section
« Vérifications effectuées ».

**Ce qui reste à faire ici.** Le point **C2** (`search_path` mutable) est
réglé pour `search_athletes` mais pas pour `get_feed`, laissée
intentionnellement telle quelle. Et l'écoute Realtime globale sur
`profiles` décrite au point **A4** reste ouverte.

À distinguer de la table `videos`, elle aussi en `using (true)` : là,
c'est **assumé et documenté** (`BACKEND.md` §4) — le feed doit être public
pour pouvoir être mis en cache. Aucun problème.

---

## A3. Le feed télécharge tout le catalogue à chaque ouverture

**Ce que c'est.** La fonction qui charge le feed (`loadVideos`, autour de
la ligne 12549 de `src/App.jsx`) écrit ceci :

```js
supabase.from('videos')
  .select('*, profiles!videos_user_id_fkey(...), likes(count)')
  .order('created_at', { ascending: false });
```

Il n'y a **aucun `.limit()`**. Et côté serveur, le garde-fou qui plafonne
le nombre de lignes renvoyées (`pgrst.db_max_rows`) est **vide** : j'ai
vérifié, il ne renvoie rien. Rien n'arrête donc cette requête. Le
`select('*')` ramène les 36 colonnes de chaque vidéo, y compris la
description entière et les données de tracking. Le `likes(count)` ajoute
un comptage par vidéo.

C'est exactement le problème que `BACKEND.md` §2 décrit comme corrigé.
Et il l'est — **dans la base** : la fonction `get_feed` existe, elle
pagine proprement et a été mesurée à 0,25 ms sur 200 000 vidéos.
**Mais l'application ne l'appelle jamais.** Le seul appel de fonction
serveur dans `src/App.jsx` est `increment_video_views`. `get_feed` et
`search_athletes` sont écrites, testées, et inutilisées. `BACKEND.md` §8
le disait déjà : « le branchement sur `get_feed` reste à refaire sur le
vrai `App.jsx` ». Ce n'est toujours pas fait.

**Conséquence concrète.** Aujourd'hui, avec une vidéo en base, personne ne
voit rien. À 300 associations, disons 3 000 vidéos : chaque ouverture de
l'application télécharge les 3 000 vidéos avec leurs descriptions. Sur un
téléphone en 4G, l'écran reste blanc plusieurs secondes, puis l'appareil
rame parce qu'il tient 3 000 objets en mémoire. Et chaque ouverture
consomme de la bande passante facturée.

Ordre de grandeur pour situer, à partir du seul poids mesuré dont je
dispose (13,8 Ko pour 20 vidéos, relevé dans `loadtest/README.md`) :
3 000 vidéos représentent environ **2 Mo par ouverture** au lieu de
13,8 Ko. Soit **150 fois plus**. Je précise que c'est une extrapolation à
partir d'une mesure faite sur un feed plus léger que le feed réel, pas une
mesure : le poids exact dépendra des descriptions saisies.

**Action.** Brancher le feed sur `get_feed` (pagination par curseur, 20
vidéos par page). Le travail serveur est déjà fait et déjà mesuré.

---

## A4. Une publication de vidéo recharge tout le catalogue chez tous les connectés

**Ce que c'est.** Autour de la ligne 12532 de `src/App.jsx`, un abonnement
Realtime nommé `videos-feed-realtime` est ouvert **pour chaque personne
connectée**. Sur l'ajout d'une vidéo, il rappelle `loadVideos()` — la
requête sans limite du point A3.

`BACKEND.md` §4 dit noir sur blanc : « **Realtime uniquement sur la
messagerie. Ne jamais abonner le feed en temps réel.** » C'est fait quand
même.

Ce même abonnement écoute aussi les modifications de la table `profiles`,
**pour toutes les lignes**.

*Mise à jour depuis la correction de A2.* Ce qui transite par ce canal est
désormais filtré : Realtime applique la RLS et les droits par colonne, donc
une modification de profil privé ne part plus, et la date de naissance non
plus. Ce qui reste vrai, et qui suffit à garder ce point bloquant : chaque
modification de profil, de qui que ce soit, réveille tous les clients
connectés pour rien.

**Conséquence concrète.** Un athlète publie une vidéo. À cet instant, les
200 personnes ayant l'application ouverte rechargent chacune la totalité
du catalogue. Ce n'est pas 1 requête, c'est 200 requêtes lourdes
simultanées. Le soir, en heure de pointe, avec plusieurs publications par
minute, l'application se fige pour tout le monde en même temps — et le
test de charge ne verra jamais ce phénomène, parce qu'il mesure des
requêtes isolées, pas cet effet d'avalanche.

**Action.** Supprimer l'abonnement Realtime du feed, ou au minimum ne plus
recharger : afficher une pastille « nouvelles vidéos disponibles » que
l'utilisateur clique s'il le souhaite. Et retirer l'écoute globale sur
`profiles`.

---

## A5. Aucune sauvegarde de la base

**Ce que c'est.** Le plan gratuit de Supabase n'inclut **aucune
sauvegarde** : ni sauvegarde quotidienne, ni restauration à un instant
donné. Le plan Pro inclut 7 jours de sauvegardes quotidiennes.

**Conséquence concrète.** Une mauvaise manipulation, une migration ratée,
une suppression en cascade : les données de 300 associations sont perdues
sans recours. Il n'existe aucun point de retour. C'est le risque le plus
simple à supprimer de toute cette liste.

**Action.** Passer au plan Pro (25 $/mois) **avant** la première invitation.
Voir la section 4 pour le détail de ce que cela change.

---

## A6. L'envoi d'e-mails n'est pas vérifié — et le service par défaut plafonne à 2 par heure

**Ce que c'est.** Supabase fournit un service d'envoi d'e-mails par défaut
**limité à 2 e-mails par heure pour l'ensemble du projet**. Il est destiné
aux tests, pas à la production.

Je **n'ai pas pu lire** la configuration SMTP du projet hébergé : les
outils dont je dispose n'exposent pas les réglages d'authentification.
Je ne peux donc pas dire si un service d'envoi propre (Resend, Postmark,
SendGrid…) est configuré. Ce que je peux dire, mesuré :

- Les 8 comptes existants sont tous confirmés, et **aucun e-mail de
  réinitialisation n'a jamais été envoyé** par ce projet.
- La confirmation d'adresse à l'inscription est **désactivée**
  (`enable_confirmations = false` dans `supabase/config.toml`, avec le
  commentaire « comme en production »). C'est cohérent avec le code :
  `Auth.jsx` attend une session immédiatement après `signUp` et resterait
  bloqué si une confirmation était exigée.

**Conséquence concrète.** L'inscription, elle, ne dépend pas de l'e-mail :
elle fonctionnera. En revanche, dès que « mot de passe oublié » (point A1)
existera, il passera par e-mail. Avec le service par défaut, **la 3ᵉ
personne d'une même heure ne recevra rien** — pas d'erreur, pas de
message, juste rien. Même chose pour le changement d'adresse e-mail, qui
envoie aujourd'hui deux messages de confirmation (ancienne et nouvelle
adresse).

**Action.** Trois choses, dans cet ordre :
1. Ouvrir la console Supabase → *Authentication* → *Emails* → *SMTP
   Settings*, et vérifier si un fournisseur est configuré. Si la case
   « Enable Custom SMTP » est décochée, vous êtes à 2 e-mails/heure.
2. Configurer un fournisseur SMTP réel.
3. Vérifier que l'URL du site (*Authentication* → *URL Configuration*)
   pointe vers le domaine de production. Le fichier de configuration local
   contient `site_url = "http://localhost:5173"` — c'est normal pour le
   développement, mais si le projet hébergé a la même valeur, les liens
   de réinitialisation enverront vos utilisateurs sur leur propre machine.
   Je n'ai pas pu vérifier cette valeur côté hébergé.

---

# 2. Ce qui tiendra, mais mal

## B1. Le plafond Realtime : 200 personnes connectées en même temps

**Ce que c'est.** Le plan gratuit autorise **200 connexions Realtime
simultanées** et 2 millions de messages par mois. L'application ouvre 21
canaux Realtime, mais ils partagent tous une seule connexion réseau par
appareil : le plafond correspond donc à **200 applications ouvertes en
même temps**, pas 200 utilisateurs au total.

**Conséquence concrète.** 300 associations, ce sont plusieurs milliers de
comptes. Un mercredi soir ou un dimanche après-midi, dépasser 200
applications ouvertes simultanément est probable. Au-delà, les
connexions sont refusées : les messages n'arrivent plus en direct, les
notifications ne remontent plus. L'application continue de fonctionner,
mais les fonctions « temps réel » cessent silencieusement.

Le point A4 aggrave ce plafond : le feed consomme des messages Realtime
qui n'ont aucune raison d'exister.

**Action.** Le plan Pro monte à 500 connexions et 5 millions de messages.
Combiné à la suppression de l'abonnement du feed (A4), c'est suffisant
pour le pilote.

## B2. Le stockage vidéo : 1 Go, et un fichier peut peser 200 Mo

**Ce que c'est.** `BACKEND.md` affirme que « les vidéos sont sur YouTube ».
C'est vrai en partie seulement : le code contient aussi un téléversement
direct vers Supabase Storage (`uploadToStorage`, autour de la ligne 2716
de `src/App.jsx`), et le compartiment `videos` accepte des fichiers
jusqu'à **200 Mo**. Il est public.

Relevé aujourd'hui : **5 fichiers, 18,4 Mo au total**.

**Conséquence concrète.** Le quota gratuit est de 1 Go. **Cinq** vidéos de
200 Mo le remplissent. Ensuite, les téléversements échouent. Et chaque
lecture de vidéo consomme de la bande passante : le quota gratuit de 5 Go
par mois correspond à environ **25 lectures** d'une vidéo de 200 Mo.
Autrement dit, sur le plan gratuit, la fonction « téléverser une vidéo »
est inutilisable dès la première semaine avec 300 associations.

**Action.** Décider explicitement : soit YouTube uniquement (et retirer le
téléversement de l'interface), soit assumer l'hébergement et passer au
plan Pro (100 Go de stockage, 250 Go d'egress). Dans les deux cas,
abaisser la limite de 200 Mo par fichier — c'est très au-delà de ce qu'une
séquence de détection nécessite.

## B3. L'assistant charge 10 000 profils et 10 000 vidéos à chaque question

**Ce que c'est.** Autour des lignes 4485 à 4492 de `src/App.jsx`, trois
requêtes portent `.limit(10000)` : tous les profils, toutes les vidéos
(descriptions comprises), tous les posts de signature. Le commentaire du
code l'assume : « `.limit` élevé pour ne pas être plafonné à 1000 lignes ».

**Conséquence concrète.** Chaque question posée à l'assistant déclenche le
téléchargement de la quasi-totalité de la base sur le téléphone de
l'utilisateur. Une question = plusieurs mégaoctets d'egress. Dix
questions = plusieurs dizaines. C'est le deuxième poste de consommation de
bande passante après le feed, et il grandit avec le catalogue.

**Action.** Faire filtrer la recherche par la base plutôt que par le
téléphone. `search_athletes` existe déjà en base et fait exactement cela.

## B4. La recherche de profils ramène tout, toutes colonnes

**Ce que c'est.** Autour de la ligne 4915 : `.from('profiles').select('*')`
sans aucune limite. Au total, `select('*')` apparaît **19 fois** dans
`src/App.jsx`, dont plusieurs sur `videos` et `profiles`.

**Conséquence concrète.** Même mécanique que A3, à plus petite échelle :
l'onglet recherche devient lent à mesure que la plateforme grandit, et il
transmet au navigateur des colonnes qu'il n'affiche jamais.

*Mise à jour depuis la correction de A2.* Les colonnes sensibles ne sortent
plus, et le `select('*')` de cet appel n'est plus seulement inutilement
lourd : il est **refusé** par la base. Il a donc fallu y énumérer les
colonnes pour que l'écran continue de fonctionner. Ce qui reste à faire
ici, c'est la **limite** — l'appel ramène toujours tous les profils.

**Action.** Ajouter une limite, et cesser de classer en JavaScript ce que
`search_athletes` sait faire côté serveur.

## B5. Le comptage des vues écrit une ligne par vidéo regardée

**Ce que c'est.** `registerVideoView` (autour de la ligne 13808) appelle
`increment_video_views` **une vidéo à la fois**. La base propose pourtant
`increment_video_views_batch`, qui accepte 100 identifiants en un appel —
`BACKEND.md` §3 la documente. Elle n'est pas utilisée.

**Conséquence concrète.** Quelqu'un qui fait défiler 50 vidéos déclenche
50 écritures sur la table la plus lue de l'application. Les écritures
verrouillent les lignes et ralentissent les lectures. C'est l'un des rares
effets que le test de charge, purement en lecture, ne pouvait pas voir.

**Action.** Basculer sur la version groupée.

## B6. 107 Mo d'index morts occupent 21 % du quota de base

**Ce que c'est.** La table `videos` contient **1 ligne** (8 Ko de
données) et **107 Mo d'index**. Ce sont les restes du test de charge à
200 000 vidéos : les lignes ont été supprimées, l'espace des index n'a pas
été récupéré. Sur les 122 Mo de base mesurés, **107 Mo sont vides**.

**Conséquence concrète.** Aucune sur la vitesse. Mais le quota gratuit est
de 500 Mo, et vous en consommez déjà 122 sans avoir un seul utilisateur.
Après nettoyage, la base retomberait autour de 15 Mo.

**Action — faite.** Un `REINDEX TABLE public.videos` a été exécuté le
17 septembre 2026, après la rédaction de ce constat. Mesures relevées
avant et après :

| | Avant | Après |
|---|---|---|
| Table `videos` (données + index) | 107 Mo | **368 ko** |
| Base entière | 122 Mo | **15 Mo** |

La prédiction de « autour de 15 Mo » ci-dessus s'est donc vérifiée au
mégaoctet près. `pg_stat_user_tables` confirme l'origine : 120 023 lignes
insérées dans `videos` au fil des tests, et un `truncate` qui a rendu les
lignes sans rendre les pages d'index.

Le quota gratuit est maintenant consommé à **3 %** au lieu de 24 %.

## B7. N'importe qui peut gonfler les compteurs sans être connecté

**Ce que c'est.** L'advisor de sécurité signale 5 fonctions appelables
sans être connecté. Je les ai lues une par une :

| Fonction | Verdict |
|---|---|
| `is_admin()` | **Faux positif.** Sans session, elle renvoie `false`. Aucun risque. |
| `increment_video_views` | **Réel.** Incrémente un compteur de vues, sans authentification ni limite. |
| `increment_video_views_batch` | **Réel.** Même chose, 100 vidéos par appel. |
| `record_sponsored_click` | **Réel.** Incrémente un compteur de clics sponsorisés. |
| `record_sponsored_impression` | **Réel.** Idem pour les affichages. |

**Conséquence concrète.** Un athlète un peu débrouillard peut faire passer
sa vidéo de 12 à 50 000 vues en quelques minutes. Sur une plateforme de
détection, où le nombre de vues est un signal de crédibilité auprès des
recruteurs, c'est un problème d'équité. Et si les compteurs sponsorisés
servent un jour à facturer un partenaire, c'est un problème de facturation.

**Action.** Deux options : l'authentification obligatoire sur ces
fonctions (mais le feed est consultable sans compte, ce qui fausserait le
comptage), ou une limitation de débit par adresse IP. À trancher.
Ce n'est pas bloquant pour un pilote de 300 associations, où les
utilisateurs sont identifiés et où la fraude se voit ; cela le devient à
l'ouverture au public.

## B8. La protection contre les mots de passe compromis est désactivée

**Ce que c'est.** Confirmé par l'advisor de sécurité. Supabase sait
vérifier un mot de passe choisi contre la base HaveIBeenPwned, qui
recense les mots de passe ayant fuité lors de piratages connus. La
vérification est désactivée. C'était déjà noté dans `BACKEND.md` §8.

**Conséquence concrète.** Un dirigeant d'association réutilise le mot de
passe de sa boîte mail, laquelle a fuité en 2019. Son compte Scolympia est
prenable en quelques secondes — et avec lui, l'accès aux profils des
athlètes qu'il suit.

**Action.** Une case à cocher : *Authentication* → *Policies* → « Leaked
password protection ». Aucun code à écrire. À faire avant le lancement,
c'est gratuit et immédiat.

## B9. La réconciliation des compteurs n'est jamais exécutée

**Ce que c'est.** La base contient une fonction `reconcile_counters()`,
qui recalcule les compteurs de likes, commentaires et abonnés depuis la
source de vérité en cas de dérive. `BACKEND.md` indique qu'elle est « à
brancher sur `pg_cron` en production ». J'ai vérifié les extensions
installées : `plpgsql`, `pg_stat_statements`, `uuid-ossp`, `pgcrypto`,
`supabase_vault`, `pg_trgm`, `unaccent`. **Ni `pg_cron`, ni `pgmq`.**
La fonction existe mais n'est déclenchée par rien.

`BACKEND.md` affirme par ailleurs que « `pgmq` est disponible sur le
projet » pour sortir les notifications du chemin d'écriture. **C'est
inexact** : l'extension n'est pas installée.

**Conséquence concrète.** Si un compteur dérive — un déclencheur qui
échoue, une suppression en lot — l'écart reste affiché indéfiniment. Un
athlète voit « 47 likes » quand il en a 52. Gênant, pas grave.

**Action.** Activer `pg_cron` et programmer `reconcile_counters()` une
fois par nuit. Corriger la mention de `pgmq` dans `BACKEND.md`.

---

# 3. Ce qui peut attendre

## C1. Les 43 index « inutilisés » signalés par l'advisor

L'advisor de performance ne remonte **que cela** : 43 index jamais
utilisés, en niveau INFO (information, pas alerte). **Verdict : non
concluant, à ignorer.** Ce jugement s'appuie sur des statistiques
d'utilisation vides — la base contient 1 vidéo et 8 profils, aucune
requête applicative n'y a jamais tourné. Un index n'est pas « inutile »
parce que personne ne s'en est encore servi.

`BACKEND.md` §8 documentait déjà ce point pour 20 index ; ils sont
maintenant 43 parce que des index ont été ajoutés depuis. Aucune action.
À réévaluer **après** un mois de trafic réel, quand le verdict voudra dire
quelque chose.

## C2. `search_path` mutable sur `get_feed`

L'advisor de sécurité le signale. **C'est un choix délibéré et documenté**
(`BACKEND.md` §2) : ajouter cette clause empêche PostgreSQL d'intégrer la
fonction dans la requête appelante, ce qui coûtait 2,5 fois plus cher à la
mesure. `get_feed` ne détient aucun privilège particulier
(`SECURITY INVOKER`) et toutes ses références sont qualifiées par leur
schéma. J'ai relu sa définition : c'est exact. Aucune action.

*Mise à jour depuis la correction de A2.* Ce point ne concernait
initialement pas que `get_feed` : `search_athletes` était dans le même cas.
Elle est depuis passée en `SECURITY DEFINER`, ce qui rend la clause
obligatoire — une fonction qui détient les privilèges de son propriétaire
et laisse son `search_path` libre peut voir ses appels détournés par un
objet glissé dans `pg_temp`. Elle l'a donc reçue, et l'arbitrage coût
contre sécurité s'y est renversé.

## C3. `profiles` porte à la fois `age` et `birthdate`

Déjà documenté (`BACKEND.md` §8). La colonne `age` devient fausse au
premier anniversaire ; `birthdate` fait autorité et les fonctions serveur
calculent l'âge à partir d'elle. À supprimer une fois les profils
complétés. Sans urgence.

## C4. Les migrations ne sont pas toutes versionnées

Le dépôt contient 6 fichiers de migration, dont 5 non suivis par Git. La
base, elle, en a appliqué bien davantage. `BACKEND.md` §7 donne la marche
à suivre (`npx supabase db pull`). C'est un risque de traçabilité, pas de
panne. À faire avant que l'équipe ne s'agrandisse.

---

# 4. Plan gratuit contre plan Pro : ce que change réellement 25 $/mois

| | Gratuit | Pro (25 $/mois) | Où vous en êtes |
|---|---|---|---|
| Taille de base | 500 Mo | 8 Go | **122 Mo**, dont 107 Mo d'index morts |
| Stockage de fichiers | 1 Go | 100 Go | **18,4 Mo** — mais 5 vidéos de 200 Mo suffisent à saturer |
| Bande passante / mois | 5 Go | 250 Go | **non mesurable** avec mes outils |
| Utilisateurs actifs / mois | 50 000 | 100 000 | **1** — jamais un facteur pour 300 associations |
| Connexions Realtime simultanées | **200** | 500 | non mesuré — plafond atteignable en soirée |
| Sauvegardes | **aucune** | 7 jours, quotidiennes | **aucune** (point A5) |
| Mise en pause après 7 jours d'inactivité | oui | non | risque pendant la phase de démarrage |
| Puissance de calcul | « nano », 60 connexions max | augmentable | 60 connexions, 13 utilisées |

**À quel moment le plan gratuit casse, dans l'ordre :**

1. **Immédiatement, sur la sauvegarde.** Ce n'est pas un seuil : il n'y a
   aucune sauvegarde, dès aujourd'hui.
2. **À la cinquième vidéo téléversée** de 200 Mo : le stockage est plein.
3. **Au premier pic du soir** : au-delà de 200 applications ouvertes
   simultanément, le temps réel décroche.
4. **Sur la bande passante**, dont je ne connais pas la consommation
   actuelle, mais que le feed non paginé (A3) et l'assistant (B3)
   multiplient par un facteur que je n'ai pas pu mesurer — sûrement
   supérieur à 100.

**Ce que le plan Pro ne règle pas.** Il ne corrige **aucun** des points de
la section 1, sauf A5. Le feed non paginé restera non paginé ; les profils
privés resteront lisibles ; « mot de passe oublié » n'existera toujours
pas. Payer achète de la marge et des sauvegardes, pas des corrections.
L'inverse est vrai aussi : corriger A3 et A4 diviserait la consommation de
bande passante par un facteur important, et repousserait d'autant le
besoin de puissance.

**Recommandation.** Passer au plan Pro maintenant — pour la sauvegarde
(A5), pas pour la performance. Puis corriger A1 à A4 et B8 avant
d'envoyer la première invitation.

---

# 5. Journaux des dernières 24 heures

**Rien d'inquiétant. Rien du tout, en réalité.**

Le flux de journaux contient **61 entrées** sur 24 heures : 42 du service
d'API, 19 de PostgreSQL. Détail :

- **Aucune erreur applicative**, aucun code 4xx ou 5xx.
- **Aucun refus RLS** — normal : aucune requête applicative n'a tourné.
- **Aucune requête lente.**
- Les entrées PostgreSQL sont des migrations passées ce matin (référentiels
  de postes, numéros de maillot), des points de reprise automatiques, et
  deux messages métier volontaires (« Le sport "nat" n'utilise pas de
  numéro de maillot », « ROLLBACK VOLONTAIRE ») : ce sont des tests de
  contraintes, pas des incidents.
- Une seule anomalie : `could not receive data from client: Connection
  reset by peer` à 05h41. C'est un outil d'administration qui s'est
  déconnecté brutalement. Sans conséquence.

J'ai également interrogé `pg_stat_statements`, qui enregistre le temps
passé par chaque requête. **Il ne contient aucune requête de
l'application.** Les 15 plus lentes sont toutes des requêtes de la console
Supabase ou de l'outil d'administration — la plus coûteuse étant
`SELECT name FROM pg_timezone_names` à 603 ms de moyenne, exécutée par le
service d'API quand il recharge son catalogue.

**Conclusion à retenir.** L'absence de problème dans les journaux ne
signifie pas que le système est sain : elle signifie qu'**il n'a jamais
servi**. 8 comptes, 1 actif sur 30 jours, 1 vidéo. Aucune conclusion
rassurante ne peut être tirée de ces journaux.

---

# 6. Ce que le test de charge ne pouvait pas voir

Les 911 requêtes/seconde sans erreur sont un vrai chiffre, et une bonne
nouvelle sur la puissance brute de l'instance. Mais le test a été réalisé
sur une base contenant **une seule vidéo**, en lecture seule, avec des
requêtes isolées. Il ne pouvait structurellement pas révéler :

- **Le volume qui grandit** (A3, B3, B4) : avec une vidéo, une requête
  sans limite et une requête paginée coûtent la même chose. Le test a
  mesuré le réseau, pas la base de données. `BACKEND.md` §4 le dit
  lui-même dans ses réserves.
- **L'avalanche Realtime** (A4) : le test envoie des requêtes, il n'ouvre
  pas 200 applications qui se rechargent toutes au même instant.
- **Les écritures** (B5, B7) : le test est en lecture seule, comme indiqué
  dans `loadtest/README.md`.
- **Les quotas** : un test de 6 secondes a consommé 118 Mo, soit 2,3 % du
  quota mensuel de bande passante. Le test mesure la vitesse, pas
  l'endurance.

Autrement dit : **l'infrastructure n'est pas le problème.** Les problèmes
sont dans le code de l'application et dans les règles d'accès de la base.

---

# 7. Récapitulatif

**Avant la première invitation :**

| # | Point | Nature |
|---|---|---|
| A1 | Ajouter « mot de passe oublié » | code |
| ~~A2~~ | ~~Faire appliquer `is_private` / `hide_location` par la RLS~~ — **fait** le 17/09/2026 | base |
| A3 | Brancher le feed sur `get_feed` (déjà écrite et mesurée) | code |
| A4 | Retirer l'abonnement Realtime du feed | code |
| A5 | Passer au plan Pro, pour la sauvegarde | facturation |
| A6 | Configurer un SMTP réel + vérifier l'URL du site | console |
| B8 | Cocher « Leaked password protection » | console |

Soit **six points restants** sur les sept d'origine.

**Dans le mois qui suit :** B1 à B7, B9.

**Plus tard, ou jamais :** C1 à C4.

**Le plus important à comprendre** : cinq des sept points bloquants sont
des corrections dans l'application ou dans les règles d'accès, pas des
questions de puissance. Le travail serveur décrit dans `BACKEND.md` est
réel, mesuré, et solide — il n'est simplement **pas branché**. `get_feed`,
`search_athletes` et `increment_video_views_batch` existent, sont testées,
et l'application ne les appelle pas.

---

*Constat établi en lecture seule le 17 septembre 2026 : ni la base ni le
code n'ont été modifiés pendant l'analyse. Deux actions ont été menées
après coup, à la lecture du rapport — le `REINDEX` du point B6 et les
trois migrations de confidentialité du point A2 — dont l'état avant/après
est reporté ci-dessus. Le reste du document décrit toujours la situation
au 17 septembre 2026.*
