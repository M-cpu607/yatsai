-- Conditions d'utilisation : acceptation enregistrée, et versionnée.
--
-- La version est une date. Quand le texte change, on change la version
-- (ici ET dans src/conditions.jsx) : chaque compte doit alors ré-accepter,
-- ce que l'application demande à l'ouverture.

alter table public.profiles
  add column terms_accepted_at timestamptz,
  add column terms_version text;

-- Pas de GRANT SELECT sur ces colonnes : les droits de lecture de profiles
-- sont posés colonne par colonne, et personne n'a à lire l'acceptation
-- d'un autre. Chacun lit la sienne par get_my_profile (SECURITY DEFINER).

create or replace function public.version_conditions()
returns text language sql immutable
as $$ select '2026-09-28' $$;

-- Seule porte d'écriture : on ne peut accepter que la version en vigueur,
-- et l'horodatage vient du serveur.
create or replace function public.accepter_conditions(p_version text)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Connexion requise.';
  end if;
  if p_version is distinct from public.version_conditions() then
    raise exception using errcode = 'P0001',
      message = 'Les conditions ont changé entre-temps. Relance l''application pour lire la nouvelle version.';
  end if;
  update public.profiles
     set terms_accepted_at = now(), terms_version = p_version
   where id = auth.uid();
end;
$$;
revoke execute on function public.accepter_conditions(text) from public, anon;
grant execute on function public.accepter_conditions(text) to authenticated;

-- La table profiles est modifiable par son propriétaire (UPDATE accordé sur
-- toute la table) : sans ce garde-fou, n'importe qui pourrait écrire
-- lui-même une acceptation. Les fonctions SECURITY DEFINER tournent sous le
-- rôle propriétaire et passent ; les appels directs de l'application
-- (authenticated, anon) sont ramenés aux anciennes valeurs.
create or replace function public.profiles_proteger_colonnes_systeme()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.terms_accepted_at := old.terms_accepted_at;
    new.terms_version     := old.terms_version;
  end if;
  return new;
end;
$$;

create trigger profiles_proteger_colonnes_systeme_trg
  before update on public.profiles
  for each row execute function public.profiles_proteger_colonnes_systeme();
