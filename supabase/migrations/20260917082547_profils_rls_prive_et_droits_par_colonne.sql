-- ═══════════════════════════════════════════════════════════════════
-- Le cadenas « profil privé » devient réel, et les colonnes sensibles
-- cessent d'être lisibles par tout le monde.
--
-- État corrigé ici : la règle de lecture de `profiles` était
-- `using (true)` pour le rôle `public`. N'importe qui, même sans compte,
-- pouvait récupérer en une requête la date de naissance, le téléphone et
-- l'adresse de tous les profils — mineurs compris. Les réglages de
-- confidentialité n'étaient appliqués que par des filtres JavaScript,
-- donc contournables en appelant l'API directement.
--
-- Deux mécanismes, parce qu'aucun ne suffit seul :
--   RLS            masque les LIGNES des profils privés ;
--   GRANT colonne  masque les COLONNES que personne d'autre n'a à lire.
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Les profils privés disparaissent pour les autres ────────────
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to public
  using (
    not coalesce(is_private, false)
    or id = (select auth.uid())
    or (select public.is_admin())
  );

-- ── 2. Colonnes que personne d'autre n'a à lire ────────────────────
-- Il n'existe pas de « revoke une colonne » : on retire le droit de
-- lecture sur la table, puis on le redonne colonne par colonne.
--
-- birthdate                   la date de naissance ne sort jamais ; seul
--                             `age`, cache d'affichage masquable, sort.
-- phone                       n'est lu que par son propriétaire.
-- level_proof_url             pièce justificative (contrat, licence).
-- is_admin                    désigne les comptes à attaquer en premier.
-- *_private                   valeurs sources derrière le masquage.
-- permissions_asked,
-- age_last_reminded_at,
-- season_reminder_dismissed_at  état interne de l'application.
--
-- ATTENTION : toute colonne ajoutée plus tard à `profiles` sera
-- automatiquement lisible par la liste construite ci-dessous. Relire
-- cette migration avant d'ajouter une colonne sensible.
revoke select on public.profiles from anon, authenticated;

do $$
declare colonnes text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position)
    into colonnes
    from information_schema.columns
   where table_schema = 'public' and table_name = 'profiles'
     and column_name not in (
       'birthdate', 'phone', 'level_proof_url', 'is_admin',
       'permissions_asked', 'age_last_reminded_at', 'season_reminder_dismissed_at',
       'city_private', 'region_private', 'country_private', 'age_private'
     );
  execute format('grant select (%s) on public.profiles to anon, authenticated', colonnes);
  raise notice 'Colonnes lisibles : %', colonnes;
end $$;

-- ── 3. Son propre profil, en entier ────────────────────────────────
-- Les droits par colonne ne savent pas distinguer « ma ligne » des
-- autres : sans cette fonction, on ne pourrait plus lire sa propre date
-- de naissance ni son propre téléphone. Restreinte à auth.uid(), elle ne
-- peut renvoyer que la ligne de l'appelant.
create or replace function public.get_my_profile()
returns public.profiles
language sql
stable
security definer
set search_path to ''
as $$
  select p.* from public.profiles p where p.id = (select auth.uid());
$$;

revoke execute on function public.get_my_profile() from public, anon;
grant execute on function public.get_my_profile() to authenticated;

comment on function public.get_my_profile() is
  'Le profil complet de l''appelant, colonnes privées comprises. Ne peut renvoyer que sa propre ligne.';

-- ── 4. search_athletes lit birthdate : elle passe en SECURITY DEFINER
-- Elle filtre sur l'âge réel plutôt que sur le cache masquable, pour
-- qu'un athlète qui cache son âge reste trouvable par un recruteur qui
-- cherche sa tranche — sans que cet âge lui soit montré. Le `SET
-- search_path` est obligatoire dès lors qu'une fonction est SECURITY
-- DEFINER : sans lui, un objet glissé dans pg_temp détournerait ses
-- appels. Toutes les références sont déjà qualifiées par schéma.
--
-- Contrepartie de SECURITY DEFINER : la fonction ne passe plus par la
-- RLS, donc l'exclusion des profils privés doit être écrite à la main.
CREATE OR REPLACE FUNCTION public.search_athletes(
  p_query text DEFAULT NULL::text, p_sport text DEFAULT NULL::text,
  p_gender text DEFAULT NULL::text, p_age_min integer DEFAULT 14,
  p_age_max integer DEFAULT 40, p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, full_name text, username text, avatar_url text, verified boolean,
               sport text, "position" text, club text, age integer, gender text,
               followers_count integer, videos_count integer, match_source text)
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
      else null
    end as match_source
  from meilleure c
  join public.profiles p on p.id = c.athlete_id
  where
    p.is_recruiter = false
    -- SECURITY DEFINER contourne la RLS : l'exclusion des profils privés,
    -- qui serait sinon appliquée par la policy profiles_select, doit être
    -- écrite ici. Sans cette ligne, cette fonction rouvrirait la faille
    -- que la migration referme.
    and not coalesce(p.is_private, false)
    and (p_sport  is null or p.sport  = p_sport)
    and (p_gender is null or p.gender = p_gender)
    and (
      p.birthdate is null
      or p.birthdate between (current_date - make_interval(years => p_age_max + 1))
                         and (current_date - make_interval(years => p_age_min))
    )
  order by c.rang, p.followers_count desc, p.id
  limit least(greatest(p_limit, 1), 50)
  offset greatest(p_offset, 0);
$function$;

revoke execute on function public.search_athletes(text,text,text,integer,integer,integer,integer) from public;
grant execute on function public.search_athletes(text,text,text,integer,integer,integer,integer)
  to anon, authenticated, service_role;
