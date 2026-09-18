-- ═══════════════════════════════════════════════════════════════════
-- « Compte privé — tes vidéos et abonnés ne sont visibles que par tes
-- abonnés ». C'est le texte du réglage dans l'application. La base ne
-- tenait pas cette promesse : `videos_select` était `using (true)`.
--
-- La migration précédente a rendu le profil privé invisible aux
-- inconnus. Elle laissait deux choses incohérentes :
--   1. les vidéos d'un compte privé restaient publiques ;
--   2. un ABONNÉ ne voyait plus le profil qu'il a le droit de voir.
-- Les deux sont corrigées ici.
--
-- POURQUOI DÉNORMALISER `author_is_private` PLUTÔT QUE JOINDRE.
-- Une politique RLS sur `videos` qui irait lire `profiles.is_private`
-- serait elle-même soumise à la RLS de `profiles` : la ligne d'un compte
-- privé y est invisible, donc `not exists (... and is_private)` vaudrait
-- VRAI et la vidéo serait montrée — exactement l'inverse du but. Le piège
-- est silencieux : la règle a l'air juste et protège le contraire de ce
-- qu'elle annonce. Une colonne recopiée sur `videos` supprime la question,
-- et coûte une comparaison de booléen par ligne au lieu d'une jointure.
-- ═══════════════════════════════════════════════════════════════════

alter table public.videos
  add column if not exists author_is_private boolean not null default false;

comment on column public.videos.author_is_private is
  'Recopie de profiles.is_private de l''auteur. Maintenue par trigger ; ne pas écrire à la main. Existe pour que la politique RLS n''ait pas à lire profiles, dont la RLS la tromperait.';

update public.videos v
   set author_is_private = coalesce(p.is_private, false)
  from public.profiles p
 where p.id = v.user_id
   and v.author_is_private is distinct from coalesce(p.is_private, false);

-- La quasi-totalité des vidéos ont un auteur public : un index partiel
-- ne porte que sur les rares lignes concernées.
create index if not exists videos_auteur_prive_idx
  on public.videos (user_id) where author_is_private;

-- ── Maintien de la recopie, dans les deux sens ─────────────────────
create or replace function public.videos_sync_author_private()
returns trigger language plpgsql security definer set search_path to '' as $$
begin
  -- SECURITY DEFINER : la lecture de `profiles` doit ignorer la RLS,
  -- sinon l'auteur d'une vidéo dont le profil est privé serait introuvable
  -- et la recopie retomberait à `false`.
  new.author_is_private := coalesce(
    (select p.is_private from public.profiles p where p.id = new.user_id), false);
  return new;
end $$;

drop trigger if exists videos_sync_author_private_trg on public.videos;
create trigger videos_sync_author_private_trg
  before insert or update of user_id on public.videos
  for each row execute function public.videos_sync_author_private();

create or replace function public.profiles_propagate_private()
returns trigger language plpgsql security definer set search_path to '' as $$
begin
  update public.videos
     set author_is_private = coalesce(new.is_private, false)
   where user_id = new.id
     and author_is_private is distinct from coalesce(new.is_private, false);
  return new;
end $$;

drop trigger if exists profiles_propagate_private_trg on public.profiles;
create trigger profiles_propagate_private_trg
  after update of is_private on public.profiles
  for each row execute function public.profiles_propagate_private();

-- ── Les vidéos d'un compte privé ───────────────────────────────────
drop policy if exists videos_select on public.videos;
create policy videos_select on public.videos
  for select to public
  using (
    -- Cas courant, sans accès à une autre table.
    not author_is_private
    or user_id = (select auth.uid())
    -- N'est évalué que sur les rares vidéos à auteur privé. S'appuie sur
    -- follows_pkey (follower_id, following_id).
    or exists (
         select 1 from public.follows f
          where f.follower_id = (select auth.uid())
            and f.following_id = videos.user_id
       )
  );

-- ── Le profil d'un compte privé, pour ses abonnés ──────────────────
-- Le réglage promet « visibles par tes abonnés », pas « invisibles de
-- tous ». Sans cette ouverture, un abonné verrait la vidéo sans savoir
-- de qui elle est : la jointure sur l'auteur ne remonterait rien.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to public
  using (
    not coalesce(is_private, false)
    or id = (select auth.uid())
    or (select public.is_admin())
    or exists (
         select 1 from public.follows f
          where f.follower_id = (select auth.uid())
            and f.following_id = profiles.id
       )
  );

-- La découverte reste fermée : `search_athletes` écarte les profils
-- privés quel que soit l'appelant. Privé veut dire « pas dans les
-- résultats de recherche », y compris pour un abonné — qui n'a de toute
-- façon pas besoin de chercher quelqu'un qu'il suit déjà.
