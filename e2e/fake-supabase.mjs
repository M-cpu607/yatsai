// Faux Supabase : auth + PostgREST, juste assez pour faire tourner l'app.
import { createServer } from 'node:http';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const SPORTS = ['foot','basket','tennis','rugby','nat'];
const NOMS = ['Kylian Benga','Aminata Diallo','Karim Benzaoui','Sophie Martin','Lucas Mendes'];
const CLUBS = ['AS Bordeaux U19','Stade Rennais','ASVEL U21','CN Marseille','FC Nantes'];
// Vraies vidéos YouTube pour que les miniatures existent réellement.
const YT = ['dQw4w9WgXcQ','9bZkp7q19f0','kJQP7kiw5Fk','JGwWNGJdvx8','OPf0YbXqDm0'];

const feed = Array.from({ length: 60 }, (_, i) => ({
  id: `00000000-0000-7000-8000-${String(i).padStart(12, '0')}`,
  title: `Highlights saison 2026 — action ${i + 1}`,
  youtube_url: `https://www.youtube.com/watch?v=${YT[i % YT.length]}`,
  thumbnail_url: null,
  sport: SPORTS[i % SPORTS.length],
  position: ['Attaquant','Meneur','Ailier','Gardien','Milieu'][i % 5],
  description: 'Compilation de mes meilleures actions de la saison.',
  level: 'regional',
  views: 1000 + i * 137,
  likes_count: 42 + i * 3,
  comments_count: 7 + i,
  saves_count: 3 + i,
  created_at: new Date(Date.now() - i * 3600_000).toISOString(),
  author_id: `00000000-0000-7000-8000-${String(900 + (i % 5)).padStart(12, '0')}`,
  author_name: NOMS[i % NOMS.length],
  author_username: NOMS[i % NOMS.length].toLowerCase().replace(/[^a-z]/g, '.'),
  author_avatar: null,
  author_verified: i % 3 === 0,
  author_club: CLUBS[i % CLUBS.length],
  author_age: 17 + (i % 6),
  author_gender: i % 2 ? 'F' : 'M',
  viewer_liked: i % 7 === 0,
  viewer_saved: i % 11 === 0,
}));

const session = {
  access_token: 'faux-jeton-acces', token_type: 'bearer', expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'faux-refresh',
  user: { id: USER_ID, aud: 'authenticated', role: 'authenticated',
          email: 'andreas@example.com', email_confirmed_at: new Date().toISOString(),
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
          app_metadata: { provider: 'email' },
          user_metadata: { full_name: 'Andreas Faure', is_recruiter: false } },
};

const profil = {
  id: USER_ID, username: 'andreas', full_name: 'Andreas Faure', avatar_url: null,
  is_recruiter: false, verified: true, sport: 'foot', position: 'Attaquant',
  club: 'AS Bordeaux U19', birthdate: '2007-04-12', age: 19, gender: 'M',
  country: 'FR', region: 'Nouvelle-Aquitaine', city: 'Bordeaux', bio: 'Attaquant U19.',
  followers_count: 2400, following_count: 186, videos_count: 12,
  created_at: new Date().toISOString(), is_admin: false, level: 'regional', role: 'athlete',
};

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
    if (u.pathname.startsWith('/auth/v1/token'))  return envoyer(200, session);
    if (u.pathname === '/auth/v1/signup')         return envoyer(200, session);
    if (u.pathname === '/auth/v1/user')           return envoyer(200, session.user);
    if (u.pathname === '/auth/v1/logout')         return envoyer(204, {});

    // ── PostgREST ──
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
    if (u.pathname === '/rest/v1/profiles')  return envoyer(200, [profil]);
    if (u.pathname.startsWith('/rest/v1/'))  return envoyer(200, []);

    envoyer(404, { message: 'non gere par le mock' });
  });
}).listen(8901, () => console.log('faux supabase sur 8901'));

process.on('SIGTERM', () => { console.log(journal.join('\n')); process.exit(0); });
setInterval(() => {}, 1 << 30);
