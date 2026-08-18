/**
 * Test de charge du feed Scolympia — k6.
 *
 *   k6 run -e SUPABASE_URL=... -e SUPABASE_KEY=... loadtest/feed.k6.js
 *
 * À préférer au script Node dès qu'on dépasse quelques centaines de
 * connexions simultanées : Node y devient lui-même le goulot
 * d'étranglement et l'on finirait par mesurer le client, pas le serveur.
 *
 * Le scénario reproduit un usage réel plutôt qu'un martèlement : on
 * charge une page, on la « regarde », puis on fait défiler. C'est ce
 * rapport entre temps de réflexion et requêtes qui détermine combien
 * d'utilisateurs une infrastructure supporte.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

const URL = __ENV.SUPABASE_URL;
const KEY = __ENV.SUPABASE_KEY;
if (!URL || !KEY) {
  throw new Error('Passez -e SUPABASE_URL=... et -e SUPABASE_KEY=... (valeurs du .env)');
}

const ENDPOINT = `${URL}/rest/v1/rpc/get_feed`;
const PARAMS = {
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
  tags: { name: 'get_feed' },
};

const latenceFeed = new Trend('feed_latence', true);
const echecs      = new Rate('feed_echecs');
const pagesVues   = new Counter('feed_pages');
const octets      = new Counter('feed_octets');

export const options = {
  // Montée progressive : chaque palier tient assez longtemps pour que
  // la latence se stabilise avant de juger.
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m',  target: 50 },
    { duration: '30s', target: 200 },
    { duration: '1m',  target: 200 },
    { duration: '30s', target: 500 },
    { duration: '1m',  target: 500 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    // Au-delà de 500 ms au 95e centile, le défilement devient perceptible.
    'feed_latence': ['p(95)<500', 'p(99)<1500'],
    'feed_echecs':  ['rate<0.01'],
  },
};

export default function () {
  // Page 1 : curseur vide.
  let r = http.post(ENDPOINT, JSON.stringify({
    p_limit: 20, p_cursor_created_at: null, p_cursor_id: null, p_sport: null,
  }), PARAMS);

  latenceFeed.add(r.timings.duration);
  echecs.add(r.status !== 200);
  octets.add(r.body ? r.body.length : 0);
  check(r, { 'page 1 renvoie 200': (x) => x.status === 200 });
  if (r.status !== 200) { sleep(2); return; }

  pagesVues.add(1);
  let lignes;
  try { lignes = JSON.parse(r.body); } catch { return; }

  // L'utilisateur regarde les vidéos avant de faire défiler.
  sleep(Math.random() * 20 + 10);

  // Puis 1 à 3 pages supplémentaires, via le curseur.
  const pages = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < pages && lignes.length; i++) {
    const d = lignes[lignes.length - 1];
    r = http.post(ENDPOINT, JSON.stringify({
      p_limit: 20, p_cursor_created_at: d.created_at, p_cursor_id: d.id, p_sport: null,
    }), PARAMS);

    latenceFeed.add(r.timings.duration);
    echecs.add(r.status !== 200);
    octets.add(r.body ? r.body.length : 0);
    check(r, { 'page suivante renvoie 200': (x) => x.status === 200 });
    if (r.status !== 200) break;

    pagesVues.add(1);
    try { lignes = JSON.parse(r.body); } catch { break; }
    if (!lignes.length) break;
    sleep(Math.random() * 20 + 10);
  }
}

export function handleSummary(data) {
  const m = data.metrics;
  const mo = (m.feed_octets?.values?.count ?? 0) / 1024 / 1024;
  const p95 = m.feed_latence?.values?.['p(95)'] ?? 0;
  const rps = m.http_reqs?.values?.rate ?? 0;
  const err = (m.feed_echecs?.values?.rate ?? 0) * 100;

  // 10 000 utilisateurs actifs ne produisent pas 10 000 req/s : avec
  // ~30 s entre deux pages, chacun pèse environ 0,033 req/s.
  const utilisateursSupportes = Math.round(rps / 0.033);

  return {
    stdout: `
${'═'.repeat(60)}
  RÉSULTATS
${'═'.repeat(60)}
  Débit soutenu ............ ${rps.toFixed(0)} req/s
  Latence p95 .............. ${p95.toFixed(0)} ms
  Taux d'erreur ............ ${err.toFixed(2)} %
  Pages servies ............ ${m.feed_pages?.values?.count ?? 0}
  Bande passante ........... ${mo.toFixed(1)} Mo  (quota gratuit : 5 120 Mo/mois)

  À ce débit, et en comptant ~30 s entre deux pages par personne,
  cela correspond à environ ${utilisateursSupportes.toLocaleString('fr-FR')} utilisateurs actifs simultanés.

  ${p95 < 500 && err < 1
    ? 'Les seuils sont tenus : la charge testée est absorbée.'
    : 'Seuils dépassés : le plafond est atteint avant la fin des paliers.'}
${'═'.repeat(60)}
`,
  };
}
