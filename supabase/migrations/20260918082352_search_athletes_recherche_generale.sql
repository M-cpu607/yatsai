-- ═══════════════════════════════════════════════════════════════════
-- L'écran de recherche sert deux usages : la recherche d'athlètes du
-- recruteur, et la recherche générale, qui montre aussi les recruteurs
-- et les observateurs. La fonction n'en couvrait que le premier, ce qui
-- aurait laissé le second sur une requête sans limite.
--
-- `p_include_recruiters` lève le filtre `is_recruiter = false`. Par
-- défaut à `false` : les appels existants ne changent pas de résultat.
-- Le nom de la fonction reste `search_athletes` — le renommer casserait
-- l'historique des migrations pour un gain cosmétique — mais elle cherche
-- désormais dans tous les profils quand on le lui demande.
--
-- `organization` et `is_recruiter` s'ajoutent au retour : la carte de
-- résultat les affiche, et sans eux un recruteur trouvé apparaîtrait
-- comme un athlète sans club.
-- ═══════════════════════════════════════════════════════════════════

drop function if exists public.search_athletes(text,text,text,integer,integer,integer,integer,text,text,text,text,text[],text);

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
  p_position_id text    default null,
  p_include_recruiters boolean default false)
returns table(id uuid, full_name text, username text, avatar_url text, verified boolean,
              sport text, "position" text, position_id text, club text, organization text,
              is_recruiter boolean, role text, age integer,
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
    -- Le `rang` encode la PRIORITÉ : 0 pas de texte, 1 nom, 2 club,
    -- 3 titre de vidéo, 4 description de vidéo.
    select p.id as athlete_id, 0 as rang
      from public.profiles p
     where p_query is null or p_query = ''

    union all

    select p.id, 1
      from public.profiles p
     where p_query is not null and p_query <> ''
       and public.search_key(p.full_name) like '%' || public.search_key(p_query) || '%'

    union all

    -- Le `club is not null` n'est pas cosmétique : sans lui, le planificateur
    -- ne peut pas prouver l'appartenance à profiles_club_trgm_idx, index
    -- PARTIEL (WHERE club IS NOT NULL).
    select p.id, 2
      from public.profiles p
     where p_query is not null and p_query <> ''
       and p.club is not null
       and public.search_key(p.club) like '%' || public.search_key(p_query) || '%'

    union all

    -- Le WHERE porte sur titre+description concaténés : c'est l'expression
    -- indexée, donc un Bitmap Index Scan. Le CASE ne départage que les
    -- quelques lignes déjà remontées.
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

  -- Un athlète avec trois vidéos correspondantes apparaît trois fois.
  -- MIN(rang) le réduit à une ligne portant sa MEILLEURE justification.
  meilleure as (
    select athlete_id, min(rang) as rang
      from correspondances
     group by athlete_id
  )

  select
    p.id, p.full_name, p.username, p.avatar_url, p.verified,
    p.sport, p."position", p.position_id, p.club, p.organization,
    p.is_recruiter, p."role",
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
    (p_include_recruiters or p.is_recruiter = false)
    -- SECURITY DEFINER contourne la RLS : l'exclusion des profils privés,
    -- qui serait sinon appliquée par la policy profiles_select, doit être
    -- écrite ici. Sans cette ligne, cette fonction rouvrirait la faille
    -- que la migration de confidentialité referme.
    and not coalesce(p.is_private, false)
    and (p_sport  is null or p.sport  = p_sport)
    and (p_gender is null or p.gender = p_gender)
    -- Filtre d'âge traduit en intervalle de dates : indexable. Comparer
    -- age(birthdate) interdirait tout usage d'index.
    and (
      p.birthdate is null
      or p.birthdate between (current_date - make_interval(years => p_age_max + 1))
                         and (current_date - make_interval(years => p_age_min))
    )
    and (p_country     is null or p_country     = '' or public.search_key(coalesce(p.country, ''))     like '%' || public.search_key(p_country) || '%')
    and (p_region      is null or p_region      = '' or public.search_key(coalesce(p.region, ''))      like '%' || public.search_key(p_region) || '%')
    and (p_city        is null or p_city        = '' or public.search_key(coalesce(p.city, ''))        like '%' || public.search_key(p_city) || '%')
    and (p_nationality is null or p_nationality = '' or public.search_key(coalesce(p.nationality, '')) like '%' || public.search_key(p_nationality) || '%')
    and (p_levels      is null or cardinality(p_levels) = 0 or p."level" = any (p_levels))
    and (p_position_id is null or p_position_id = '' or p.position_id = p_position_id)
  -- Le rang d'abord (pertinence), la popularité ensuite, l'id pour rendre le
  -- tri total : sans lui, la pagination par OFFSET n'est pas stable.
  order by c.rang, p.followers_count desc, p.id
  limit least(greatest(p_limit, 1), 50)
  offset greatest(p_offset, 0);
$function$;

revoke execute on function public.search_athletes(text,text,text,integer,integer,integer,integer,text,text,text,text,text[],text,boolean) from public;
grant execute on function public.search_athletes(text,text,text,integer,integer,integer,integer,text,text,text,text,text[],text,boolean)
  to anon, authenticated, service_role;

comment on function public.search_athletes is
  'Recherche de profils : texte (nom, club, titre et description de vidéo) et filtres structurés, tous appliqués AVANT la pagination. Exclut les profils privés. p_include_recruiters élargit aux recruteurs et observateurs.';
