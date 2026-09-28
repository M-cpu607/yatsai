-- Vidéos : 30 secondes au plus, et un nombre limité de publications par jour.
--
-- Deux règles de produit, appliquées ici plutôt que dans l'application : un
-- contrôle fait seulement côté client se contourne en appelant l'API
-- directement. L'application les vérifie aussi, mais pour prévenir — c'est
-- la base qui décide.

-- Le quota, en un seul endroit. L'application ne le code pas en dur : elle
-- demande à `publications_restantes_aujourdhui()` combien il en reste.
create or replace function public.quota_publications_par_jour()
returns integer
language sql
immutable
set search_path = ''
as $$ select 3 $$;

-- Minuit à Paris, en instant absolu. Le quota se remet à zéro à cette heure-là.
create or replace function public.debut_du_jour_paris()
returns timestamptz
language sql
stable
set search_path = ''
as $$ select (date_trunc('day', now() at time zone 'Europe/Paris')) at time zone 'Europe/Paris' $$;

create or replace function public.videos_garde_publication()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  deja integer;
  quota integer := public.quota_publications_par_jour();
begin
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

drop trigger if exists videos_garde_publication_trg on public.videos;
create trigger videos_garde_publication_trg
  before insert on public.videos
  for each row execute function public.videos_garde_publication();

-- Ce qu'il reste à l'appelant aujourd'hui : l'application l'affiche, et
-- n'envoie pas un fichier qui serait refusé ensuite.
create or replace function public.publications_restantes_aujourdhui()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select greatest(0, public.quota_publications_par_jour() - count(*))::integer
    from public.videos
   where user_id = auth.uid()
     and created_at >= public.debut_du_jour_paris()
$$;

revoke all on function public.publications_restantes_aujourdhui() from public, anon;
grant execute on function public.publications_restantes_aujourdhui() to authenticated;
revoke all on function public.videos_garde_publication() from public, anon, authenticated;

-- Taille des fichiers : 80 Mo au lieu de 200. Trente secondes filmées en
-- 1080p pèsent de l'ordre de 20 à 40 Mo ; le 4K dépasserait la limite.
update storage.buckets set file_size_limit = 80 * 1024 * 1024 where id = 'videos';
