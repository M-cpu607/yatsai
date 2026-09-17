-- ═══════════════════════════════════════════════════════════════════
-- Référentiels : postes, catégories d'âge, saisons
--
-- `position`, `age_category` et `season` étaient (ou seraient) du texte
-- libre. Un filtre sur du texte libre promet l'exhaustivité et ne la
-- tient pas : « Attaquant », « attaquant », « Avant-centre », « AC »
-- et « n°9 » sont cinq athlètes que le filtre « Attaquant » n'agrège
-- pas. Il affiche alors un résultat partiel sans jamais signaler ce
-- qu'il a raté — c'est exactement le défaut corrigé sur `sport`.
--
-- On fige donc ces trois dimensions dans des tables de référence.
-- ═══════════════════════════════════════════════════════════════════

-- ── POSTES, par sport ──────────────────────────────────────────────
create table if not exists public.positions (
  id          text not null,
  sport_id    text not null references public.sports(id) on update cascade on delete cascade,
  label       text not null,
  sort_order  smallint not null default 0,
  primary key (sport_id, id)
);

create index if not exists positions_sport_idx on public.positions (sport_id, sort_order);

alter table public.positions enable row level security;
create policy positions_select on public.positions for select to public using (true);

comment on table public.positions is
  'Postes possibles par sport. La clé est composite : un même id ("gardien") existe dans plusieurs sports avec un libellé propre.';

insert into public.positions (sport_id, id, label, sort_order) values
  -- Football
  ('foot','gardien','Gardien de but',1),
  ('foot','lateral_droit','Latéral droit',2),
  ('foot','lateral_gauche','Latéral gauche',3),
  ('foot','defenseur_central','Défenseur central',4),
  ('foot','milieu_defensif','Milieu défensif',5),
  ('foot','milieu_central','Milieu central',6),
  ('foot','milieu_offensif','Milieu offensif',7),
  ('foot','ailier_droit','Ailier droit',8),
  ('foot','ailier_gauche','Ailier gauche',9),
  ('foot','attaquant','Attaquant',10),
  ('foot','avant_centre','Avant-centre',11),

  -- Basketball
  ('basket','meneur','Meneur',1),
  ('basket','arriere','Arrière',2),
  ('basket','ailier','Ailier',3),
  ('basket','ailier_fort','Ailier fort',4),
  ('basket','pivot','Pivot',5),

  -- Athlétisme
  ('athle','sprint','Sprint',1),
  ('athle','demi_fond','Demi-fond',2),
  ('athle','fond','Fond',3),
  ('athle','haies','Haies',4),
  ('athle','saut_hauteur','Saut en hauteur',5),
  ('athle','saut_longueur','Saut en longueur',6),
  ('athle','triple_saut','Triple saut',7),
  ('athle','perche','Saut à la perche',8),
  ('athle','poids','Lancer du poids',9),
  ('athle','disque','Lancer du disque',10),
  ('athle','javelot','Lancer du javelot',11),
  ('athle','marteau','Lancer du marteau',12),
  ('athle','combine','Épreuves combinées',13),
  ('athle','marche','Marche athlétique',14),

  -- Natation
  ('nat','nage_libre','Nage libre',1),
  ('nat','dos','Dos',2),
  ('nat','brasse','Brasse',3),
  ('nat','papillon','Papillon',4),
  ('nat','quatre_nages','Quatre nages',5),
  ('nat','eau_libre','Eau libre',6),

  -- Tennis
  ('tennis','simple','Simple',1),
  ('tennis','double','Double',2),

  -- Rugby
  ('rugby','pilier','Pilier',1),
  ('rugby','talonneur','Talonneur',2),
  ('rugby','deuxieme_ligne','Deuxième ligne',3),
  ('rugby','troisieme_ligne_aile','Troisième ligne aile',4),
  ('rugby','numero_8','Numéro 8',5),
  ('rugby','demi_melee','Demi de mêlée',6),
  ('rugby','demi_ouverture','Demi d''ouverture',7),
  ('rugby','centre','Centre',8),
  ('rugby','ailier','Ailier',9),
  ('rugby','arriere','Arrière',10),

  -- Handball
  ('hand','gardien','Gardien de but',1),
  ('hand','ailier_gauche','Ailier gauche',2),
  ('hand','arriere_gauche','Arrière gauche',3),
  ('hand','demi_centre','Demi-centre',4),
  ('hand','arriere_droit','Arrière droit',5),
  ('hand','ailier_droit','Ailier droit',6),
  ('hand','pivot','Pivot',7),

  -- Boxe (catégories de poids)
  ('box','mouche','Poids mouche',1),
  ('box','coq','Poids coq',2),
  ('box','plume','Poids plume',3),
  ('box','leger','Poids léger',4),
  ('box','welter','Poids welter',5),
  ('box','moyen','Poids moyen',6),
  ('box','mi_lourd','Poids mi-lourd',7),
  ('box','lourd','Poids lourd',8),

  -- MMA
  ('mma','paille','Poids paille',1),
  ('mma','mouche','Poids mouche',2),
  ('mma','coq','Poids coq',3),
  ('mma','plume','Poids plume',4),
  ('mma','leger','Poids léger',5),
  ('mma','welter','Poids welter',6),
  ('mma','moyen','Poids moyen',7),
  ('mma','mi_lourd','Poids mi-lourd',8),
  ('mma','lourd','Poids lourd',9),

  -- Volleyball
  ('volley','passeur','Passeur',1),
  ('volley','attaquant_recepteur','Attaquant-réceptionneur',2),
  ('volley','central','Central',3),
  ('volley','pointu','Pointu',4),
  ('volley','libero','Libéro',5),

  -- Badminton
  ('badminton','simple','Simple',1),
  ('badminton','double','Double',2),
  ('badminton','double_mixte','Double mixte',3),

  -- Tennis de table
  ('pingpong','simple','Simple',1),
  ('pingpong','double','Double',2),

  -- Karting
  ('karting','pilote','Pilote',1),

  -- Golf
  ('golf','joueur','Joueur',1),

  -- Cyclisme
  ('cyclo','sprinteur','Sprinteur',1),
  ('cyclo','rouleur','Rouleur',2),
  ('cyclo','grimpeur','Grimpeur',3),
  ('cyclo','puncheur','Puncheur',4),
  ('cyclo','contre_la_montre','Contre-la-montre',5),
  ('cyclo','vtt','VTT',6),
  ('cyclo','piste','Piste',7),

  -- Esport
  ('esport','joueur','Joueur',1),
  ('esport','support','Support',2),
  ('esport','capitaine','Capitaine',3),

  -- Cricket
  ('cricket','batteur','Batteur',1),
  ('cricket','lanceur','Lanceur',2),
  ('cricket','tout_terrain','Tout-terrain',3),
  ('cricket','gardien_guichet','Gardien de guichet',4),

  -- Football américain
  ('football-us','quarterback','Quarterback',1),
  ('football-us','running_back','Running back',2),
  ('football-us','wide_receiver','Wide receiver',3),
  ('football-us','tight_end','Tight end',4),
  ('football-us','ligne_offensive','Ligne offensive',5),
  ('football-us','ligne_defensive','Ligne défensive',6),
  ('football-us','linebacker','Linebacker',7),
  ('football-us','cornerback','Cornerback',8),
  ('football-us','safety','Safety',9),
  ('football-us','kicker','Kicker',10),

  -- Baseball
  ('baseball','lanceur','Lanceur',1),
  ('baseball','receveur','Receveur',2),
  ('baseball','premiere_base','Première base',3),
  ('baseball','deuxieme_base','Deuxième base',4),
  ('baseball','troisieme_base','Troisième base',5),
  ('baseball','arret_court','Arrêt-court',6),
  ('baseball','voltigeur','Voltigeur',7),

  -- Hockey sur glace
  ('hockey','gardien','Gardien de but',1),
  ('hockey','defenseur','Défenseur',2),
  ('hockey','ailier_gauche','Ailier gauche',3),
  ('hockey','centre','Centre',4),
  ('hockey','ailier_droit','Ailier droit',5)
on conflict (sport_id, id) do nothing;

-- ── CATÉGORIES D'ÂGE ───────────────────────────────────────────────
-- Décrit la COMPÉTITION, pas la personne. L'âge de l'athlète reste
-- calculé depuis profiles.birthdate : un âge stocké devient faux au
-- premier anniversaire.
create table if not exists public.age_categories (
  id          text primary key,
  label       text not null,
  age_min     smallint,
  age_max     smallint,
  sort_order  smallint not null default 0
);

alter table public.age_categories enable row level security;
create policy age_categories_select on public.age_categories for select to public using (true);

comment on table public.age_categories is
  'Catégorie d''âge de la compétition filmée. Démarre à U10 ; rien en dessous.';

insert into public.age_categories (id, label, age_min, age_max, sort_order) values
  ('u10','U10 (moins de 10 ans)', null, 9, 1),
  ('u11','U11', 10, 10, 2),
  ('u12','U12', 11, 11, 3),
  ('u13','U13', 12, 12, 4),
  ('u14','U14', 13, 13, 5),
  ('u15','U15', 14, 14, 6),
  ('u16','U16', 15, 15, 7),
  ('u17','U17', 16, 16, 8),
  ('u18','U18', 17, 17, 9),
  ('u19','U19', 18, 18, 10),
  ('u20','U20', 19, 19, 11),
  ('u21','U21', 20, 20, 12),
  ('u23','U23', 21, 22, 13),
  ('senior','Senior', 23, 34, 14),
  ('veteran','Vétéran', 35, null, 15)
on conflict (id) do nothing;

-- ── SAISONS ────────────────────────────────────────────────────────
create table if not exists public.seasons (
  id          text primary key,
  label       text not null,
  starts_on   date not null,
  ends_on     date not null,
  sort_order  smallint not null default 0
);

alter table public.seasons enable row level security;
create policy seasons_select on public.seasons for select to public using (true);

comment on table public.seasons is
  'Saisons sportives, de septembre à août. Généré de 2015-2016 à 2034-2035.';

insert into public.seasons (id, label, starts_on, ends_on, sort_order)
select
  a::text || '-' || (a+1)::text,
  a::text || '-' || (a+1)::text,
  make_date(a, 9, 1),
  make_date(a+1, 8, 31),
  (a - 2015)::smallint
from generate_series(2015, 2034) a
on conflict (id) do nothing;

-- ── RATTACHEMENT DES VIDÉOS ────────────────────────────────────────
-- Colonnes neuves plutôt que conversion en place : l'ancienne valeur
-- texte reste lisible le temps que le front bascule.
alter table public.videos
  add column if not exists position_id     text,
  add column if not exists age_category_id text references public.age_categories(id) on update cascade,
  add column if not exists season_id       text references public.seasons(id) on update cascade,
  add column if not exists match_date      date;

-- La FK porte sur le couple (sport, poste) : impossible d'attribuer un
-- « pivot » de basket à une vidéo de football.
alter table public.videos
  add constraint videos_position_fkey
  foreign key (sport, position_id) references public.positions(sport_id, id)
  on update cascade on delete restrict;

create index if not exists videos_position_idx     on public.videos (sport, position_id) where position_id is not null;
create index if not exists videos_age_category_idx on public.videos (age_category_id) where age_category_id is not null;
create index if not exists videos_season_idx       on public.videos (season_id) where season_id is not null;

-- ── RATTACHEMENT DES PROFILS ───────────────────────────────────────
alter table public.profiles
  add column if not exists position_id text;

alter table public.profiles
  add constraint profiles_position_fkey
  foreign key (sport, position_id) references public.positions(sport_id, id)
  on update cascade on delete restrict;

create index if not exists profiles_position_idx on public.profiles (sport, position_id) where position_id is not null;

-- Reprise de la seule valeur existante : 'milieu' sur un profil de foot.
update public.profiles
set position_id = 'milieu_central'
where sport = 'foot' and lower(trim("position")) in ('milieu','milieu central','milieu de terrain');
