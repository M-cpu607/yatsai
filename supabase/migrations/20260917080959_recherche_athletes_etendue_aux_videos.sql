-- ============================================================================
-- Recherche libre d'athlètes étendue au texte des vidéos
-- ----------------------------------------------------------------------------
-- POURQUOI : jusqu'ici `search_athletes` ne regardait que `profiles.full_name`
-- et `profiles.club`. Un recruteur qui tape « marseille » ou « demi de mêlée »
-- ne trouvait donc personne, alors que l'information existe — mais dans le
-- titre ou la description des vidéos publiées par l'athlète. On élargit la
-- correspondance sans changer la sémantique de recherche déjà en place
-- (sous-chaîne, insensible à la casse et aux accents, via `search_key`).
-- ============================================================================


-- ── 1. Index trigramme sur le texte des vidéos ──────────────────────────────
--
-- POURQUOI un GIN trigramme, et pas un `tsvector` :
--
--   a) Cohérence. Le côté profil filtre avec `search_key(col) LIKE '%q%'` et
--      s'appuie sur `profiles_name_trgm_idx` / `profiles_club_trgm_idx`. Un
--      `tsvector` imposerait l'opérateur `@@` et une sémantique DIFFÉRENTE
--      (mots entiers) : « mars » cesserait de ramener « Marseille » côté
--      vidéo alors qu'il le fait côté nom. Une recherche libre qui se
--      comporte différemment selon la colonne interrogée est un piège.
--
--   b) Saisie incrémentale. L'interface cherche au fil de la frappe : les
--      préfixes et fragments (« marse », « velo ») doivent matcher. Le
--      trigramme le fait nativement, le `tsvector` non (sauf à passer par
--      `to_tsquery('mot:*')`, qui ne gère que les préfixes de mot).
--
--   c) Coût de migration nul. L'index porte sur une EXPRESSION : aucune
--      colonne générée à ajouter, donc aucune réécriture de `videos` (dont
--      le TOAST pèse déjà ~107 Mo à cause de `tracking_points`).
--
-- POURQUOI une seule expression concaténée plutôt que deux index (un par
-- colonne) : deux index obligeraient le planificateur à un BitmapOr, donc
-- deux parcours d'index et une union de bitmaps. Ici un seul parcours suffit.
-- Le séparateur ' ' évite de fabriquer des trigrammes parasites à la
-- jointure entre la fin du titre et le début de la description.
--
-- LIMITE CONNUE, assumée : une requête de moins de 3 caractères ne produit
-- aucun trigramme complet ; l'index ne peut alors pas filtrer et Postgres
-- retombe sur un parcours séquentiel. C'est déjà le cas côté profils. Si cela
-- devient gênant, c'est au front de n'interroger qu'à partir de 3 caractères.
--
-- NOTE D'EXPLOITATION : la table `videos` est aujourd'hui quasi vide, la
-- création est instantanée. Sur une table volumineuse, préférer
-- `CREATE INDEX CONCURRENTLY` hors migration pour ne pas bloquer les écritures.
create index if not exists videos_text_trgm_idx
  on public.videos
  using gin (
    public.search_key(coalesce(title, '') || ' ' || coalesce(description, ''))
    gin_trgm_ops
  );

comment on index public.videos_text_trgm_idx is
  'Recherche libre sur titre+description des vidéos (search_athletes). '
  'L''expression indexée doit rester STRICTEMENT identique à celle de la '
  'fonction, sinon le planificateur ne reconnaît plus l''index.';


-- ── 2. La fonction ──────────────────────────────────────────────────────────
--
-- Le type de retour gagne une colonne `match_source`, ce qui impose un DROP :
-- `CREATE OR REPLACE` refuse tout changement de type de retour. La colonne est
-- ajoutée EN FIN de liste, donc les appels qui sélectionnent des colonnes
-- nommées (cas de PostgREST / supabase-js) ne bougent pas.
drop function if exists public.search_athletes(text, text, text, integer, integer, integer, integer);

create function public.search_athletes(
  p_query   text    default null,
  p_sport   text    default null,
  p_gender  text    default null,
  p_age_min integer default 14,
  p_age_max integer default 40,
  p_limit   integer default 20,
  p_offset  integer default 0
)
returns table (
  id              uuid,
  full_name       text,
  username        text,
  avatar_url      text,
  verified        boolean,
  sport           text,
  "position"      text,
  club            text,
  age             integer,
  gender          text,
  followers_count integer,
  videos_count    integer,
  -- D'OÙ vient la correspondance : 'nom', 'club', 'video_titre',
  -- 'video_description', ou NULL quand aucune recherche texte n'est demandée.
  -- Sert à l'interface (« trouvé dans une vidéo ») et rend le tri lisible.
  match_source    text
)
language sql
stable
as $function$
  with correspondances as (
    -- POURQUOI une UNION ALL de branches plutôt qu'un gros OR : un OR qui
    -- mélange des prédicats sur `profiles` et un sous-select sur `videos` ne
    -- peut PAS être décomposé en parcours d'index ; Postgres retombe alors sur
    -- un filtre ligne à ligne, donc un seq scan. Chaque branche isolée porte,
    -- elle, sur une seule table et peut attaquer son propre index GIN.
    --
    -- Le `rang` encode la PRIORITÉ de la correspondance :
    --   0 = pas de recherche texte   1 = nom     2 = club
    --   3 = titre de vidéo           4 = description de vidéo
    -- Un nom qui matche vaut mieux qu'une description qui matche.

    -- Branche 0 : aucune recherche texte -> tout le monde est candidat.
    -- POURQUOI cette branche existe : elle permet de garder une jointure
    -- INTERNE plus bas. Avec un LEFT JOIN + `or p_query is null`, le
    -- planificateur serait obligé de balayer `profiles` en entier même quand
    -- la recherche ne ramène que deux athlètes. Ici, quand `p_query` est
    -- renseigné, cette branche est éliminée à l'exécution et la jointure est
    -- pilotée par le petit ensemble des athlètes trouvés.
    select p.id as athlete_id, 0 as rang
      from public.profiles p
     where p_query is null or p_query = ''

    union all

    -- Branche 1 : le nom. Utilise profiles_name_trgm_idx.
    select p.id, 1
      from public.profiles p
     where p_query is not null and p_query <> ''
       and public.search_key(p.full_name) like '%' || public.search_key(p_query) || '%'

    union all

    -- Branche 2 : le club. Le `club is not null` n'est pas cosmétique : sans
    -- lui, le planificateur ne peut pas prouver que la ligne appartient à
    -- profiles_club_trgm_idx, qui est un index PARTIEL (WHERE club IS NOT NULL).
    -- L'ancienne écriture, `search_key(coalesce(club,''))`, interdisait donc
    -- l'usage de cet index.
    select p.id, 2
      from public.profiles p
     where p_query is not null and p_query <> ''
       and p.club is not null
       and public.search_key(p.club) like '%' || public.search_key(p_query) || '%'

    union all

    -- Branche 3/4 : le texte des vidéos. Le WHERE porte sur titre+description
    -- concaténés — c'est l'expression indexée, donc un Bitmap Index Scan. Le
    -- CASE, lui, ne sert qu'à départager titre et description sur les quelques
    -- lignes déjà remontées : il n'est évalué qu'après le filtrage par l'index.
    select v.user_id,
           case when public.search_key(coalesce(v.title, ''))
                     like '%' || public.search_key(p_query) || '%'
                then 3    -- correspondance dans le titre
                else 4    -- donc forcément dans la description
           end
      from public.videos v
     where p_query is not null and p_query <> ''
       and v.user_id is not null
       and public.search_key(coalesce(v.title, '') || ' ' || coalesce(v.description, ''))
           like '%' || public.search_key(p_query) || '%'
  ),

  -- DÉDOUBLONNAGE. Un athlète avec trois vidéos correspondantes apparaît trois
  -- fois dans `correspondances`. Le GROUP BY le réduit à une ligne, et le
  -- MIN(rang) retient sa MEILLEURE justification (un match sur le titre
  -- l'emporte sur un match sur la description). Un simple DISTINCT ferait le
  -- dédoublonnage mais perdrait cette information de priorité.
  meilleure as (
    select athlete_id, min(rang) as rang
      from correspondances
     group by athlete_id
  )

  select
    p.id, p.full_name, p.username, p.avatar_url, p.verified,
    p.sport, p."position", p.club,
    case when p.birthdate is not null
         then extract(year from age(p.birthdate))::integer
         else p.age end as age,
    p.gender, p.followers_count, p.videos_count,
    case c.rang
      when 1 then 'nom'
      when 2 then 'club'
      when 3 then 'video_titre'
      when 4 then 'video_description'
      else null            -- rang 0 : pas de recherche texte
    end as match_source
  -- Jointure INTERNE et `meilleure` en table de gauche : c'est l'ensemble
  -- réduit (quelques athlètes) qui pilote l'accès à `profiles`.
  from meilleure c
  join public.profiles p on p.id = c.athlete_id
  where
    -- Filtrage des recruteurs APRÈS la correspondance : une vidéo peut
    -- appartenir à un recruteur, il ne doit pas remonter dans les athlètes.
    p.is_recruiter = false
    and (p_sport  is null or p.sport  = p_sport)
    and (p_gender is null or p.gender = p_gender)
    -- Filtre d'âge traduit en intervalle de dates : indexable.
    -- Comparer age(birthdate) interdirait tout usage d'index.
    and (
      p.birthdate is null
      or p.birthdate between (current_date - make_interval(years => p_age_max + 1))
                         and (current_date - make_interval(years => p_age_min))
    )
  -- Le rang d'abord (pertinence), la popularité ensuite, l'id pour rendre le
  -- tri total — indispensable pour que la pagination par OFFSET soit stable.
  -- Sans recherche texte, tous les rangs valent 0 : on retrouve exactement
  -- l'ordre de l'ancienne version.
  order by c.rang, p.followers_count desc, p.id
  limit least(greatest(p_limit, 1), 50)
  offset greatest(p_offset, 0);
$function$;

comment on function public.search_athletes(text, text, text, integer, integer, integer, integer) is
  'Recherche d''athlètes. La recherche libre (p_query) porte sur le nom, le '
  'club, et le titre / la description des vidéos de l''athlète. Résultats '
  'dédoublonnés, classés par origine de la correspondance '
  '(nom > club > titre de vidéo > description), puis par nombre d''abonnés.';

-- Le DROP a emporté les droits : on les remet à l'identique.
grant execute on function public.search_athletes(text, text, text, integer, integer, integer, integer)
  to anon, authenticated, service_role;
