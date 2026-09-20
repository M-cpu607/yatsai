-- ═══════════════════════════════════════════════════════════════════
-- `get_feed` renvoyait treize colonnes de vidéo. La carte du feed en
-- utilise le double : sans `video_url` un fichier téléversé ne se lit
-- pas, sans `tracking_points` la flèche de suivi disparaît, sans
-- `video_type` le filtre Match/Entraînement ne filtre rien, sans
-- `user_id` le classement ne sait plus qui l'on suit.
--
-- La fonction avait été écrite et mesurée contre une carte plus simple
-- que la vraie. C'est ce qui explique qu'elle soit restée inutilisée :
-- la brancher telle quelle aurait cassé la lecture des vidéos.
--
-- Deux champs d'auteur s'ajoutent également : `author_level`, affiché
-- sur la carte, et `author_is_recruiter`.
--
-- Ce qui ne change pas, volontairement : SECURITY INVOKER et l'absence
-- de `SET search_path`. La fonction doit rester soumise à la RLS — c'est
-- elle qui écarte désormais les vidéos des comptes privés — et la clause
-- `search_path` empêcherait l'inlining, mesuré 2,5 fois plus cher.
-- ═══════════════════════════════════════════════════════════════════

drop function if exists public.get_feed(integer, timestamptz, uuid, text);

create function public.get_feed(
  p_limit integer default 20,
  p_cursor_created_at timestamptz default null,
  p_cursor_id uuid default null,
  p_sport text default null)
returns table(
  id uuid, user_id uuid, title text, description text,
  sport text, "position" text, position_id text, level text, video_type text,
  youtube_url text, video_url text, thumbnail_url text, duration_seconds numeric,
  views integer, likes_count integer, comments_count integer, saves_count integer,
  created_at timestamptz,
  championship text, age_category text, age_category_id text,
  season text, season_id text,
  opponent_level text, opponent_level_id text,
  match_date date, jersey_number smallint,
  city text, region text, country text,
  tracking_points jsonb, tracking_color text, tracking_shape text, tracking_size real,
  needs_review boolean,
  author_id uuid, author_name text, author_username text, author_avatar text,
  author_verified boolean, author_club text, author_age integer, author_gender text,
  author_level text, author_is_recruiter boolean,
  viewer_liked boolean, viewer_saved boolean)
language sql
stable
as $function$
  select
    v.id, v.user_id, v.title, v.description,
    v.sport, v."position", v.position_id, v."level", v.video_type,
    v.youtube_url, v.video_url, v.thumbnail_url, v.duration_seconds,
    v.views, v.likes_count, v.comments_count, v.saves_count,
    v.created_at,
    v.championship, v.age_category, v.age_category_id,
    v.season, v.season_id,
    v.opponent_level, v.opponent_level_id,
    v.match_date, v.jersey_number,
    v.city, v.region, v.country,
    v.tracking_points, v.tracking_color, v.tracking_shape, v.tracking_size,
    v.needs_review,
    p.id, p.full_name, p.username, p.avatar_url, p.verified, p.club,
    p.age, p.gender, p."level", p.is_recruiter,
    l.user_id is not null,
    s.user_id is not null
  from public.videos v
  join public.profiles p on p.id = v.user_id
  left join public.likes        l on l.video_id = v.id and l.user_id = (select auth.uid())
  left join public.saved_videos s on s.video_id = v.id and s.user_id = (select auth.uid())
  -- Toujours présent => toujours une condition d'index. Un
  -- `or p_cursor is null` retomberait en parcours séquentiel : mesuré
  -- 50,91 ms contre 0,25 ms sur 200 000 vidéos.
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

revoke execute on function public.get_feed(integer, timestamptz, uuid, text) from public;
grant execute on function public.get_feed(integer, timestamptz, uuid, text)
  to anon, authenticated, service_role;

comment on function public.get_feed(integer, timestamptz, uuid, text) is
  'Une page du fil, paginée par curseur (created_at, id). SECURITY INVOKER : la RLS de videos écarte les comptes privés dont l''appelant n''est pas abonné.';
