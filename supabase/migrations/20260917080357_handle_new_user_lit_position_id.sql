-- ═══════════════════════════════════════════════════════════════════
-- L'inscription pose désormais un identifiant de poste (référentiel)
-- et non plus un texte libre. `position_id` est lu depuis les
-- métadonnées ; le libellé texte est rempli ensuite par le trigger
-- profiles_sync_position_label.
--
-- `position` reste lu des métadonnées pour ne pas casser une
-- inscription venue d'un client non mis à jour (application mobile
-- déjà installée, par exemple) : les deux chemins coexistent, et le
-- trigger de libellé écrase le texte dès qu'un identifiant est fourni.
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  insert into public.profiles (
    id, full_name, username, is_recruiter, role,
    gender, age, birthdate, nationality, sport, position, position_id, club, organization,
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
