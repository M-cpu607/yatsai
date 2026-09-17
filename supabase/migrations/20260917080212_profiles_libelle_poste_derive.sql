-- ═══════════════════════════════════════════════════════════════════
-- Même principe que pour les vidéos : profiles.position_id devient la
-- source de vérité, et le trigger recopie le libellé dans la colonne
-- texte historique, que l'application lit encore à plusieurs endroits
-- (fiche profil, résultats de recherche, liste de short-list).
--
-- Un poste saisi en texte libre sans identifiant est laissé intact :
-- les profils existants ne sont pas touchés.
-- ═══════════════════════════════════════════════════════════════════

create or replace function public.profiles_sync_position_label()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  -- La clé est composite (sport, position_id) : la jointure porte sur
  -- les deux colonnes, sinon un « pivot » de basket passerait pour un
  -- poste de handball.
  if new.position_id is not null then
    select p.label into new."position"
      from public.positions p
     where p.id = new.position_id and p.sport_id = new.sport;
  elsif tg_op = 'UPDATE' and old.position_id is not null then
    new."position" := null;
  end if;
  return new;
end $$;

drop trigger if exists profiles_sync_position_label_trg on public.profiles;
create trigger profiles_sync_position_label_trg
  before insert or update of position_id, sport
  on public.profiles
  for each row execute function public.profiles_sync_position_label();
