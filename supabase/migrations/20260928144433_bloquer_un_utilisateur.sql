-- Bloquer un utilisateur.
--
-- Le blocage est SYMÉTRIQUE dans ses effets : si A bloque B, ni A ni B ne
-- voient plus les vidéos, commentaires et messages de l'autre, et aucun des
-- deux ne peut plus suivre, écrire, commenter ou proposer à l'autre. Seul A
-- sait qu'il y a blocage, et seul A peut le lever.
--
-- Le profil reste lisible : le masquer casserait toutes les jointures qui
-- l'attendent (messages, commentaires, notifications) ; l'application
-- affiche à la place « Compte bloqué ».

create table public.blocked_users (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocked_users_pas_soi_meme check (blocker_id <> blocked_id)
);
create index blocked_users_blocked_idx on public.blocked_users (blocked_id);

alter table public.blocked_users enable row level security;

create policy blocked_users_select on public.blocked_users
  for select to authenticated using ((select auth.uid()) = blocker_id);
create policy blocked_users_insert on public.blocked_users
  for insert to authenticated with check ((select auth.uid()) = blocker_id);
create policy blocked_users_delete on public.blocked_users
  for delete to authenticated using ((select auth.uid()) = blocker_id);

grant select, insert, delete on public.blocked_users to authenticated;

-- Les comptes liés à l'utilisateur connecté par un blocage, dans un sens
-- comme dans l'autre. SECURITY DEFINER : la RLS ne laisse voir que ses
-- propres blocages, or il faut aussi ceux qui nous visent.
--
-- Rend un TABLEAU, pas un ensemble : les policies l'appellent sous la forme
-- `x <> all ((select public.ids_bloques())::uuid[])`, que Postgres évalue une
-- seule fois par requête (InitPlan) au lieu d'une fois par ligne. Le `::uuid[]`
-- est indispensable : sans lui, `all ((select …))` est lu comme une
-- sous-requête, qui compare alors un uuid à un tableau.
create or replace function public.ids_bloques()
returns uuid[]
language sql stable security definer
set search_path = ''
as $$
  select coalesce(array_agg(autre), '{}')
    from (
      select blocked_id as autre from public.blocked_users where blocker_id = (select auth.uid())
      union
      select blocker_id from public.blocked_users where blocked_id = (select auth.uid())
    ) t
$$;
-- anon l'exécute aussi (profils partagés ouverts sans compte) : sans
-- utilisateur connecté, le tableau est simplement vide.
grant execute on function public.ids_bloques() to anon, authenticated;

-- Bloquer rompt les abonnements dans les deux sens : sans quoi un profil
-- privé resterait ouvert à celui qu'on vient de bloquer.
create or replace function public.blocked_users_rompre_liens()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  delete from public.follows
   where (follower_id = new.blocker_id and following_id = new.blocked_id)
      or (follower_id = new.blocked_id and following_id = new.blocker_id);
  delete from public.shortlist
   where (recruiter_id = new.blocker_id and athlete_id = new.blocked_id)
      or (recruiter_id = new.blocked_id and athlete_id = new.blocker_id);
  return new;
end;
$$;

create trigger blocked_users_rompre_liens_trg
  after insert on public.blocked_users
  for each row execute function public.blocked_users_rompre_liens();

-- ── Lecture : ce qui vient de l'autre disparaît ──

drop policy videos_select on public.videos;
create policy videos_select on public.videos for select using (
  ((not author_is_private)
    or (user_id = (select auth.uid()))
    or exists (select 1 from public.follows f
                where f.follower_id = (select auth.uid()) and f.following_id = videos.user_id))
  and user_id <> all ((select public.ids_bloques())::uuid[])
);

drop policy comments_select on public.comments;
create policy comments_select on public.comments for select using (
  user_id <> all ((select public.ids_bloques())::uuid[])
);

drop policy messages_select on public.messages;
create policy messages_select on public.messages for select using (
  ((select auth.uid()) = sender_id or (select auth.uid()) = receiver_id)
  and sender_id   <> all ((select public.ids_bloques())::uuid[])
  and receiver_id <> all ((select public.ids_bloques())::uuid[])
);

-- ── Écriture : plus aucun contact ──

drop policy messages_insert on public.messages;
create policy messages_insert on public.messages for insert with check (
  (select auth.uid()) = sender_id
  and receiver_id <> all ((select public.ids_bloques())::uuid[])
);

drop policy follows_insert on public.follows;
create policy follows_insert on public.follows for insert with check (
  (select auth.uid()) = follower_id
  and following_id <> all ((select public.ids_bloques())::uuid[])
);

-- On ne commente qu'une vidéo qu'on a le droit de voir. La sous-requête
-- passe par la RLS de videos, qui écarte déjà les comptes bloqués (et les
-- comptes privés qu'on ne suit pas).
drop policy comments_insert on public.comments;
create policy comments_insert on public.comments for insert with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.videos v where v.id = comments.video_id)
);

drop policy proposals_insert on public.proposals;
create policy proposals_insert on public.proposals for insert with check (
  (select auth.uid()) = recruiter_id
  and athlete_id <> all ((select public.ids_bloques())::uuid[])
);

drop policy appointments_insert on public.appointments;
create policy appointments_insert on public.appointments for insert with check (
  (select auth.uid()) = recruiter_id
  and athlete_id <> all ((select public.ids_bloques())::uuid[])
);

-- ── Recherche ──
-- search_athletes est SECURITY DEFINER : la RLS ne s'y applique pas, le
-- filtre doit y être écrit. Il l'est AVANT le `limit` : filtrer la page
-- après coup rendrait une page courte, que l'application prend pour la
-- dernière. Seule la ligne marquée « blocage » change.
create or replace function public.search_athletes(
  p_query text default null, p_sport text default null, p_gender text default null,
  p_age_min integer default 14, p_age_max integer default 40,
  p_limit integer default 20, p_offset integer default 0,
  p_country text default null, p_region text default null, p_city text default null,
  p_nationality text default null, p_levels text[] default null,
  p_position_id text default null, p_include_recruiters boolean default false)
returns table(id uuid, full_name text, username text, avatar_url text, verified boolean,
  sport text, "position" text, position_id text, club text, organization text,
  is_recruiter boolean, role text, age integer, gender text, country text, region text,
  city text, nationality text, level text, followers_count integer, videos_count integer,
  match_source text)
language sql stable security definer
set search_path = ''
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
    and p.id <> all ((select public.ids_bloques())::uuid[])   -- blocage
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
