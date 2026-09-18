-- ═══════════════════════════════════════════════════════════════════
-- `search_athletes` ne connaissait que le texte, le sport, le genre et
-- l'âge. L'écran de recherche filtre en plus sur la localisation, la
-- nationalité, le niveau et le poste — et le faisait en JavaScript,
-- après coup.
--
-- POURQUOI CE N'EST PAS UN DÉTAIL. Filtrer APRÈS la pagination donne un
-- résultat faux : le serveur rend vingt lignes, le navigateur en écarte
-- dix-sept, l'écran en affiche trois et annonce implicitement qu'il n'y
-- en a pas d'autres. La page suivante repartirait de l'offset vingt, sans
-- rattraper les dix-sept écartées. Un recruteur verrait trois athlètes
-- là où il y en a cinquante, sans que rien ne le lui signale — c'est
-- exactement le défaut que les référentiels ont corrigé sur les postes.
--
-- Les filtres montent donc dans la fonction, où ils s'appliquent AVANT
-- le `limit`.
--
-- Note sur la localisation : `city`, `region` et `country` sont les
-- colonnes générées, donc masquées pour qui a coché « masquer ma
-- localisation ». Filtrer sur une ville écarte ces profils, ce qui est
-- cohérent : on ne peut pas être trouvé par un critère qu'on cache.
-- ═══════════════════════════════════════════════════════════════════

drop function if exists public.search_athletes(text, text, text, integer, integer, integer, integer);

create function public.search_athletes(
  p_query       text    default null,
  p_sport       text    default null,
  p_gender      text    default null,
  p_age_min     integer default 14,
  p_age_max     integer default 40,
  p_limit       integer default 20,
  p_offset      integer default 0,
  p_country     text    default null,
  p_region      text    default null,
  p_city        text    default null,
  p_nationality text    default null,
  p_levels      text[]  default null,
  p_position_id text    default null)
returns table(id uuid, full_name text, username text, avatar_url text, verified boolean,
              sport text, "position" text, position_id text, club text, age integer,
              gender text, country text, region text, city text, nationality text,
              level text, followers_count integer, videos_count integer,
              match_source text)
language sql
stable
security definer
set search_path to ''
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
    select p.id, 2
      from public.profiles p
     where p_query is not null and p_query <> ''
       and p.club is not null
       and public.search_key(p.club) like '%' || public.search_key(p_query) || '%'

    union all

    -- Branche 3/4 : le texte des vidéos. Le WHERE porte sur titre+description
    -- concaténés — c'est l'expression indexée, donc un Bitmap Index Scan.
    select v.user_id,
           case when public.search_key(coalesce(v.title, ''))
                     like '%' || public.search_key(p_query) || '%'
                then 3
                else 4
           end
      from public.videos v
     where p_query is not null and p_query <> ''
       and v.user_id is not null
       and public.search_key(coalesce(v.title, '') || ' ' || coalesce(v.description, ''))
           like '%' || public.search_key(p_query) || '%'
  ),

  -- DÉDOUBLONNAGE : un athlète avec trois vidéos correspondantes apparaît
  -- trois fois. MIN(rang) retient sa MEILLEURE justification.
  meilleure as (
    select athlete_id, min(rang) as rang
      from correspondances
     group by athlete_id
  )

  select
    p.id, p.full_name, p.username, p.avatar_url, p.verified,
    p.sport, p."position", p.position_id, p.club,
    case when p.birthdate is not null
         then extract(year from age(p.birthdate))::integer
         else p.age end as age,
    p.gender, p.country, p.region, p.city, p.nationality,
    p."level", p.followers_count, p.videos_count,
    case c.rang
      when 1 then 'nom'
      when 2 then 'club'
      when 3 then 'video_titre'
      when 4 then 'video_description'
      else null
    end as match_source
  from meilleure c
  join public.profiles p on p.id = c.athlete_id
  where
    p.is_recruiter = false
    -- SECURITY DEFINER contourne la RLS : l'exclusion des profils privés,
    -- qui serait sinon appliquée par la policy profiles_select, doit être
    -- écrite ici. Sans cette ligne, cette fonction rouvrirait la faille
    -- que la migration de confidentialité referme.
    and not coalesce(p.is_private, false)
    and (p_sport  is null or p.sport  = p_sport)
    and (p_gender is null or p.gender = p_gender)
    -- Filtre d'âge traduit en intervalle de dates : indexable.
    -- Comparer age(birthdate) interdirait tout usage d'index.
    and (
      p.birthdate is null
      or p.birthdate between (current_date - make_interval(years => p_age_max + 1))
                         and (current_date - make_interval(years => p_age_min))
    )
    -- Filtres remontés du navigateur. Même sémantique qu'avant :
    -- sous-chaîne, insensible à la casse et aux accents.
    and (p_country     is null or p_country     = '' or public.search_key(coalesce(p.country, ''))     like '%' || public.search_key(p_country) || '%')
    and (p_region      is null or p_region      = '' or public.search_key(coalesce(p.region, ''))      like '%' || public.search_key(p_region) || '%')
    and (p_city        is null or p_city        = '' or public.search_key(coalesce(p.city, ''))        like '%' || public.search_key(p_city) || '%')
    and (p_nationality is null or p_nationality = '' or public.search_key(coalesce(p.nationality, '')) like '%' || public.search_key(p_nationality) || '%')
    and (p_levels      is null or cardinality(p_levels) = 0 or p."level" = any (p_levels))
    and (p_position_id is null or p_position_id = '' or p.position_id = p_position_id)
  -- Le rang d'abord (pertinence), la popularité ensuite, l'id pour rendre le
  -- tri total — indispensable pour que la pagination par OFFSET soit stable.
  order by c.rang, p.followers_count desc, p.id
  limit least(greatest(p_limit, 1), 50)
  offset greatest(p_offset, 0);
$function$;

revoke execute on function public.search_athletes(text,text,text,integer,integer,integer,integer,text,text,text,text,text[],text) from public;
grant execute on function public.search_athletes(text,text,text,integer,integer,integer,integer,text,text,text,text,text[],text)
  to anon, authenticated, service_role;

comment on function public.search_athletes is
  'Recherche d''athlètes : texte (nom, club, titre et description de vidéo) et filtres structurés, tous appliqués avant la pagination. Exclut les profils privés.';
