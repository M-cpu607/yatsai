// Faux Supabase : auth + PostgREST, juste assez pour faire tourner l'app.
//
// Le contrat suivi ici est celui des fonctions réelles. Quand `get_feed`
// ou `search_athletes` changent de colonnes, ce fichier doit suivre,
// sinon le test de fumée valide une application qui ne correspond plus
// à sa base.
import { createServer } from 'node:http';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const SPORTS = ['foot', 'basket', 'tennis', 'rugby', 'nat'];
const NOMS = ['Kylian Benga', 'Aminata Diallo', 'Karim Benzaoui', 'Sophie Martin', 'Lucas Mendes'];
const CLUBS = ['AS Bordeaux U19', 'Stade Rennais', 'ASVEL U21', 'CN Marseille', 'FC Nantes'];
const NIVEAUX_AUTEUR = ['amateur', 'senior_amateur', 'young_pro', 'senior_semi_pro', 'senior_pro'];
// Vraies vidéos YouTube pour que les miniatures existent réellement.
const YT = ['dQw4w9WgXcQ', '9bZkp7q19f0', 'kJQP7kiw5Fk', 'JGwWNGJdvx8', 'OPf0YbXqDm0'];

// ── Référentiels ───────────────────────────────────────────────────
// Les mêmes identifiants que la base réelle, en plus court.
const POSITIONS = [
  { sport_id: 'foot', id: 'gardien', label: 'Gardien de but', sort_order: 1 },
  { sport_id: 'foot', id: 'defenseur_central', label: 'Défenseur central', sort_order: 4 },
  { sport_id: 'foot', id: 'milieu_central', label: 'Milieu central', sort_order: 6 },
  { sport_id: 'foot', id: 'ailier_droit', label: 'Ailier droit', sort_order: 8 },
  { sport_id: 'foot', id: 'attaquant', label: 'Attaquant', sort_order: 10 },
  { sport_id: 'basket', id: 'meneur', label: 'Meneur', sort_order: 1 },
  { sport_id: 'basket', id: 'ailier', label: 'Ailier', sort_order: 3 },
  { sport_id: 'basket', id: 'pivot', label: 'Pivot', sort_order: 5 },
  { sport_id: 'rugby', id: 'pilier', label: 'Pilier', sort_order: 1 },
  { sport_id: 'rugby', id: 'demi_melee', label: 'Demi de mêlée', sort_order: 6 },
  { sport_id: 'tennis', id: 'simple', label: 'Simple', sort_order: 1 },
  { sport_id: 'tennis', id: 'double', label: 'Double', sort_order: 2 },
  { sport_id: 'nat', id: 'nage_libre', label: 'Nage libre', sort_order: 1 },
  { sport_id: 'nat', id: 'papillon', label: 'Papillon', sort_order: 4 },
];

const AGE_CATEGORIES = [
  ['u13', 'U13'], ['u15', 'U15'], ['u17', 'U17'], ['u19', 'U19'],
  ['u21', 'U21'], ['senior', 'Senior'], ['veteran', 'Vétéran'],
].map(([id, label], i) => ({ id, label, sort_order: i + 1 }));

const SEASONS = Array.from({ length: 6 }, (_, i) => {
  const a = 2022 + i;
  return { id: `${a}-${a + 1}`, label: `${a}-${a + 1}`, starts_on: `${a}-09-01`, sort_order: i };
});

const COMPETITION_LEVELS = [
  ['loisir', 'Loisir / non compétitif'], ['district', 'District'],
  ['departemental', 'Départemental'], ['regional', 'Régional'],
  ['inter_regional', 'Inter-régional'], ['national_3', 'National — 3e échelon'],
  ['national_2', 'National — 2e échelon'], ['national_1', 'National — 1er échelon'],
  ['professionnel', 'Professionnel'], ['international', 'International'],
].map(([id, label], i) => ({ id, label, rank: i + 1 }));

const SPORTS_TABLE = [
  { id: 'foot', label: 'Football', icon: '⚽', has_jersey_number: true },
  { id: 'basket', label: 'Basketball', icon: '🏀', has_jersey_number: true },
  { id: 'rugby', label: 'Rugby', icon: '🏉', has_jersey_number: true },
  { id: 'tennis', label: 'Tennis', icon: '🎾', has_jersey_number: false },
  { id: 'nat', label: 'Natation', icon: '🏊', has_jersey_number: false },
];

// ── Le fil ─────────────────────────────────────────────────────────
// Toutes les colonnes que `get_feed` rend réellement. En omettre une
// ferait passer le test alors que l'application manquerait la donnée.
const POSTES_PAR_SPORT = POSITIONS.reduce((m, p) => {
  (m[p.sport_id] ||= []).push(p); return m;
}, {});

const feed = Array.from({ length: 60 }, (_, i) => {
  const sport = SPORTS[i % SPORTS.length];
  const poste = POSTES_PAR_SPORT[sport][i % POSTES_PAR_SPORT[sport].length];
  const niveauAdv = COMPETITION_LEVELS[(i * 3) % COMPETITION_LEVELS.length];
  const saison = SEASONS[SEASONS.length - 1 - (i % 3)];
  const categorie = AGE_CATEGORIES[i % AGE_CATEGORIES.length];
  const aMaillot = SPORTS_TABLE.find(s => s.id === sport)?.has_jersey_number;
  return {
    id: `00000000-0000-7000-8000-${String(i).padStart(12, '0')}`,
    user_id: `00000000-0000-7000-8000-${String(900 + (i % 5)).padStart(12, '0')}`,
    title: `Highlights saison 2026 — action ${i + 1}`,
    description: 'Compilation de mes meilleures actions de la saison.',
    sport,
    position: poste.label,
    position_id: poste.id,
    level: ['amateur', 'semi_pro', 'pro', 'entrainement'][i % 4],
    video_type: i % 3 === 0 ? 'training' : 'match',
    youtube_url: `https://www.youtube.com/watch?v=${YT[i % YT.length]}`,
    video_url: null,
    thumbnail_url: null,
    duration_seconds: 45 + (i % 120),
    views: 1000 + i * 137,
    likes_count: 42 + i * 3,
    comments_count: 7 + i,
    saves_count: 3 + i,
    shares_count: 1 + (i % 9),
    created_at: new Date(Date.now() - i * 3600_000).toISOString(),
    championship: i % 2 ? 'Championnat régional' : null,
    age_category: categorie.label,
    age_category_id: categorie.id,
    season: saison.label,
    season_id: saison.id,
    opponent_level: niveauAdv.label,
    opponent_level_id: niveauAdv.id,
    match_date: new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10),
    jersey_number: aMaillot ? (i % 99) : null,
    city: ['Bordeaux', 'Rennes', 'Lyon', 'Marseille', 'Nantes'][i % 5],
    region: 'Nouvelle-Aquitaine',
    country: 'FR',
    tracking_points: null,
    tracking_color: null,
    tracking_shape: null,
    tracking_size: null,
    needs_review: false,
    author_id: `00000000-0000-7000-8000-${String(900 + (i % 5)).padStart(12, '0')}`,
    author_name: NOMS[i % NOMS.length],
    author_username: NOMS[i % NOMS.length].toLowerCase().replace(/[^a-z]/g, '.'),
    author_avatar: null,
    author_verified: i % 3 === 0,
    author_club: CLUBS[i % CLUBS.length],
    author_age: 17 + (i % 6),
    author_gender: i % 2 ? 'F' : 'M',
    author_level: NIVEAUX_AUTEUR[i % NIVEAUX_AUTEUR.length],
    author_is_recruiter: false,
    viewer_liked: i % 7 === 0,
    viewer_saved: i % 11 === 0,
  };
});

const session = {
  access_token: 'faux-jeton-acces', token_type: 'bearer', expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'faux-refresh',
  user: {
    id: USER_ID, aud: 'authenticated', role: 'authenticated',
    email: 'andreas@example.com', email_confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    app_metadata: { provider: 'email' },
    user_metadata: { full_name: 'Andreas Faure', is_recruiter: false },
  },
};

// Le profil complet, tel que `get_my_profile()` le rend : colonnes
// privées comprises, puisque c'est celui de l'appelant.
const profil = {
  id: USER_ID, username: 'andreas', full_name: 'Andreas Faure', avatar_url: null,
  banner_url: null, is_recruiter: false, verified: true, sport: 'foot',
  position: 'Attaquant', position_id: 'attaquant', club: 'AS Bordeaux U19',
  birthdate: '2007-04-12', phone: '0600000000',
  age: 19, age_private: 19, gender: 'M',
  country: 'FR', region: 'Nouvelle-Aquitaine', city: 'Bordeaux',
  country_private: 'FR', region_private: 'Nouvelle-Aquitaine', city_private: 'Bordeaux',
  nationality: 'Française', bio: 'Attaquant U19.',
  followers_count: 2400, following_count: 186, videos_count: 12,
  created_at: new Date().toISOString(), is_admin: false, level: 'senior_amateur',
  role: 'athlete', is_private: false, hide_age: false, hide_location: false,
  messaging_pref: 'all', social_links: null, level_proof_status: 'none',
  has_club: true, season_start_month: 9,
};

// Quelques profils pour l'écran de recherche, au format `search_athletes`.
const athletes = Array.from({ length: 12 }, (_, i) => ({
  id: `00000000-0000-7000-8000-${String(900 + i).padStart(12, '0')}`,
  full_name: NOMS[i % NOMS.length] + (i >= NOMS.length ? ` ${i}` : ''),
  username: 'joueur' + i,
  avatar_url: null,
  verified: i % 3 === 0,
  sport: SPORTS[i % SPORTS.length],
  position: POSITIONS[i % POSITIONS.length].label,
  position_id: POSITIONS[i % POSITIONS.length].id,
  club: CLUBS[i % CLUBS.length],
  organization: null,
  is_recruiter: false,
  role: 'athlete',
  age: 16 + (i % 8),
  gender: i % 2 ? 'F' : 'M',
  country: 'FR',
  region: 'Nouvelle-Aquitaine',
  city: ['Bordeaux', 'Rennes', 'Lyon', 'Marseille', 'Nantes'][i % 5],
  nationality: 'Française',
  level: NIVEAUX_AUTEUR[i % NIVEAUX_AUTEUR.length],
  followers_count: 3000 - i * 137,
  videos_count: 2 + (i % 9),
  match_source: null,
}));

const sansAccents = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const journal = [];
createServer((req, res) => {
  let corps = '';
  req.on('data', (c) => (corps += c));
  req.on('end', () => {
    const u = new URL(req.url, 'http://x');
    journal.push(`${req.method} ${u.pathname}${u.search}`);
    const envoyer = (code, data) => {
      res.writeHead(code, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
      });
      res.end(JSON.stringify(data));
    };
    if (req.method === 'OPTIONS') return envoyer(200, {});

    // ── Auth ──
    if (u.pathname.startsWith('/auth/v1/token')) return envoyer(200, session);
    if (u.pathname === '/auth/v1/signup') return envoyer(200, session);
    if (u.pathname === '/auth/v1/user') return envoyer(200, session.user);
    if (u.pathname === '/auth/v1/logout') return envoyer(204, {});
    if (u.pathname === '/auth/v1/recover') return envoyer(200, {});

    // ── Fonctions ──
    if (u.pathname === '/rest/v1/rpc/get_feed') {
      const p = corps ? JSON.parse(corps) : {};
      const limite = p.p_limit ?? 20;
      let debut = 0;
      if (p.p_cursor_id) {
        const i = feed.findIndex((x) => x.id === p.p_cursor_id);
        debut = i >= 0 ? i + 1 : 0;
      }
      return envoyer(200, feed.slice(debut, debut + limite));
    }

    // Renvoie un OBJET, pas un tableau : la fonction réelle a pour type
    // de retour `public.profiles`, et supabase-js le rend tel quel.
    if (u.pathname === '/rest/v1/rpc/get_my_profile') return envoyer(200, profil);

    if (u.pathname === '/rest/v1/rpc/search_athletes') {
      const p = corps ? JSON.parse(corps) : {};
      const q = sansAccents(p.p_query);
      let r = athletes.filter((a) => {
        if (p.p_sport && a.sport !== p.p_sport) return false;
        if (p.p_gender && a.gender !== p.p_gender) return false;
        if (p.p_city && !sansAccents(a.city).includes(sansAccents(p.p_city))) return false;
        if (p.p_levels?.length && !p.p_levels.includes(a.level)) return false;
        if (p.p_position_id && a.position_id !== p.p_position_id) return false;
        if (q && !(sansAccents(a.full_name).includes(q) || sansAccents(a.club).includes(q))) return false;
        return true;
      });
      r = r.map((a) => ({ ...a, match_source: q ? 'nom' : null }));
      const debut = p.p_offset ?? 0;
      return envoyer(200, r.slice(debut, debut + (p.p_limit ?? 20)));
    }

    if (u.pathname.startsWith('/rest/v1/rpc/increment_video_views')) return envoyer(200, null);

    // ── Référentiels ──
    if (u.pathname === '/rest/v1/positions') return envoyer(200, POSITIONS);
    if (u.pathname === '/rest/v1/age_categories') return envoyer(200, AGE_CATEGORIES);
    if (u.pathname === '/rest/v1/seasons') return envoyer(200, SEASONS);
    if (u.pathname === '/rest/v1/competition_levels') return envoyer(200, COMPETITION_LEVELS);
    if (u.pathname === '/rest/v1/sports') return envoyer(200, SPORTS_TABLE);

    // ── Tables ──
    if (u.pathname === '/rest/v1/profiles') return envoyer(200, [profil]);
    if (u.pathname.startsWith('/rest/v1/')) return envoyer(200, []);

    envoyer(404, { message: 'non gere par le mock' });
  });
}).listen(8901, () => console.log('faux supabase sur 8901'));

process.on('SIGTERM', () => { console.log(journal.join('\n')); process.exit(0); });
setInterval(() => {}, 1 << 30);
