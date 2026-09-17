-- ═══════════════════════════════════════════════════════════════════
-- Niveau de l'adversaire et numéro de maillot
--
-- Trois buts contre une équipe de district ne valent pas trois buts en
-- National. Sans cette information, un recruteur ne peut pas juger une
-- performance : c'est le contexte qui donne sa valeur au geste.
-- ═══════════════════════════════════════════════════════════════════

-- ── NIVEAUX DE COMPÉTITION ─────────────────────────────────────────
-- `rank` est la raison d'être de cette table. Une simple liste de
-- libellés ne permettrait que « exactement district ». Avec un rang
-- ordonné, on peut demander « régional ou mieux » — ce qu'un recruteur
-- veut réellement.
create table if not exists public.competition_levels (
  id          text primary key,
  label       text not null,
  rank        smallint not null unique,
  description text
);

alter table public.competition_levels enable row level security;
create policy competition_levels_select on public.competition_levels for select to public using (true);

comment on table public.competition_levels is
  'Niveaux de compétition, ordonnés par `rank` croissant. Le rang permet les filtres « X ou mieux », qu''une liste non ordonnée rendrait impossibles.';
comment on column public.competition_levels.rank is
  'Rang croissant : 1 = le plus bas. Comparer sur rank, jamais sur id.';

insert into public.competition_levels (id, label, rank, description) values
  ('loisir',        'Loisir / non compétitif',  1, 'Sans enjeu de classement'),
  ('district',      'District',                 2, 'Premier niveau départemental'),
  ('departemental', 'Départemental',            3, 'Championnat de département'),
  ('regional',      'Régional',                 4, 'Championnat de région'),
  ('inter_regional','Inter-régional',           5, 'Entre plusieurs régions'),
  ('national_3',    'National — 3e échelon',    6, 'Troisième division nationale'),
  ('national_2',    'National — 2e échelon',    7, 'Deuxième division nationale'),
  ('national_1',    'National — 1er échelon',   8, 'Première division nationale'),
  ('professionnel', 'Professionnel',            9, 'Championnat professionnel'),
  ('international', 'International',           10, 'Sélection nationale ou compétition internationale')
on conflict (id) do nothing;

-- ── RATTACHEMENT ───────────────────────────────────────────────────
alter table public.videos
  add column if not exists opponent_level_id text
    references public.competition_levels(id) on update cascade on delete restrict,
  add column if not exists jersey_number smallint;

comment on column public.videos.opponent_level_id is
  'Niveau de l''équipe ou de l''adversaire affronté. Sans lui, une performance ne se juge pas.';
comment on column public.videos.jersey_number is
  'Numéro de maillot porté, pour repérer l''athlète dans une action collective.';

-- ── SPORTS À NUMÉRO DE MAILLOT ─────────────────────────────────────
-- Onze sports sur vingt en portent. Le drapeau évite au formulaire
-- d''afficher le champ à un nageur ou à un golfeur.
alter table public.sports
  add column if not exists has_jersey_number boolean not null default false;

comment on column public.sports.has_jersey_number is
  'Vrai si le sport utilise des numéros de maillot. Pilote l''affichage du champ dans le formulaire.';

update public.sports set has_jersey_number = true
where id in ('foot','basket','rugby','hand','volley','cricket',
             'football-us','baseball','hockey','karting','esport');

-- Une valeur plausible, et jamais renseignée pour un sport qui n'en a
-- pas — la base refuse, quoi que fasse le client.
alter table public.videos
  add constraint videos_jersey_number_check
  check (jersey_number is null or (jersey_number >= 0 and jersey_number <= 99));

create or replace function public.check_jersey_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare v_autorise boolean;
begin
  if new.jersey_number is null then return new; end if;
  select has_jersey_number into v_autorise from public.sports where id = new.sport;
  if not coalesce(v_autorise, false) then
    raise exception 'Le sport « % » n''utilise pas de numéro de maillot', new.sport
      using errcode = 'check_violation';
  end if;
  return new;
end $function$;

revoke all on function public.check_jersey_number() from anon, authenticated, public;

drop trigger if exists trg_check_jersey_number on public.videos;
create trigger trg_check_jersey_number
  before insert or update of jersey_number, sport on public.videos
  for each row execute function public.check_jersey_number();

-- ── INDEX ──────────────────────────────────────────────────────────
-- Sur le rang plutôt que sur l'identifiant : le filtre « régional ou
-- mieux » compare des rangs, et doit rester indexable.
create index if not exists videos_opponent_level_idx
  on public.videos (opponent_level_id) where opponent_level_id is not null;

create index if not exists videos_jersey_idx
  on public.videos (sport, jersey_number) where jersey_number is not null;
