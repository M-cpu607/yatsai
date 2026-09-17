-- ═══════════════════════════════════════════════════════════════════
-- « Masquer ma localisation » et « masquer mon âge » deviennent réels.
--
-- Jusqu'ici ces deux réglages n'existaient que dans le JavaScript du
-- navigateur : la base renvoyait la ville et l'âge à qui les demandait,
-- et l'application se contentait de ne pas les afficher. Le cadenas
-- était un dessin.
--
-- RLS masque des LIGNES, jamais des COLONNES, et les droits par colonne
-- (GRANT) sont globaux, pas par ligne. Aucun des deux mécanismes ne sait
-- donc « cacher la ville de ceux qui l'ont demandé ». D'où le choix
-- retenu : inverser le sens des colonnes.
--
--   city_private   la valeur saisie par la personne  → droit révoqué
--   city           colonne GÉNÉRÉE, masquée si besoin → lisible par tous
--
-- Conséquence agréable : les quelque quarante endroits de l'application
-- qui lisent `city` continuent de fonctionner sans modification, et sont
-- désormais corrects. Seule l'écriture change de cible.
--
-- Une colonne générée est calculée par PostgreSQL à chaque écriture :
-- elle ne peut pas se désynchroniser, et il n'y a pas de trigger à
-- oublier.
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Recueillir les valeurs saisies ──────────────────────────────
alter table public.profiles
  add column if not exists city_private    text,
  add column if not exists region_private  text,
  add column if not exists country_private text,
  add column if not exists age_private     integer;

update public.profiles set
  city_private    = city,
  region_private  = region,
  country_private = country,
  age_private     = age;

-- ── 2. Remplacer les colonnes publiques par leur version masquée ───
-- `coalesce` parce que les deux drapeaux sont nullables : un profil qui
-- n'a jamais touché au réglage ne doit pas voir sa ville disparaître.
alter table public.profiles drop column city;
alter table public.profiles drop column region;
alter table public.profiles drop column country;
alter table public.profiles drop column age;

alter table public.profiles
  add column city text
    generated always as (case when coalesce(hide_location, false) then null else city_private end) stored,
  add column region text
    generated always as (case when coalesce(hide_location, false) then null else region_private end) stored,
  add column country text
    generated always as (case when coalesce(hide_location, false) then null else country_private end) stored,
  add column age integer
    generated always as (case when coalesce(hide_age, false) then null else age_private end) stored;

comment on column public.profiles.city is
  'Généré : city_private masqué si hide_location. Ne pas écrire ici — écrire dans city_private.';
comment on column public.profiles.region is
  'Généré : region_private masqué si hide_location. Écrire dans region_private.';
comment on column public.profiles.country is
  'Généré : country_private masqué si hide_location. Écrire dans country_private.';
comment on column public.profiles.age is
  'Généré : age_private masqué si hide_age. Écrire dans age_private. La source de vérité de l''âge reste birthdate ; age n''en est qu''un cache d''affichage.';

-- ── 3. L'inscription écrit dans les colonnes sources ───────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  insert into public.profiles (
    id, full_name, username, is_recruiter, role,
    gender, age_private, birthdate, nationality, sport, position, position_id, club, organization,
    level, has_club, country_private, region_private, city_private,
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
    nullif(new.raw_user_meta_data->>'position_id', ''),
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
