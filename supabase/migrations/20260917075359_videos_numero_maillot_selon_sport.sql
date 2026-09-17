-- ═══════════════════════════════════════════════════════════════════
-- Un numéro de maillot n'a de sens que dans un sport qui en porte.
-- sports.has_jersey_number fait foi ; le trigger écarte le numéro
-- ailleurs, pour qu'un client obsolète ou un appel direct à l'API ne
-- puisse pas inscrire un dossard sur un nageur.
-- ═══════════════════════════════════════════════════════════════════

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

  -- Numéro de maillot : seulement dans les sports qui en portent.
  if new.jersey_number is not null
     and not coalesce((select sp.has_jersey_number
                         from public.sports sp where sp.id = new.sport), false)
  then
    new.jersey_number := null;
  end if;

  return new;
end $$;

drop trigger if exists videos_sync_labels_trg on public.videos;
create trigger videos_sync_labels_trg
  before insert or update of position_id, sport, age_category_id, season_id,
                             opponent_level_id, jersey_number
  on public.videos
  for each row execute function public.videos_sync_labels();
