-- ═══════════════════════════════════════════════════════════════════
-- Jeu d'essai local — rejoué à chaque `supabase db reset`.
--
-- Ne s'exécute QUE sur la pile locale. Ces comptes n'existent pas en
-- production et ne doivent jamais y être joués.
--
-- Mot de passe commun : scolympia
-- ═══════════════════════════════════════════════════════════════════

-- Garde-fou : refuse de s'exécuter ailleurs qu'en local.
do $$
begin
  if current_setting('server_version_num')::int < 150000 then
    raise exception 'Version de PostgreSQL inattendue';
  end if;
end $$;

-- ── Fabrique de comptes ────────────────────────────────────────────
-- Crée un utilisateur GoTrue complet (auth.users + auth.identities).
-- Le trigger on_auth_user_created remplit public.profiles à partir des
-- métadonnées, exactement comme une vraie inscription.
create or replace function pg_temp.creer_compte(
  p_id uuid, p_email text, p_meta jsonb
) returns uuid language plpgsql as $$
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated',
    p_email, extensions.crypt('scolympia', extensions.gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, p_meta,
    '', '', '', ''
  );

  -- auth.identities : sans cette ligne, la connexion par mot de passe
  -- échoue silencieusement.
  begin
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), p_id,
            jsonb_build_object('sub', p_id::text, 'email', p_email),
            'email', p_id::text, now(), now(), now());
  exception when undefined_column then
    -- Variante plus ancienne de GoTrue, sans provider_id.
    insert into auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), p_id,
            jsonb_build_object('sub', p_id::text, 'email', p_email),
            'email', now(), now(), now());
  end;

  return p_id;
end $$;

-- ── Comptes ────────────────────────────────────────────────────────
select pg_temp.creer_compte(
  '11111111-1111-4111-8111-111111111111', 'admin@scolympia.local',
  '{"full_name":"Admin Scolympia","username":"admin","role":"observer"}'::jsonb);

select pg_temp.creer_compte(
  '22222222-2222-4222-8222-222222222222', 'kylian@scolympia.local',
  '{"full_name":"Kylian Benga","username":"kylian","role":"athlete","sport":"foot","position":"Attaquant","club":"AS Bordeaux U19","gender":"M","birthdate":"2007-04-12","level":"amateur","country":"FR","region":"Nouvelle-Aquitaine","city":"Bordeaux"}'::jsonb);

select pg_temp.creer_compte(
  '33333333-3333-4333-8333-333333333333', 'aminata@scolympia.local',
  '{"full_name":"Aminata Diallo","username":"aminata","role":"athlete","sport":"athle","position":"Sprinteuse","club":"Stade Rennais Athlé","gender":"F","birthdate":"2005-09-30","level":"senior_semi_pro","country":"FR","region":"Bretagne","city":"Rennes"}'::jsonb);

select pg_temp.creer_compte(
  '44444444-4444-4444-8444-444444444444', 'marc@scolympia.local',
  '{"full_name":"Marc Dubois","username":"marc","role":"recruiter","is_recruiter":"true","organization":"Paris Saint-Germain","country":"FR","recruiting_gender":"all","recruiting_age_min":"16","recruiting_age_max":"21"}'::jsonb);

-- Droits d'administration pour le premier compte.
update public.profiles set is_admin = true, verified = true
where id = '11111111-1111-4111-8111-111111111111';

update public.profiles set verified = true
where id in ('33333333-3333-4333-8333-333333333333',
             '44444444-4444-4444-8444-444444444444');

-- ── Vidéos ─────────────────────────────────────────────────────────
-- Vraies URL YouTube pour que les miniatures se résolvent.
insert into public.videos (id, user_id, youtube_url, title, sport, "position", description, video_type, level, created_at) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222',
   'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
   'Compilation buts — saison 2026', 'foot', 'Attaquant',
   'Mes meilleures actions de la saison avec l''AS Bordeaux U19.', 'match', 'amateur', now() - interval '2 hours'),
  ('aaaaaaaa-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222',
   'https://www.youtube.com/watch?v=9bZkp7q19f0',
   'Séance technique — contrôle et frappe', 'foot', 'Attaquant',
   'Travail individuel à l''entraînement.', 'training', 'entrainement', now() - interval '1 day'),
  ('aaaaaaaa-0000-4000-8000-000000000003', '33333333-3333-4333-8333-333333333333',
   'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
   '100 m — finale régionale', 'athle', 'Sprinteuse',
   'Finale du championnat régional, 11s84.', 'match', 'semi_pro', now() - interval '3 days');

-- ── Interactions (exercent les triggers de compteurs) ─────────────
insert into public.follows (follower_id, following_id) values
  ('44444444-4444-4444-8444-444444444444', '22222222-2222-4222-8222-222222222222'),
  ('44444444-4444-4444-8444-444444444444', '33333333-3333-4333-8333-333333333333'),
  ('33333333-3333-4333-8333-333333333333', '22222222-2222-4222-8222-222222222222');

insert into public.likes (user_id, video_id) values
  ('33333333-3333-4333-8333-333333333333', 'aaaaaaaa-0000-4000-8000-000000000001'),
  ('44444444-4444-4444-8444-444444444444', 'aaaaaaaa-0000-4000-8000-000000000001'),
  ('22222222-2222-4222-8222-222222222222', 'aaaaaaaa-0000-4000-8000-000000000003');

insert into public.comments (video_id, user_id, body) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '44444444-4444-4444-8444-444444444444',
   'Très bon placement sur la deuxième action. On se parle ?');

-- Le recruteur place un athlète en short-list.
insert into public.shortlist (recruiter_id, athlete_id, status) values
  ('44444444-4444-4444-8444-444444444444', '22222222-2222-4222-8222-222222222222', 'en_attente');

insert into public.notes (recruiter_id, athlete_id, body) values
  ('44444444-4444-4444-8444-444444444444', '22222222-2222-4222-8222-222222222222',
   'Bon pied gauche. À revoir en match officiel avant de se positionner.');

-- ── Contrôle ───────────────────────────────────────────────────────
-- Les compteurs doivent avoir été alimentés par les triggers.
do $$
declare v_likes int; v_followers int; v_videos int;
begin
  select likes_count into v_likes from public.videos where id='aaaaaaaa-0000-4000-8000-000000000001';
  select followers_count, videos_count into v_followers, v_videos
    from public.profiles where id='22222222-2222-4222-8222-222222222222';
  raise notice 'Jeu d''essai : 4 comptes, 3 vidéos.';
  raise notice '  likes sur la vidéo 1 : % (attendu 2)', v_likes;
  raise notice '  abonnés de Kylian    : % (attendu 2)', v_followers;
  raise notice '  vidéos de Kylian     : % (attendu 2)', v_videos;
  if v_likes <> 2 or v_followers <> 2 or v_videos <> 2 then
    raise warning 'Les compteurs dénormalisés ne correspondent pas — vérifier les triggers.';
  end if;
end $$;
