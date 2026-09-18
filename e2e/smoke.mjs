// Test de fumée : l'app tourne-t-elle vraiment, de la connexion au feed ?
// Voir e2e/README.md.
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:4173';
const SHOT = process.env.SHOT_DIR ?? '.';
const res = [];
const ok = (n, c, d='') => { res.push({n, c, d}); console.log(`${c?'OK   ':'ECHEC'}  ${n}${d?'  — '+d:''}`); };

const nav = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const ctx = await nav.newContext({ viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();

const erreurs = [];
page.on('console', m => { if (m.type() === 'error') erreurs.push(m.text()); });
const echecsReseau = [];
page.on('requestfailed', r => echecsReseau.push(`${r.url()} :: ${r.failure()?.errorText}`));
page.on('pageerror', e => erreurs.push('PAGEERROR: ' + e.message));

// ── 1. Écran de connexion ──
await page.goto(BASE, { waitUntil: 'networkidle' });
const aFormulaire = await page.locator('input[type="email"]').count() > 0;
ok('Écran de connexion affiché', aFormulaire);
await page.screenshot({ path: `${SHOT}/1-login.png` });

// ── 2. Connexion ──
await page.fill('input[type="email"]', 'andreas@example.com');
await page.fill('input[type="password"]', 'motdepasse123');
await page.click('button[type="submit"]');
await page.waitForTimeout(1500);

// ── 3. Le feed s'affiche ──
const corps = await page.textContent('body');
const feedAffiche = corps.includes('Highlights saison 2026');
ok('Feed rendu après connexion', feedAffiche);
ok('Nom de l\'auteur affiché (author_name)', corps.includes('Kylian Benga') || corps.includes('Aminata'),
   'champ à plat renvoyé par get_feed');
ok('Pas d\'état vide "Aucune vidéo"', !corps.includes('Aucune vidéo encore'));

// Miniatures YouTube réellement résolues
const miniatures = await page.locator('img[src*="img.youtube.com"]').count();
ok('Miniatures YouTube construites', miniatures > 0, `${miniatures} image(s)`);
await page.screenshot({ path: `${SHOT}/2-feed.png` });

// ── 4. Défilement infini ──
const compter = () => page.evaluate(() =>
  document.body.innerText.match(/Highlights saison 2026/g)?.length ?? 0);
const avant = await compter();
const scroller = page.locator('div.overflow-y-auto').first();
for (let i = 0; i < 6; i++) {
  await scroller.evaluate(el => el.scrollTop = el.scrollHeight);
  await page.waitForTimeout(400);
}
const apres = await compter();
ok('Défilement infini charge une page suivante', apres > avant, `${avant} → ${apres} cartes`);
await page.screenshot({ path: `${SHOT}/3-scroll.png` });

// ── 5. Aucune erreur console ──
// Le proxy de cet environnement bloque tout hote externe. On distingue
// donc les echecs reseau externes (attendus ici) des erreurs applicatives.
const externes = echecsReseau.filter(u => /youtube|gstatic|googleapis|fonts/.test(u));
const internes = echecsReseau.filter(u => !/youtube|gstatic|googleapis|fonts/.test(u));
console.log(`\n  ressources externes bloquees par le proxy : ${externes.length}`);
externes.slice(0,2).forEach(u => console.log('    ' + u.slice(0,110)));
if (internes.length) internes.slice(0,5).forEach(u => console.log('    INTERNE ' + u.slice(0,110)));

const graves = erreurs.filter(e =>
  !/favicon|React DevTools|ERR_TUNNEL_CONNECTION_FAILED|Failed to load resource/i.test(e));
ok('Aucune requete applicative en echec', internes.length === 0, internes.slice(0,2).join(' | '));
ok('Aucune erreur JavaScript applicative', graves.length === 0, graves.slice(0, 3).join(' | '));

await nav.close();
const echecs = res.filter(r => !r.c).length;
console.log(`\n${res.length - echecs}/${res.length} vérifications passées`);
process.exit(echecs ? 1 : 0);
