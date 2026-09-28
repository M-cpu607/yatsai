-- Accord parental sous 15 ans.
--
-- À partir de 15 ans, on s'inscrit seul. En dessous, le compte existe mais
-- reste INACTIF tant qu'un parent n'a pas confirmé : ni publication, ni
-- message (envoyé ou reçu), ni commentaire, ni proposition de recruteur, et
-- le profil n'apparaît pas dans la recherche.
--
-- Le parent confirme par un lien secret que l'enfant lui transmet (aucun
-- service d'envoi d'e-mails n'est branché). Le lien ouvre la page publique
-- de l'application, qui appelle confirmer_accord_parental sans compte.
--
-- « Moins de 15 ans » se calcule à partir de la date de naissance à chaque
-- appel : le jour de ses 15 ans, le compte se débloque sans rien faire.

alter table public.profiles add column parental_consent_at timestamptz;
-- Pas de GRANT SELECT : lue par get_my_profile uniquement.

create table public.parental_consents (
  child_id uuid primary key references public.profiles(id) on delete cascade,
  -- Le secret du lien. uuid v4 : 122 bits d'aléa, impossible à deviner.
  token uuid not null unique default gen_random_uuid(),
  parent_name text not null check (length(btrim(parent_name)) between 2 and 120),
  parent_email text not null check (parent_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  requested_at timestamptz not null default now(),
  granted_at timestamptz,
  granted_by_name text
);
-- RLS sans aucune policy : la table n'est lisible et modifiable que par les
-- fonctions ci-dessous.
alter table public.parental_consents enable row level security;

-- Vrai si ce compte a moins de 15 ans et pas d'accord parental.
create or replace function public.sans_accord_parental(p_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select coalesce((
    select p.birthdate > (current_date - interval '15 years')
           and p.parental_consent_at is null
      from public.profiles p where p.id = p_id
  ), false)
$$;
grant execute on function public.sans_accord_parental(uuid) to anon, authenticated;

-- L'enfant désigne son parent ; rend le secret du lien à lui transmettre.
-- Rappeler la fonction corrige le nom ou l'adresse sans changer le lien.
create or replace function public.demander_accord_parental(p_parent_nom text, p_parent_email text)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  jeton uuid;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Connexion requise.';
  end if;
  if not public.sans_accord_parental(auth.uid()) then
    raise exception using errcode = 'P0001', message = 'Ce compte n''a pas besoin d''accord parental.';
  end if;
  if length(btrim(coalesce(p_parent_nom, ''))) < 2 then
    raise exception using errcode = 'P0001', message = 'Indique le nom de ton parent.';
  end if;
  if btrim(coalesce(p_parent_email, '')) !~*'^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception using errcode = 'P0001', message = 'Cette adresse e-mail n''est pas valide.';
  end if;
  insert into public.parental_consents (child_id, parent_name, parent_email)
  values (auth.uid(), btrim(p_parent_nom), lower(btrim(p_parent_email)))
  on conflict (child_id) do update
     set parent_name = excluded.parent_name,
         parent_email = excluded.parent_email,
         requested_at = now()
  returning token into jeton;
  return jeton;
end;
$$;
revoke execute on function public.demander_accord_parental(text, text) from public, anon;
grant execute on function public.demander_accord_parental(text, text) to authenticated;

-- Pour l'écran d'attente de l'enfant : sa demande en cours, s'il en a une.
create or replace function public.mon_accord_parental()
returns table(token uuid, parent_name text, parent_email text, requested_at timestamptz)
language sql stable security definer
set search_path = ''
as $$
  select c.token, c.parent_name, c.parent_email, c.requested_at
    from public.parental_consents c
   where c.child_id = (select auth.uid())
$$;
revoke execute on function public.mon_accord_parental() from public, anon;
grant execute on function public.mon_accord_parental() to authenticated;

-- Pour la page du parent, ouverte sans compte : le strict nécessaire pour
-- savoir de qui il s'agit. Rien si le lien est faux.
create or replace function public.infos_accord_parental(p_token uuid)
returns table(prenom text, age integer, sport text, parent_name text, deja_donne boolean)
language sql stable security definer
set search_path = ''
as $$
  select split_part(btrim(p.full_name), ' ', 1),
         extract(year from age(p.birthdate))::integer,
         p.sport,
         c.parent_name,
         c.granted_at is not null
    from public.parental_consents c
    join public.profiles p on p.id = c.child_id
   where c.token = p_token
$$;
grant execute on function public.infos_accord_parental(uuid) to anon, authenticated;

create or replace function public.confirmer_accord_parental(p_token uuid, p_nom text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  enfant uuid;
begin
  if length(btrim(coalesce(p_nom, ''))) < 2 then
    raise exception using errcode = 'P0001', message = 'Indiquez votre nom.';
  end if;
  update public.parental_consents
     set granted_at = coalesce(granted_at, now()),
         granted_by_name = coalesce(granted_by_name, btrim(p_nom))
   where token = p_token
  returning child_id into enfant;
  if enfant is null then
    raise exception using errcode = 'P0001', message = 'Ce lien n''est pas valide. Demandez-en un nouveau à votre enfant.';
  end if;
  update public.profiles
     set parental_consent_at = coalesce(parental_consent_at, now())
   where id = enfant;
end;
$$;
grant execute on function public.confirmer_accord_parental(uuid, text) to anon, authenticated;

-- ── Colonnes que l'application ne peut pas écrire elle-même ──
-- La date de naissance ne se change plus une fois posée : sans quoi un
-- enfant de 12 ans se vieillirait d'un geste pour lever le blocage.
create or replace function public.profiles_proteger_colonnes_systeme()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.terms_accepted_at   := old.terms_accepted_at;
    new.terms_version       := old.terms_version;
    new.parental_consent_at := old.parental_consent_at;
    if old.birthdate is not null then
      new.birthdate := old.birthdate;
    end if;
  end if;
  return new;
end;
$$;

-- ── Ce qu'un compte sans accord ne peut pas faire ──

drop policy messages_insert on public.messages;
create policy messages_insert on public.messages for insert with check (
  (select auth.uid()) = sender_id
  and receiver_id <> all ((select public.ids_bloques())::uuid[])
  and not public.sans_accord_parental(sender_id)
  and not public.sans_accord_parental(receiver_id)
);

drop policy comments_insert on public.comments;
create policy comments_insert on public.comments for insert with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.videos v where v.id = comments.video_id)
  and not public.sans_accord_parental(user_id)
);

drop policy proposals_insert on public.proposals;
create policy proposals_insert on public.proposals for insert with check (
  (select auth.uid()) = recruiter_id
  and athlete_id <> all ((select public.ids_bloques())::uuid[])
  and not public.sans_accord_parental(athlete_id)
);

drop policy appointments_insert on public.appointments;
create policy appointments_insert on public.appointments for insert with check (
  (select auth.uid()) = recruiter_id
  and athlete_id <> all ((select public.ids_bloques())::uuid[])
  and not public.sans_accord_parental(athlete_id)
);

create or replace function public.videos_garde_publication()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  deja integer;
  quota integer := public.quota_publications_par_jour();
begin
  if public.sans_accord_parental(new.user_id) then
    raise exception using errcode = 'P0001',
      message = 'Ton compte attend l''accord de ton parent. Tu pourras publier dès qu''il l''aura donné.';
  end if;

  -- Durée. Une seconde de tolérance : un téléphone qui filme « 30 secondes »
  -- produit souvent 30,03 s, que l'application arrondit à 30 ou 31.
  if new.video_url is not null then
    if new.duration_seconds is null then
      raise exception using errcode = 'P0001',
        message = 'La durée de la vidéo n''a pas pu être lue. Réessaie avec une autre vidéo.';
    end if;
    if new.duration_seconds > 31 then
      raise exception using errcode = 'P0001',
        message = format('Une vidéo dure 30 secondes au plus (celle-ci : %s s).', new.duration_seconds);
    end if;
  end if;

  -- Quota du jour. SECURITY DEFINER : le comptage ne doit pas dépendre de ce
  -- que la RLS laisse voir à l'auteur.
  select count(*) into deja
    from public.videos
   where user_id = new.user_id
     and created_at >= public.debut_du_jour_paris();
  if deja >= quota then
    raise exception using errcode = 'P0001',
      message = format('Limite atteinte : %s vidéos par jour. Tu pourras publier à nouveau demain.', quota);
  end if;

  return new;
end;
$$;

-- ── Recherche ──
-- Même fonction que dans la migration du blocage, plus une ligne : les
-- comptes de moins de 15 ans sans accord n'y apparaissent pas.
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
    -- Moins de 15 ans sans accord parental : invisible.
    and not coalesce(p.birthdate > (current_date - interval '15 years') and p.parental_consent_at is null, false)
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
