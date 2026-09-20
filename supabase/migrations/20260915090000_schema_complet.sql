-- ═══════════════════════════════════════════════════════════════════
-- SCOLYMPIA — schéma complet, extrait du projet Supabase distant
-- (uvsxteuhqqfgbmdgabfo, PostgreSQL 17.6) le 15/09/2026.
--
-- Rejoue à l'identique la base de production sur une pile Supabase
-- locale. Voir supabase/README.md pour la mise en route.
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists pg_trgm  with schema extensions;
create extension if not exists unaccent with schema extensions;

-- ── TABLES ─────────────────────────────────────────────────────────
create table if not exists public.applications (
  id uuid not null default gen_random_uuid(),
  athlete_id uuid not null,
  recruiter_id uuid not null,
  message text,
  sport text,
  status text not null default 'sent'::text,
  created_at timestamp with time zone not null default now(),
  viewed_at timestamp with time zone,
  video_ids uuid[] not null default '{}'::uuid[],
  decided_at timestamp with time zone);

create table if not exists public.appointments (
  id uuid not null default gen_random_uuid(),
  recruiter_id uuid not null,
  athlete_id uuid not null,
  starts_at timestamp with time zone not null,
  location text,
  note text,
  status text not null default 'proposed'::text,
  created_at timestamp with time zone default now(),
  decided_at timestamp with time zone);

create table if not exists public.certification_requests (
  id uuid not null default gen_random_uuid(),
  recruiter_id uuid not null,
  motivation text,
  status text not null default 'pending'::text,
  created_at timestamp with time zone not null default now(),
  decided_at timestamp with time zone,
  admin_notes text);

create table if not exists public.comments (
  id uuid not null default gen_random_uuid(),
  video_id uuid not null,
  user_id uuid not null,
  body text not null,
  created_at timestamp with time zone not null default now());

create table if not exists public.follows (
  follower_id uuid not null,
  following_id uuid not null,
  created_at timestamp with time zone default now());

create table if not exists public.likes (
  user_id uuid not null,
  video_id uuid not null,
  created_at timestamp with time zone default now());

create table if not exists public.messages (
  id uuid not null default gen_random_uuid(),
  sender_id uuid,
  receiver_id uuid,
  content text not null,
  read boolean default false,
  created_at timestamp with time zone default now(),
  video_id uuid);

create table if not exists public.notes (
  id uuid not null default gen_random_uuid(),
  recruiter_id uuid,
  athlete_id uuid,
  body text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone,
  shared_with uuid[] not null default '{}'::uuid[]);

create table if not exists public.notifications (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  actor_id uuid,
  type text not null,
  target_type text,
  target_id uuid,
  body text,
  read boolean not null default false,
  created_at timestamp with time zone not null default now());

create table if not exists public.profiles (
  id uuid not null,
  username text,
  full_name text,
  age integer,
  sport text,
  "position" text,
  club text,
  bio text,
  avatar_url text,
  is_recruiter boolean default false,
  organization text,
  verified boolean default false,
  created_at timestamp with time zone default now(),
  banner_url text,
  country text,
  region text,
  city text,
  gender text,
  nationality text,
  level text,
  has_club boolean,
  permissions_asked boolean not null default false,
  recruiting_gender text,
  recruiting_levels text[] default '{}'::text[],
  recruiting_age_min integer,
  recruiting_age_max integer,
  age_last_reminded_at timestamp with time zone,
  is_private boolean not null default false,
  hide_age boolean not null default false,
  hide_location boolean not null default false,
  messaging_pref text not null default 'all'::text,
  season_reminder_dismissed_at timestamp with time zone,
  social_links jsonb not null default '{}'::jsonb,
  level_proof_url text,
  level_proof_status text default 'none'::text,
  role text default 'athlete'::text,
  birthdate date,
  phone text,
  season_start_month integer default 9,
  is_admin boolean default false,
  followers_count integer not null default 0,
  following_count integer not null default 0,
  videos_count integer not null default 0);

create table if not exists public.proposals (
  id uuid not null default gen_random_uuid(),
  recruiter_id uuid not null,
  athlete_id uuid not null,
  message text,
  sport text,
  video_ids uuid[] default '{}'::uuid[],
  status text not null default 'sent'::text,
  created_at timestamp with time zone default now(),
  viewed_at timestamp with time zone,
  decided_at timestamp with time zone);

create table if not exists public.reports (
  id uuid not null default gen_random_uuid(),
  reporter_id uuid not null,
  target_type text not null,
  target_id uuid not null,
  reason text not null,
  description text,
  status text not null default 'pending'::text,
  created_at timestamp with time zone not null default now());

create table if not exists public.saved_videos (
  user_id uuid not null,
  video_id uuid not null,
  created_at timestamp with time zone not null default now());

create table if not exists public.shares (
  id uuid not null default gen_random_uuid(),
  video_id uuid not null,
  user_id uuid not null,
  shared_with_id uuid,
  channel text not null default 'external'::text,
  created_at timestamp with time zone not null default now());

create table if not exists public.shortlist (
  recruiter_id uuid not null,
  athlete_id uuid not null,
  created_at timestamp with time zone default now(),
  status text not null default 'en_attente'::text);

create table if not exists public.signed_posts (
  id uuid not null default gen_random_uuid(),
  recruiter_id uuid not null,
  athlete_id uuid,
  image_url text not null,
  caption text,
  created_at timestamp with time zone not null default now());

create table if not exists public.signing_confirmations (
  id uuid not null default gen_random_uuid(),
  recruiter_id uuid not null,
  athlete_id uuid not null,
  status text not null default 'pending'::text,
  recruiter_message text,
  athlete_reply text,
  created_at timestamp with time zone not null default now(),
  decided_at timestamp with time zone);

create table if not exists public.sponsor_settings (
  id integer not null default 1,
  first_slot integer not null default 5,
  slot_interval integer not null default 9,
  max_per_session integer not null default 3);

create table if not exists public.sponsored_posts (
  id uuid not null default gen_random_uuid(),
  advertiser_name text not null,
  title text,
  body text,
  image_url text,
  link_url text,
  active boolean not null default true,
  starts_at timestamp with time zone not null default now(),
  ends_at timestamp with time zone,
  impressions_count bigint not null default 0,
  clicks_count bigint not null default 0,
  created_at timestamp with time zone not null default now());

create table if not exists public.sports (
  id text not null,
  label text not null,
  icon text not null,
  sort_order smallint not null default 0);

create table if not exists public.videos (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  youtube_url text,
  title text,
  sport text,
  "position" text,
  description text,
  views integer default 0,
  created_at timestamp with time zone default now(),
  video_url text,
  thumbnail_url text,
  duration_seconds numeric,
  video_type text,
  championship text,
  age_category text,
  city text,
  region text,
  country text,
  tracking_points jsonb,
  tracking_color text,
  tracking_shape text,
  tracking_size real,
  needs_review boolean default false,
  level text,
  ai_sport_detected boolean,
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  saves_count integer not null default 0);

-- ══════════════════════════════════════════════════════════════════
-- FONCTIONS  (avant les index : profiles_name_trgm_idx dépend de
-- search_key(), qui dépend elle-même de immutable_unaccent())
-- ══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT
 SET search_path TO ''
AS $function$ select extensions.unaccent('extensions.unaccent'::regdictionary, $1) $function$;

CREATE OR REPLACE FUNCTION public.search_key(text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT
 SET search_path TO ''
AS $function$ select lower(public.immutable_unaccent($1)) $function$;

CREATE OR REPLACE FUNCTION public.uuid_generate_v7()
 RETURNS uuid
 LANGUAGE sql
 PARALLEL SAFE
 SET search_path TO ''
AS $function$
  select encode(
    set_bit(
      set_bit(
        overlay(
          uuid_send(gen_random_uuid())
          placing substring(
            int8send(floor(extract(epoch from clock_timestamp()) * 1000)::bigint)
            from 3
          )
          from 1 for 6
        ),
        52, 1
      ),
      53, 1
    ),
    'hex'
  )::uuid;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false)
$function$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;

-- ── Chemin chaud : feed et recherche ──────────────────────────────

CREATE OR REPLACE FUNCTION public.get_feed(p_limit integer DEFAULT 20, p_cursor_created_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_cursor_id uuid DEFAULT NULL::uuid, p_sport text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, title text, youtube_url text, thumbnail_url text, sport text, "position" text, description text, level text, views integer, likes_count integer, comments_count integer, saves_count integer, created_at timestamp with time zone, author_id uuid, author_name text, author_username text, author_avatar text, author_verified boolean, author_club text, author_age integer, author_gender text, viewer_liked boolean, viewer_saved boolean)
 LANGUAGE sql
 STABLE
AS $function$
  select
    v.id, v.title, v.youtube_url, v.thumbnail_url,
    v.sport, v."position", v.description, v."level",
    v.views, v.likes_count, v.comments_count, v.saves_count, v.created_at,
    p.id, p.full_name, p.username, p.avatar_url, p.verified, p.club,
    case when p.birthdate is not null
         then extract(year from age(p.birthdate))::integer
         else p.age end,
    p.gender,
    l.user_id is not null,
    s.user_id is not null
  from public.videos v
  join public.profiles p on p.id = v.user_id
  left join public.likes        l on l.video_id = v.id and l.user_id = (select auth.uid())
  left join public.saved_videos s on s.video_id = v.id and s.user_id = (select auth.uid())
  -- Toujours présent => toujours une condition d'index.
  where (v.created_at, v.id) < (
          coalesce(p_cursor_created_at, 'infinity'::timestamptz),
          coalesce(p_cursor_id, 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid)
        )
    -- Ce OR-ci est sans danger : le curseur pilote déjà l'index,
    -- le filtre sport ne s'applique qu'aux lignes déjà remontées.
    and (p_sport is null or v.sport = p_sport)
  order by v.created_at desc, v.id desc
  limit least(greatest(p_limit, 1), 50);
$function$;

CREATE OR REPLACE FUNCTION public.search_athletes(p_query text DEFAULT NULL::text, p_sport text DEFAULT NULL::text, p_gender text DEFAULT NULL::text, p_age_min integer DEFAULT 14, p_age_max integer DEFAULT 40, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, full_name text, username text, avatar_url text, verified boolean, sport text, "position" text, club text, age integer, gender text, followers_count integer, videos_count integer)
 LANGUAGE sql
 STABLE
AS $function$
  select
    p.id, p.full_name, p.username, p.avatar_url, p.verified,
    p.sport, p."position", p.club,
    case when p.birthdate is not null
         then extract(year from age(p.birthdate))::integer
         else p.age end as age,
    p.gender, p.followers_count, p.videos_count
  from public.profiles p
  where p.is_recruiter = false
    and (p_sport  is null or p.sport  = p_sport)
    and (p_gender is null or p.gender = p_gender)
    -- Filtre d'âge traduit en intervalle de dates : indexable.
    -- Comparer age(birthdate) interdirait tout usage d'index.
    and (
      p.birthdate is null
      or p.birthdate between (current_date - make_interval(years => p_age_max + 1))
                         and (current_date - make_interval(years => p_age_min))
    )
    and (
      p_query is null or p_query = ''
      or public.search_key(p.full_name) like '%' || public.search_key(p_query) || '%'
      or public.search_key(coalesce(p.club, '')) like '%' || public.search_key(p_query) || '%'
    )
  order by p.followers_count desc, p.id
  limit least(greatest(p_limit, 1), 50)
  offset greatest(p_offset, 0);
$function$;

-- ── Compteurs de vues ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.increment_video_views(p_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  update public.videos set views = coalesce(views, 0) + 1 where id = p_id;
$function$;

CREATE OR REPLACE FUNCTION public.increment_video_views_batch(p_video_ids uuid[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if p_video_ids is null or array_length(p_video_ids, 1) is null then
    return;
  end if;
  if array_length(p_video_ids, 1) > 100 then
    raise exception 'Lot trop volumineux : 100 vidéos maximum par appel';
  end if;

  update public.videos v
     set views = coalesce(v.views, 0) + agg.n
    from (select vid, count(*)::integer as n from unnest(p_video_ids) as vid group by vid) agg
   where v.id = agg.vid;
end $function$;

CREATE OR REPLACE FUNCTION public.record_sponsored_click(p_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  UPDATE public.sponsored_posts SET clicks_count = clicks_count + 1 WHERE id = p_id;
$function$;

CREATE OR REPLACE FUNCTION public.record_sponsored_impression(p_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  UPDATE public.sponsored_posts SET impressions_count = impressions_count + 1 WHERE id = p_id;
$function$;

-- ── Compteurs dénormalisés ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_video_likes_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if tg_op = 'INSERT' then
    update public.videos set likes_count = likes_count + 1 where id = new.video_id;
  else
    update public.videos set likes_count = greatest(likes_count - 1, 0) where id = old.video_id;
  end if;
  return null;
end $function$;

CREATE OR REPLACE FUNCTION public.sync_video_comments_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if tg_op = 'INSERT' then
    update public.videos set comments_count = comments_count + 1 where id = new.video_id;
  else
    update public.videos set comments_count = greatest(comments_count - 1, 0) where id = old.video_id;
  end if;
  return null;
end $function$;

CREATE OR REPLACE FUNCTION public.sync_video_saves_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if tg_op = 'INSERT' then
    update public.videos set saves_count = saves_count + 1 where id = new.video_id;
  else
    update public.videos set saves_count = greatest(saves_count - 1, 0) where id = old.video_id;
  end if;
  return null;
end $function$;

CREATE OR REPLACE FUNCTION public.sync_follow_counts()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if tg_op = 'INSERT' then
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
    update public.profiles set followers_count = followers_count + 1 where id = new.following_id;
  else
    update public.profiles set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
    update public.profiles set followers_count = greatest(followers_count - 1, 0) where id = old.following_id;
  end if;
  return null;
end $function$;

CREATE OR REPLACE FUNCTION public.sync_profile_videos_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if tg_op = 'INSERT' then
    update public.profiles set videos_count = videos_count + 1 where id = new.user_id;
  else
    update public.profiles set videos_count = greatest(videos_count - 1, 0) where id = old.user_id;
  end if;
  return null;
end $function$;

CREATE OR REPLACE FUNCTION public.reconcile_counters()
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with v as (
    update public.videos v set
      likes_count    = (select count(*) from public.likes        l where l.video_id = v.id),
      comments_count = (select count(*) from public.comments     c where c.video_id = v.id),
      saves_count    = (select count(*) from public.saved_videos s where s.video_id = v.id)
    returning 1
  )
  update public.profiles p set
    followers_count = (select count(*) from public.follows f where f.following_id = p.id),
    following_count = (select count(*) from public.follows f where f.follower_id  = p.id),
    videos_count    = (select count(*) from public.videos  vv where vv.user_id    = p.id);
$function$;

-- ── Création du profil à l'inscription ────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  insert into public.profiles (
    id, full_name, username, is_recruiter, role,
    gender, age, birthdate, nationality, sport, position, club, organization,
    level, has_club, country, region, city,
    recruiting_gender, recruiting_levels, recruiting_age_min, recruiting_age_max
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Nouvel utilisateur'),
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce((new.raw_user_meta_data->>'is_recruiter')::boolean, false),
    coalesce(new.raw_user_meta_data->>'role',
             case when (new.raw_user_meta_data->>'is_recruiter')::boolean then 'recruiter' else 'athlete' end),
    new.raw_user_meta_data->>'gender',
    nullif(new.raw_user_meta_data->>'age', '')::int,
    nullif(new.raw_user_meta_data->>'birthdate', '')::date,
    new.raw_user_meta_data->>'nationality',
    new.raw_user_meta_data->>'sport',
    new.raw_user_meta_data->>'position',
    new.raw_user_meta_data->>'club',
    new.raw_user_meta_data->>'organization',
    new.raw_user_meta_data->>'level',
    nullif(new.raw_user_meta_data->>'has_club', '')::boolean,
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'region',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'recruiting_gender',
    case
      when new.raw_user_meta_data->>'recruiting_levels' is not null
      then string_to_array(new.raw_user_meta_data->>'recruiting_levels', ',')
      else '{}'::text[]
    end,
    nullif(new.raw_user_meta_data->>'recruiting_age_min', '')::int,
    nullif(new.raw_user_meta_data->>'recruiting_age_max', '')::int
  );
  return new;
end;
$function$;

-- ── Modération ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.protect_ai_sport_flag()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.ai_sport_detected IS DISTINCT FROM OLD.ai_sport_detected THEN
    IF NOT public.is_admin() THEN
      NEW.ai_sport_detected := OLD.ai_sport_detected;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_shortlist_on_signing_decision()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- N'agit que sur les transitions pending -> confirmed/refused
  IF OLD.status = 'pending' AND NEW.status IN ('confirmed', 'refused') THEN
    -- Marque la date de décision si pas déjà set
    IF NEW.decided_at IS NULL THEN
      NEW.decided_at := now();
    END IF;

    -- Met à jour la shortlist du recruteur côté serveur (bypasse la RLS)
    UPDATE public.shortlist
    SET status = CASE
      WHEN NEW.status = 'confirmed' THEN 'signe'
      ELSE 'essai_termine'
    END
    WHERE recruiter_id = NEW.recruiter_id
      AND athlete_id = NEW.athlete_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- ── Notifications ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_on_comment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_owner uuid;
  v_actor_name text;
  v_video_title text;
BEGIN
  SELECT user_id, title INTO v_owner, v_video_title FROM public.videos WHERE id = NEW.video_id;
  IF v_owner IS NULL OR v_owner = NEW.user_id THEN RETURN NEW; END IF;
  SELECT full_name INTO v_actor_name FROM public.profiles WHERE id = NEW.user_id;
  INSERT INTO public.notifications (user_id, actor_id, type, target_type, target_id, body)
  VALUES (
    v_owner, NEW.user_id, 'comment', 'video', NEW.video_id,
    COALESCE(v_actor_name, 'Quelqu''un') || ' a commenté ta vidéo « ' || COALESCE(v_video_title, '…') || ' »'
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_like()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_owner uuid; v_actor_name text; v_video_title text;
begin
  select user_id, title into v_owner, v_video_title from public.videos where id = NEW.video_id;
  if v_owner is null or v_owner = NEW.user_id then return NEW; end if;
  select full_name into v_actor_name from public.profiles where id = NEW.user_id;
  insert into public.notifications (user_id, actor_id, type, target_type, target_id, body)
  values (v_owner, NEW.user_id, 'like', 'video', NEW.video_id,
    coalesce(v_actor_name, 'Quelqu''un') || ' a aimé ta vidéo « ' || coalesce(v_video_title, '…') || ' »');
  return NEW;
end $function$;

CREATE OR REPLACE FUNCTION public.notify_on_follow()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_actor_name text;
begin
  if NEW.following_id is null or NEW.following_id = NEW.follower_id then return NEW; end if;
  select full_name into v_actor_name from public.profiles where id = NEW.follower_id;
  insert into public.notifications (user_id, actor_id, type, target_type, target_id, body)
  values (NEW.following_id, NEW.follower_id, 'follow', 'user', NEW.follower_id,
    coalesce(v_actor_name, 'Quelqu''un') || ' s''est abonné à toi');
  return NEW;
end $function$;

CREATE OR REPLACE FUNCTION public.notify_on_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_actor_name text;
  v_preview text;
BEGIN
  IF NEW.receiver_id IS NULL OR NEW.receiver_id = NEW.sender_id THEN RETURN NEW; END IF;
  SELECT full_name INTO v_actor_name FROM public.profiles WHERE id = NEW.sender_id;
  v_preview := COALESCE(NEW.content, '');
  IF char_length(v_preview) > 60 THEN v_preview := substr(v_preview, 1, 60) || '…'; END IF;
  INSERT INTO public.notifications (user_id, actor_id, type, target_type, target_id, body)
  VALUES (
    NEW.receiver_id, NEW.sender_id, 'message', 'message', NEW.id,
    COALESCE(v_actor_name, 'Quelqu''un') || ' : ' || v_preview
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_video_published()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_author_name text;
BEGIN
  SELECT full_name INTO v_author_name FROM public.profiles WHERE id = NEW.user_id;
  INSERT INTO public.notifications (user_id, actor_id, type, target_type, target_id, body)
  SELECT
    f.follower_id, NEW.user_id, 'video_published', 'video', NEW.id,
    COALESCE(v_author_name, 'Un utilisateur') || ' a publié une nouvelle vidéo : « ' || COALESCE(NEW.title, '…') || ' »'
  FROM public.follows f
  WHERE f.following_id = NEW.user_id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_proposal()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_name text; v_msg text;
begin
  select full_name into v_name from public.profiles where id = NEW.recruiter_id;
  v_msg := '📩 Proposition de ' || coalesce(v_name,'un recruteur') || E'\\n\\n' || coalesce(NEW.message, '(sans message)');
  insert into public.messages (sender_id, receiver_id, content)
  values (NEW.recruiter_id, NEW.athlete_id, v_msg);
  return NEW;
end $function$;

CREATE OR REPLACE FUNCTION public.notify_on_proposal_decision()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_name text; v_msg text;
begin
  if NEW.status is distinct from OLD.status and NEW.status in ('accepted','refused') then
    select full_name into v_name from public.profiles where id = NEW.athlete_id;
    if NEW.status = 'accepted' then
      v_msg := '✅ ' || coalesce(v_name,'L''athlète') || ' a accepté votre proposition.';
    else
      v_msg := 'ℹ️ ' || coalesce(v_name,'L''athlète') || ' a décliné votre proposition.';
    end if;
    insert into public.messages (sender_id, receiver_id, content)
    values (NEW.athlete_id, NEW.recruiter_id, v_msg);
  end if;
  return NEW;
end $function$;

CREATE OR REPLACE FUNCTION public.notify_on_application_decision()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_name text; v_msg text;
begin
  if NEW.status is distinct from OLD.status and NEW.status in ('accepted','refused') then
    select full_name into v_name from public.profiles where id = NEW.recruiter_id;
    if NEW.status = 'accepted' then
      v_msg := '✅ Bonne nouvelle ! ' || coalesce(v_name,'Le recruteur') || ' a accepté votre candidature.';
    else
      v_msg := 'ℹ️ ' || coalesce(v_name,'Le recruteur') || ' a décliné votre candidature pour le moment.';
    end if;
    insert into public.messages (sender_id, receiver_id, content)
    values (NEW.recruiter_id, NEW.athlete_id, v_msg);
  end if;
  return NEW;
end; $function$;

CREATE OR REPLACE FUNCTION public.notify_on_appointment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_name text; v_local timestamp; v_when text;
begin
  select full_name into v_name from public.profiles where id = NEW.recruiter_id;
  v_local := NEW.starts_at at time zone 'Europe/Paris';
  v_when := to_char(v_local, 'DD/MM/YYYY') || ' à ' || to_char(v_local, 'HH24:MI');
  insert into public.messages (sender_id, receiver_id, content)
  values (NEW.recruiter_id, NEW.athlete_id,
    '📅 Proposition d''essai de ' || coalesce(v_name,'un recruteur') || E'\\n🗓️ ' || v_when
    || coalesce(E'\\n📍 ' || NEW.location, '') || coalesce(E'\\n📝 ' || NEW.note, ''));
  return NEW;
end; $function$;

CREATE OR REPLACE FUNCTION public.notify_on_appointment_decision()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_name text; v_local timestamp; v_when text;
begin
  if NEW.status is distinct from OLD.status and NEW.status in ('accepted','declined') then
    select full_name into v_name from public.profiles where id = NEW.athlete_id;
    v_local := NEW.starts_at at time zone 'Europe/Paris';
    v_when := to_char(v_local, 'DD/MM/YYYY') || ' à ' || to_char(v_local, 'HH24:MI');
    insert into public.messages (sender_id, receiver_id, content)
    values (NEW.athlete_id, NEW.recruiter_id,
      case when NEW.status = 'accepted'
        then '✅ ' || coalesce(v_name,'L''athlète') || ' a confirmé l''essai du ' || v_when || '.'
        else 'ℹ️ ' || coalesce(v_name,'L''athlète') || ' a décliné l''essai du ' || v_when || '.' end);
  end if;
  return NEW;
end; $function$;

-- ══════════════════════════════════════════════════════════════════
-- CONTRAINTES
-- ══════════════════════════════════════════════════════════════════

alter table public.sports add constraint sports_pkey PRIMARY KEY (id);
alter table public.sports add constraint sports_label_key UNIQUE (label);

alter table public.profiles add constraint profiles_pkey PRIMARY KEY (id);
alter table public.profiles add constraint profiles_username_key UNIQUE (username);
alter table public.profiles add constraint profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.profiles add constraint profiles_sport_fkey FOREIGN KEY (sport) REFERENCES sports(id) ON UPDATE CASCADE ON DELETE RESTRICT;
alter table public.profiles add constraint profiles_gender_check CHECK (((gender IS NULL) OR (gender = ANY (ARRAY['M'::text, 'F'::text, 'O'::text]))));
alter table public.profiles add constraint profiles_level_check CHECK (((level IS NULL) OR (level = ANY (ARRAY['amateur'::text, 'young_pro'::text, 'senior_amateur'::text, 'senior_semi_pro'::text, 'senior_pro'::text, 'no_club'::text]))));
alter table public.profiles add constraint profiles_level_proof_status_check CHECK ((level_proof_status = ANY (ARRAY['none'::text, 'pending'::text, 'approved'::text, 'rejected'::text])));
alter table public.profiles add constraint profiles_messaging_pref_check CHECK ((messaging_pref = ANY (ARRAY['all'::text, 'followers'::text, 'recruiters'::text, 'none'::text])));
alter table public.profiles add constraint profiles_recruiting_age_max_check CHECK (((recruiting_age_max IS NULL) OR ((recruiting_age_max >= 10) AND (recruiting_age_max <= 100))));
alter table public.profiles add constraint profiles_recruiting_age_min_check CHECK (((recruiting_age_min IS NULL) OR ((recruiting_age_min >= 10) AND (recruiting_age_min <= 100))));
alter table public.profiles add constraint profiles_recruiting_gender_check CHECK (((recruiting_gender IS NULL) OR (recruiting_gender = ANY (ARRAY['all'::text, 'M'::text, 'F'::text, 'O'::text]))));
alter table public.profiles add constraint profiles_role_check CHECK ((role = ANY (ARRAY['athlete'::text, 'recruiter'::text, 'observer'::text])));

alter table public.videos add constraint videos_pkey PRIMARY KEY (id);
alter table public.videos add constraint videos_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.videos add constraint videos_sport_fkey FOREIGN KEY (sport) REFERENCES sports(id) ON UPDATE CASCADE ON DELETE RESTRICT;
alter table public.videos add constraint videos_level_check CHECK (((level IS NULL) OR (level = ANY (ARRAY['amateur'::text, 'semi_pro'::text, 'pro'::text, 'entrainement'::text]))));
alter table public.videos add constraint videos_source_check CHECK (((youtube_url IS NOT NULL) OR (video_url IS NOT NULL)));
alter table public.videos add constraint videos_video_type_check CHECK (((video_type IS NULL) OR (video_type = ANY (ARRAY['match'::text, 'training'::text]))));

alter table public.applications add constraint applications_pkey PRIMARY KEY (id);
alter table public.applications add constraint applications_athlete_id_recruiter_id_key UNIQUE (athlete_id, recruiter_id);
alter table public.applications add constraint applications_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.applications add constraint applications_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.applications add constraint applications_message_check CHECK (((message IS NULL) OR (char_length(message) <= 1500)));
alter table public.applications add constraint applications_status_check CHECK ((status = ANY (ARRAY['sent'::text, 'viewed'::text, 'responded'::text, 'archived'::text, 'accepted'::text, 'refused'::text])));

alter table public.appointments add constraint appointments_pkey PRIMARY KEY (id);
alter table public.appointments add constraint appointments_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.appointments add constraint appointments_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES profiles(id) ON DELETE CASCADE;

alter table public.certification_requests add constraint certification_requests_pkey PRIMARY KEY (id);
alter table public.certification_requests add constraint certification_requests_recruiter_id_status_key UNIQUE (recruiter_id, status);
alter table public.certification_requests add constraint certification_requests_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.certification_requests add constraint certification_requests_motivation_check CHECK (((motivation IS NULL) OR (char_length(motivation) <= 1000)));
alter table public.certification_requests add constraint certification_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])));

alter table public.comments add constraint comments_pkey PRIMARY KEY (id);
alter table public.comments add constraint comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.comments add constraint comments_video_id_fkey FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE;
alter table public.comments add constraint comments_body_check CHECK (((char_length(body) > 0) AND (char_length(body) <= 500)));

alter table public.follows add constraint follows_pkey PRIMARY KEY (follower_id, following_id);
alter table public.follows add constraint follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.follows add constraint follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES profiles(id) ON DELETE CASCADE;

alter table public.likes add constraint likes_pkey PRIMARY KEY (user_id, video_id);
alter table public.likes add constraint likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.likes add constraint likes_video_id_fkey FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE;

alter table public.messages add constraint messages_pkey PRIMARY KEY (id);
alter table public.messages add constraint messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.messages add constraint messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.messages add constraint messages_video_id_fkey FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE SET NULL;

alter table public.notes add constraint notes_pkey PRIMARY KEY (id);
alter table public.notes add constraint notes_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.notes add constraint notes_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES profiles(id) ON DELETE CASCADE;

alter table public.notifications add constraint notifications_pkey PRIMARY KEY (id);
alter table public.notifications add constraint notifications_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.notifications add constraint notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.notifications add constraint notifications_type_check CHECK ((type = ANY (ARRAY['comment'::text, 'video_published'::text, 'message'::text, 'follow'::text, 'like'::text])));

alter table public.proposals add constraint proposals_pkey PRIMARY KEY (id);
alter table public.proposals add constraint proposals_recruiter_id_athlete_id_key UNIQUE (recruiter_id, athlete_id);
alter table public.proposals add constraint proposals_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.proposals add constraint proposals_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES profiles(id) ON DELETE CASCADE;

alter table public.reports add constraint reports_pkey PRIMARY KEY (id);
alter table public.reports add constraint reports_reporter_id_target_type_target_id_key UNIQUE (reporter_id, target_type, target_id);
alter table public.reports add constraint reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.reports add constraint reports_description_check CHECK (((description IS NULL) OR (char_length(description) <= 1000)));
alter table public.reports add constraint reports_reason_check CHECK ((reason = ANY (ARRAY['spam'::text, 'harassment'::text, 'inappropriate'::text, 'fake'::text, 'violence'::text, 'other'::text])));
alter table public.reports add constraint reports_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'reviewed'::text, 'dismissed'::text, 'action_taken'::text])));
alter table public.reports add constraint reports_target_type_check CHECK ((target_type = ANY (ARRAY['user'::text, 'video'::text, 'message'::text, 'comment'::text])));

alter table public.saved_videos add constraint saved_videos_pkey PRIMARY KEY (user_id, video_id);
alter table public.saved_videos add constraint saved_videos_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.saved_videos add constraint saved_videos_video_id_fkey FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE;

alter table public.shares add constraint shares_pkey PRIMARY KEY (id);
alter table public.shares add constraint shares_shared_with_id_fkey FOREIGN KEY (shared_with_id) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public.shares add constraint shares_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.shares add constraint shares_video_id_fkey FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE;
alter table public.shares add constraint shares_channel_check CHECK ((channel = ANY (ARRAY['external'::text, 'internal'::text])));

alter table public.shortlist add constraint shortlist_pkey PRIMARY KEY (recruiter_id, athlete_id);
alter table public.shortlist add constraint shortlist_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.shortlist add constraint shortlist_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.shortlist add constraint shortlist_status_check CHECK ((status = ANY (ARRAY['en_attente'::text, 'essai_en_cours'::text, 'essai_termine'::text, 'signe'::text, 'signe_pending'::text])));

alter table public.signed_posts add constraint signed_posts_pkey PRIMARY KEY (id);
alter table public.signed_posts add constraint signed_posts_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public.signed_posts add constraint signed_posts_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.signed_posts add constraint signed_posts_caption_check CHECK (((caption IS NULL) OR (char_length(caption) <= 500)));

alter table public.signing_confirmations add constraint signing_confirmations_pkey PRIMARY KEY (id);
alter table public.signing_confirmations add constraint signing_confirmations_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.signing_confirmations add constraint signing_confirmations_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.signing_confirmations add constraint signing_confirmations_athlete_reply_check CHECK (((athlete_reply IS NULL) OR (char_length(athlete_reply) <= 500)));
alter table public.signing_confirmations add constraint signing_confirmations_recruiter_message_check CHECK (((recruiter_message IS NULL) OR (char_length(recruiter_message) <= 1000)));
alter table public.signing_confirmations add constraint signing_confirmations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'refused'::text])));

alter table public.sponsor_settings add constraint sponsor_settings_pkey PRIMARY KEY (id);
alter table public.sponsor_settings add constraint sponsor_settings_first_slot_check CHECK ((first_slot >= 1));
alter table public.sponsor_settings add constraint sponsor_settings_id_check CHECK ((id = 1));
alter table public.sponsor_settings add constraint sponsor_settings_max_per_session_check CHECK (((max_per_session >= 0) AND (max_per_session <= 10)));
alter table public.sponsor_settings add constraint sponsor_settings_slot_interval_check CHECK ((slot_interval >= 3));

alter table public.sponsored_posts add constraint sponsored_posts_pkey PRIMARY KEY (id);
alter table public.sponsored_posts add constraint sponsored_posts_advertiser_name_check CHECK ((char_length(advertiser_name) <= 80));
alter table public.sponsored_posts add constraint sponsored_posts_body_check CHECK (((body IS NULL) OR (char_length(body) <= 300)));
alter table public.sponsored_posts add constraint sponsored_posts_title_check CHECK (((title IS NULL) OR (char_length(title) <= 120)));

-- ══════════════════════════════════════════════════════════════════
-- INDEX
-- ══════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS applications_athlete_idx ON public.applications USING btree (athlete_id, created_at DESC);
CREATE INDEX IF NOT EXISTS applications_recruiter_idx ON public.applications USING btree (recruiter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS appointments_athlete_id_idx ON public.appointments USING btree (athlete_id);
CREATE INDEX IF NOT EXISTS appointments_recruiter_id_idx ON public.appointments USING btree (recruiter_id);
CREATE INDEX IF NOT EXISTS certification_requests_recruiter_idx ON public.certification_requests USING btree (recruiter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON public.comments USING btree (user_id);
CREATE INDEX IF NOT EXISTS comments_video_id_idx ON public.comments USING btree (video_id, created_at DESC);
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON public.follows USING btree (following_id);
CREATE INDEX IF NOT EXISTS likes_video_id_idx ON public.likes USING btree (video_id);
CREATE INDEX IF NOT EXISTS messages_receiver_sender_idx ON public.messages USING btree (receiver_id, sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_sender_receiver_idx ON public.messages USING btree (sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_unread_idx ON public.messages USING btree (receiver_id, created_at DESC) WHERE (read = false);
CREATE INDEX IF NOT EXISTS messages_video_id_idx ON public.messages USING btree (video_id) WHERE (video_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS notes_athlete_id_idx ON public.notes USING btree (athlete_id);
CREATE INDEX IF NOT EXISTS notes_recruiter_id_idx ON public.notes USING btree (recruiter_id);
CREATE INDEX IF NOT EXISTS notes_shared_with_idx ON public.notes USING gin (shared_with);
CREATE INDEX IF NOT EXISTS notifications_actor_id_idx ON public.notifications USING btree (actor_id) WHERE (actor_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON public.notifications USING btree (user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS profiles_athlete_discovery_idx ON public.profiles USING btree (sport, gender, birthdate) WHERE (is_recruiter = false);
CREATE INDEX IF NOT EXISTS profiles_club_trgm_idx ON public.profiles USING gin (public.search_key(club) extensions.gin_trgm_ops) WHERE (club IS NOT NULL);
CREATE INDEX IF NOT EXISTS profiles_name_trgm_idx ON public.profiles USING gin (public.search_key(full_name) extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS profiles_recruiter_idx ON public.profiles USING btree (id) WHERE (is_recruiter = true);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles USING btree (role);
CREATE INDEX IF NOT EXISTS profiles_sport_idx ON public.profiles USING btree (sport) WHERE (sport IS NOT NULL);
CREATE INDEX IF NOT EXISTS proposals_athlete_id_idx ON public.proposals USING btree (athlete_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports USING btree (status, created_at DESC);
CREATE INDEX IF NOT EXISTS reports_target_idx ON public.reports USING btree (target_type, target_id);
CREATE INDEX IF NOT EXISTS saved_videos_user_idx ON public.saved_videos USING btree (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS saved_videos_video_id_idx ON public.saved_videos USING btree (video_id);
CREATE INDEX IF NOT EXISTS shares_shared_with_id_idx ON public.shares USING btree (shared_with_id) WHERE (shared_with_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS shares_user_id_idx ON public.shares USING btree (user_id);
CREATE INDEX IF NOT EXISTS shares_video_id_idx ON public.shares USING btree (video_id);
CREATE INDEX IF NOT EXISTS shortlist_athlete_id_idx ON public.shortlist USING btree (athlete_id);
CREATE INDEX IF NOT EXISTS shortlist_recruiter_status_idx ON public.shortlist USING btree (recruiter_id, status);
CREATE INDEX IF NOT EXISTS signed_posts_athlete_idx ON public.signed_posts USING btree (athlete_id);
CREATE INDEX IF NOT EXISTS signed_posts_recruiter_idx ON public.signed_posts USING btree (recruiter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS signing_pending_athlete_idx ON public.signing_confirmations USING btree (athlete_id, status);
CREATE INDEX IF NOT EXISTS signing_pending_recruiter_idx ON public.signing_confirmations USING btree (recruiter_id, status);
CREATE INDEX IF NOT EXISTS videos_ai_flagged_idx ON public.videos USING btree (ai_sport_detected) WHERE (ai_sport_detected = false);
CREATE INDEX IF NOT EXISTS videos_feed_idx ON public.videos USING btree (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS videos_sport_feed_idx ON public.videos USING btree (sport, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS videos_user_id_idx ON public.videos USING btree (user_id);
CREATE INDEX IF NOT EXISTS videos_video_type_idx ON public.videos USING btree (video_type);

-- ══════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ══════════════════════════════════════════════════════════════════

CREATE TRIGGER trg_notify_on_application_decision AFTER UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION notify_on_application_decision();
CREATE TRIGGER trg_notify_on_appointment AFTER INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION notify_on_appointment();
CREATE TRIGGER trg_notify_on_appointment_decision AFTER UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION notify_on_appointment_decision();
CREATE TRIGGER on_comment_insert AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION notify_on_comment();
CREATE TRIGGER trg_comments_count AFTER INSERT OR DELETE ON public.comments FOR EACH ROW EXECUTE FUNCTION sync_video_comments_count();
CREATE TRIGGER trg_follow_counts AFTER INSERT OR DELETE ON public.follows FOR EACH ROW EXECUTE FUNCTION sync_follow_counts();
CREATE TRIGGER trg_notify_on_follow AFTER INSERT ON public.follows FOR EACH ROW EXECUTE FUNCTION notify_on_follow();
CREATE TRIGGER trg_likes_count AFTER INSERT OR DELETE ON public.likes FOR EACH ROW EXECUTE FUNCTION sync_video_likes_count();
CREATE TRIGGER trg_notify_on_like AFTER INSERT ON public.likes FOR EACH ROW EXECUTE FUNCTION notify_on_like();
CREATE TRIGGER on_message_insert AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION notify_on_message();
CREATE TRIGGER trg_notify_on_proposal AFTER INSERT ON public.proposals FOR EACH ROW EXECUTE FUNCTION notify_on_proposal();
CREATE TRIGGER trg_notify_on_proposal_decision AFTER UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION notify_on_proposal_decision();
CREATE TRIGGER trg_saves_count AFTER INSERT OR DELETE ON public.saved_videos FOR EACH ROW EXECUTE FUNCTION sync_video_saves_count();
CREATE TRIGGER trg_sync_shortlist_on_signing BEFORE UPDATE ON public.signing_confirmations FOR EACH ROW EXECUTE FUNCTION sync_shortlist_on_signing_decision();
CREATE TRIGGER on_video_insert AFTER INSERT ON public.videos FOR EACH ROW EXECUTE FUNCTION notify_on_video_published();
CREATE TRIGGER on_video_update_protect_ai_flag BEFORE UPDATE ON public.videos FOR EACH ROW EXECUTE FUNCTION protect_ai_sport_flag();
CREATE TRIGGER trg_profile_videos_count AFTER INSERT OR DELETE ON public.videos FOR EACH ROW EXECUTE FUNCTION sync_profile_videos_count();

-- Création automatique du profil : le trigger vit sur auth.users, que
-- la pile locale fournit comme en production.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ══════════════════════════════════════════════════════════════════
-- RLS
-- ══════════════════════════════════════════════════════════════════

alter table public.applications enable row level security;
alter table public.appointments enable row level security;
alter table public.certification_requests enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.likes enable row level security;
alter table public.messages enable row level security;
alter table public.notes enable row level security;
alter table public.notifications enable row level security;
alter table public.profiles enable row level security;
alter table public.proposals enable row level security;
alter table public.reports enable row level security;
alter table public.saved_videos enable row level security;
alter table public.shares enable row level security;
alter table public.shortlist enable row level security;
alter table public.signed_posts enable row level security;
alter table public.signing_confirmations enable row level security;
alter table public.sponsor_settings enable row level security;
alter table public.sponsored_posts enable row level security;
alter table public.sports enable row level security;
alter table public.videos enable row level security;

create policy applications_insert on public.applications as PERMISSIVE for INSERT to authenticated
  with check ((( SELECT auth.uid() AS uid) = athlete_id));
create policy applications_select on public.applications as PERMISSIVE for SELECT to authenticated
  using (((( SELECT auth.uid() AS uid) = athlete_id) OR (( SELECT auth.uid() AS uid) = recruiter_id)));
create policy applications_update on public.applications as PERMISSIVE for UPDATE to authenticated
  using ((( SELECT auth.uid() AS uid) = recruiter_id))
  with check ((( SELECT auth.uid() AS uid) = recruiter_id));
create policy appointments_insert on public.appointments as PERMISSIVE for INSERT to authenticated
  with check ((( SELECT auth.uid() AS uid) = recruiter_id));
create policy appointments_select on public.appointments as PERMISSIVE for SELECT to authenticated
  using (((( SELECT auth.uid() AS uid) = athlete_id) OR (( SELECT auth.uid() AS uid) = recruiter_id)));
create policy appointments_update on public.appointments as PERMISSIVE for UPDATE to authenticated
  using (((( SELECT auth.uid() AS uid) = athlete_id) OR (( SELECT auth.uid() AS uid) = recruiter_id)))
  with check (((( SELECT auth.uid() AS uid) = athlete_id) OR (( SELECT auth.uid() AS uid) = recruiter_id)));
create policy certification_requests_insert on public.certification_requests as PERMISSIVE for INSERT to authenticated
  with check ((( SELECT auth.uid() AS uid) = recruiter_id));
create policy certification_requests_select on public.certification_requests as PERMISSIVE for SELECT to authenticated
  using (((( SELECT auth.uid() AS uid) = recruiter_id) OR ( SELECT is_admin() AS is_admin)));
create policy comments_delete on public.comments as PERMISSIVE for DELETE to authenticated
  using (((( SELECT auth.uid() AS uid) = user_id) OR ( SELECT is_admin() AS is_admin)));
create policy comments_insert on public.comments as PERMISSIVE for INSERT to authenticated
  with check ((( SELECT auth.uid() AS uid) = user_id));
create policy comments_select on public.comments as PERMISSIVE for SELECT to public
  using (true);
create policy follows_delete on public.follows as PERMISSIVE for DELETE to authenticated
  using ((( SELECT auth.uid() AS uid) = follower_id));
create policy follows_insert on public.follows as PERMISSIVE for INSERT to authenticated
  with check ((( SELECT auth.uid() AS uid) = follower_id));
create policy follows_select on public.follows as PERMISSIVE for SELECT to public
  using (true);
create policy likes_delete on public.likes as PERMISSIVE for DELETE to authenticated
  using ((( SELECT auth.uid() AS uid) = user_id));
create policy likes_insert on public.likes as PERMISSIVE for INSERT to authenticated
  with check ((( SELECT auth.uid() AS uid) = user_id));
create policy likes_select on public.likes as PERMISSIVE for SELECT to public
  using (true);
create policy messages_delete on public.messages as PERMISSIVE for DELETE to authenticated
  using ((( SELECT auth.uid() AS uid) = sender_id));
create policy messages_insert on public.messages as PERMISSIVE for INSERT to authenticated
  with check ((( SELECT auth.uid() AS uid) = sender_id));
create policy messages_select on public.messages as PERMISSIVE for SELECT to authenticated
  using (((( SELECT auth.uid() AS uid) = sender_id) OR (( SELECT auth.uid() AS uid) = receiver_id)));
create policy messages_update on public.messages as PERMISSIVE for UPDATE to authenticated
  using ((( SELECT auth.uid() AS uid) = receiver_id))
  with check ((( SELECT auth.uid() AS uid) = receiver_id));
create policy notes_delete on public.notes as PERMISSIVE for DELETE to authenticated
  using ((( SELECT auth.uid() AS uid) = recruiter_id));
create policy notes_insert on public.notes as PERMISSIVE for INSERT to authenticated
  with check ((( SELECT auth.uid() AS uid) = recruiter_id));
create policy notes_select on public.notes as PERMISSIVE for SELECT to authenticated
  using (((( SELECT auth.uid() AS uid) = recruiter_id) OR (( SELECT auth.uid() AS uid) = ANY (shared_with))));
create policy notes_update on public.notes as PERMISSIVE for UPDATE to authenticated
  using (((( SELECT auth.uid() AS uid) = recruiter_id) OR (( SELECT auth.uid() AS uid) = ANY (shared_with))))
  with check (((( SELECT auth.uid() AS uid) = recruiter_id) OR (( SELECT auth.uid() AS uid) = ANY (shared_with))));
create policy notifications_delete on public.notifications as PERMISSIVE for DELETE to authenticated
  using ((( SELECT auth.uid() AS uid) = user_id));
create policy notifications_select on public.notifications as PERMISSIVE for SELECT to authenticated
  using ((( SELECT auth.uid() AS uid) = user_id));
create policy notifications_update on public.notifications as PERMISSIVE for UPDATE to authenticated
  using ((( SELECT auth.uid() AS uid) = user_id))
  with check ((( SELECT auth.uid() AS uid) = user_id));
create policy profiles_insert on public.profiles as PERMISSIVE for INSERT to authenticated
  with check ((( SELECT auth.uid() AS uid) = id));
create policy profiles_select on public.profiles as PERMISSIVE for SELECT to public
  using (true);
create policy profiles_update on public.profiles as PERMISSIVE for UPDATE to authenticated
  using (((( SELECT auth.uid() AS uid) = id) OR ( SELECT is_admin() AS is_admin)))
  with check (((( SELECT auth.uid() AS uid) = id) OR ( SELECT is_admin() AS is_admin)));
create policy proposals_insert on public.proposals as PERMISSIVE for INSERT to authenticated
  with check ((( SELECT auth.uid() AS uid) = recruiter_id));
create policy proposals_select on public.proposals as PERMISSIVE for SELECT to authenticated
  using (((( SELECT auth.uid() AS uid) = athlete_id) OR (( SELECT auth.uid() AS uid) = recruiter_id)));
create policy proposals_update on public.proposals as PERMISSIVE for UPDATE to authenticated
  using ((( SELECT auth.uid() AS uid) = athlete_id))
  with check ((( SELECT auth.uid() AS uid) = athlete_id));
create policy reports_insert on public.reports as PERMISSIVE for INSERT to authenticated
  with check ((( SELECT auth.uid() AS uid) = reporter_id));
create policy reports_select on public.reports as PERMISSIVE for SELECT to authenticated
  using (((( SELECT auth.uid() AS uid) = reporter_id) OR ( SELECT is_admin() AS is_admin)));
create policy saved_videos_delete on public.saved_videos as PERMISSIVE for DELETE to authenticated
  using ((( SELECT auth.uid() AS uid) = user_id));
create policy saved_videos_insert on public.saved_videos as PERMISSIVE for INSERT to authenticated
  with check ((( SELECT auth.uid() AS uid) = user_id));
create policy saved_videos_select on public.saved_videos as PERMISSIVE for SELECT to authenticated
  using ((( SELECT auth.uid() AS uid) = user_id));
create policy shares_insert on public.shares as PERMISSIVE for INSERT to authenticated
  with check ((( SELECT auth.uid() AS uid) = user_id));
create policy shares_select on public.shares as PERMISSIVE for SELECT to authenticated
  using (true);
create policy shortlist_delete on public.shortlist as PERMISSIVE for DELETE to authenticated
  using ((( SELECT auth.uid() AS uid) = recruiter_id));
create policy shortlist_insert on public.shortlist as PERMISSIVE for INSERT to authenticated
  with check ((( SELECT auth.uid() AS uid) = recruiter_id));
create policy shortlist_select on public.shortlist as PERMISSIVE for SELECT to authenticated
  using (((( SELECT auth.uid() AS uid) = recruiter_id) OR (status = 'signe'::text)));
create policy shortlist_update on public.shortlist as PERMISSIVE for UPDATE to authenticated
  using ((( SELECT auth.uid() AS uid) = recruiter_id))
  with check ((( SELECT auth.uid() AS uid) = recruiter_id));
create policy signed_posts_delete on public.signed_posts as PERMISSIVE for DELETE to authenticated
  using (((( SELECT auth.uid() AS uid) = recruiter_id) OR ( SELECT is_admin() AS is_admin)));
create policy signed_posts_insert on public.signed_posts as PERMISSIVE for INSERT to authenticated
  with check ((( SELECT auth.uid() AS uid) = recruiter_id));
create policy signed_posts_select on public.signed_posts as PERMISSIVE for SELECT to authenticated
  using (true);
create policy signing_confirmations_insert on public.signing_confirmations as PERMISSIVE for INSERT to authenticated
  with check ((( SELECT auth.uid() AS uid) = recruiter_id));
create policy signing_confirmations_select on public.signing_confirmations as PERMISSIVE for SELECT to authenticated
  using (((( SELECT auth.uid() AS uid) = athlete_id) OR (( SELECT auth.uid() AS uid) = recruiter_id)));
create policy signing_confirmations_update on public.signing_confirmations as PERMISSIVE for UPDATE to authenticated
  using ((( SELECT auth.uid() AS uid) = athlete_id))
  with check ((( SELECT auth.uid() AS uid) = athlete_id));
create policy sponsor_settings_select on public.sponsor_settings as PERMISSIVE for SELECT to authenticated
  using (true);
create policy sponsor_settings_update on public.sponsor_settings as PERMISSIVE for UPDATE to authenticated
  using (( SELECT is_admin() AS is_admin))
  with check (( SELECT is_admin() AS is_admin));
create policy sponsored_posts_delete on public.sponsored_posts as PERMISSIVE for DELETE to authenticated
  using (( SELECT is_admin() AS is_admin));
create policy sponsored_posts_insert on public.sponsored_posts as PERMISSIVE for INSERT to authenticated
  with check (( SELECT is_admin() AS is_admin));
create policy sponsored_posts_select on public.sponsored_posts as PERMISSIVE for SELECT to authenticated
  using (((active AND (starts_at <= now()) AND ((ends_at IS NULL) OR (ends_at >= now()))) OR ( SELECT is_admin() AS is_admin)));
create policy sponsored_posts_update on public.sponsored_posts as PERMISSIVE for UPDATE to authenticated
  using (( SELECT is_admin() AS is_admin))
  with check (( SELECT is_admin() AS is_admin));
create policy sports_select on public.sports as PERMISSIVE for SELECT to public
  using (true);
create policy videos_delete on public.videos as PERMISSIVE for DELETE to authenticated
  using (((( SELECT auth.uid() AS uid) = user_id) OR ( SELECT is_admin() AS is_admin)));
create policy videos_insert on public.videos as PERMISSIVE for INSERT to authenticated
  with check ((( SELECT auth.uid() AS uid) = user_id));
create policy videos_select on public.videos as PERMISSIVE for SELECT to public
  using (true);
create policy videos_update on public.videos as PERMISSIVE for UPDATE to authenticated
  using (((( SELECT auth.uid() AS uid) = user_id) OR ( SELECT is_admin() AS is_admin)))
  with check (((( SELECT auth.uid() AS uid) = user_id) OR ( SELECT is_admin() AS is_admin)));

-- ══════════════════════════════════════════════════════════════════
-- DROITS  (retirés en production sur les fonctions de trigger et
-- d'administration, qui étaient appelables depuis Internet)
-- ══════════════════════════════════════════════════════════════════

do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and pg_get_function_result(p.oid) in ('trigger', 'event_trigger')
  loop
    execute format('revoke all on function %s from anon, authenticated, public', r.sig);
  end loop;
end $$;

revoke all on function public.reconcile_counters() from anon, authenticated, public;

-- ══════════════════════════════════════════════════════════════════
-- REALTIME  (11 tables — l'app ouvre 21 canaux / 30 abonnements)
-- ══════════════════════════════════════════════════════════════════

do $$
declare t text;
begin
  foreach t in array array['applications','appointments','follows','messages','notes',
                           'notifications','profiles','proposals','shortlist',
                           'signing_confirmations','videos']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- ══════════════════════════════════════════════════════════════════
-- BUCKETS DE STOCKAGE
-- ══════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('banners', 'banners', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('level-proofs', 'level-proofs', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('signed-posts', 'signed-posts', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('sponsored', 'sponsored', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('videos', 'videos', true) on conflict (id) do nothing;

-- ══════════════════════════════════════════════════════════════════
-- DONNÉES DE RÉFÉRENCE
-- ══════════════════════════════════════════════════════════════════

insert into public.sports (id,label,icon,sort_order) values
  ('foot','Football','⚽',1),
  ('basket','Basketball','🏀',2),
  ('athle','Athlétisme','🏃',3),
  ('nat','Natation','🏊',4),
  ('tennis','Tennis','🎾',5),
  ('rugby','Rugby','🏉',6),
  ('hand','Handball','🤾',7),
  ('box','Boxe','🥊',8),
  ('mma','MMA','🥋',9),
  ('volley','Volleyball','🏐',10),
  ('badminton','Badminton','🏸',11),
  ('pingpong','Tennis de table','🏓',12),
  ('karting','Karting','🏎️',13),
  ('golf','Golf','⛳',14),
  ('cyclo','Cyclisme','🚴',15),
  ('esport','Esport','🎮',16),
  ('cricket','Cricket','🏏',17),
  ('football-us','Football américain','🏈',18),
  ('baseball','Baseball','⚾',19),
  ('hockey','Hockey sur glace','🏒',20)
on conflict (id) do nothing;

insert into public.sponsor_settings (id) values (1) on conflict (id) do nothing;

-- ══════════════════════════════════════════════════════════════════
-- FILET DE SÉCURITÉ RLS
-- Event trigger qui active automatiquement la RLS sur toute nouvelle
-- table du schéma public. Présent en production. Protégé, car selon
-- la version la pile locale peut déjà le fournir, et sa création
-- demande les droits superutilisateur.
-- ══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

do $$
begin
  create event trigger rls_auto_enable_trigger
    on ddl_command_end
    when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
    execute function public.rls_auto_enable();
exception
  when duplicate_object then null;
  when insufficient_privilege then
    raise notice 'rls_auto_enable : droits insuffisants, event trigger ignoré (déjà fourni par la plateforme)';
end $$;

revoke all on function public.rls_auto_enable() from anon, authenticated, public;
