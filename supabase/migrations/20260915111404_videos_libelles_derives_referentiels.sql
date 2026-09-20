-- ═══════════════════════════════════════════════════════════════════
-- Libellés dérivés des référentiels.
--
-- L'application lit les vidéos avec `select *` à une douzaine
-- d'endroits et affiche `position` / `age_category` directement. Plutôt
-- que de faire une jointure dans chacun de ces appels, un trigger
-- recopie le libellé du référentiel dans la colonne texte au moment de
-- l'écriture. Les identifiants restent la source de vérité (contrainte
-- de clé étrangère, filtres exacts) ; le texte n'est qu'un reflet.
--
-- Le texte libre saisi sans identifiant est laissé intact : les
-- anciennes vidéos ne sont pas touchées.
-- ═══════════════════════════════════════════════════════════════════

alter table public.videos
  add column if not exists season text,
  add column if not exists opponent_level text;

comment on column public.videos.season is
  'Libellé recopié depuis seasons ; ne pas écrire à la main, renseigner season_id.';
comment on column public.videos.opponent_level is
  'Libellé recopié depuis competition_levels ; ne pas écrire à la main, renseigner opponent_level_id.';

create or replace function public.videos_sync_labels()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  -- Poste : la clé est composite (sport, position_id), la jointure doit
  -- donc porter sur les deux colonnes.
  if new.position_id is not null then
    select p.label into new."position"
      from public.positions p
     where p.id = new.position_id and p.sport_id = new.sport;
  elsif tg_op = 'UPDATE' and old.position_id is not null then
    new."position" := null;
  end if;

  if new.age_category_id is not null then
    select a.label into new.age_category
      from public.age_categories a where a.id = new.age_category_id;
  elsif tg_op = 'UPDATE' and old.age_category_id is not null then
    new.age_category := null;
  end if;

  if new.season_id is not null then
    select s.label into new.season
      from public.seasons s where s.id = new.season_id;
  elsif tg_op = 'UPDATE' and old.season_id is not null then
    new.season := null;
  end if;

  if new.opponent_level_id is not null then
    select c.label into new.opponent_level
      from public.competition_levels c where c.id = new.opponent_level_id;
  elsif tg_op = 'UPDATE' and old.opponent_level_id is not null then
    new.opponent_level := null;
  end if;

  return new;
end $$;

drop trigger if exists videos_sync_labels_trg on public.videos;
create trigger videos_sync_labels_trg
  before insert or update of position_id, sport, age_category_id, season_id, opponent_level_id
  on public.videos
  for each row execute function public.videos_sync_labels();
