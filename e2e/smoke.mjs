// Test de fumée : l'app tourne-t-elle vraiment, de l'accueil au feed ?
// Voir e2e/README.md.
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:4173';
const SHOT = process.env.SHOT_DIR ?? '.';
const res = [];
const ok = (n, c, d = '') => { res.push({ n, c, d }); console.log(`${c ? 'OK   ' : 'ECHEC'}  ${n}${d ? '  — ' + d : ''}`); };

const nav = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const ctx = await nav.newContext({ viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();

const erreurs = [];
page.on('console', m => { if (m.type() === 'error') erreurs.push(m.text()); });
const echecsReseau = [];
page.on('requestfailed', r => {
  // Chromium signale toute requête HEAD comme « interrompue » : sans corps
  // à lire, il coupe la lecture — même quand la réponse est arrivée et
  // qu'elle est bonne. Les comptages de Supabase passent par HEAD.
  if (r.method() === 'HEAD' && r.failure()?.errorText === 'net::ERR_ABORTED') return;
  echecsReseau.push(`${r.url()} :: ${r.failure()?.errorText}`);
});
page.on('pageerror', e => erreurs.push('PAGEERROR: ' + e.message));

// La page d'accueil pose un halo décoratif par-dessus ses boutons : un clic
// aux coordonnées l'atteindrait lui. On déclenche donc le clic sur l'élément.
const clic = async (motif, attente = 700) => {
  const el = page.getByText(motif).first();
  if (!(await el.count())) return false;
  await el.evaluate(e => e.click());
  await page.waitForTimeout(attente);
  return true;
};

// ── 1. Accueil, puis écran de connexion ──
// L'écran de lancement dure 3 s au minimum, et la page d'accueil s'intercale
// avant l'authentification : les attendre, sinon tout le reste échoue.
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4200);
ok('Page d\'accueil affichée', (await page.textContent('body')).includes('Yatsai'));
await page.screenshot({ path: `${SHOT}/1-accueil.png` });

await clic(/se connecter/i);
const aFormulaire = await page.locator('input[type="email"]').count() > 0;
ok('Écran de connexion affiché', aFormulaire);

// ── 2. « Mot de passe oublié » ──
const aLienOubli = await page.getByText(/mot de passe oublié/i).count() > 0;
ok('Lien « mot de passe oublié » présent', aLienOubli);
if (aLienOubli) {
  await clic(/mot de passe oublié/i);
  ok('Écran de réinitialisation atteignable',
     (await page.textContent('body')).includes('Envoyer le lien'));
  await clic(/retour à la connexion/i);
}

// ── 3. Connexion ──
await page.fill('input[type="email"]', 'andreas@example.com');
await page.fill('input[type="password"]', 'motdepasse123');
await page.click('button[type="submit"]');
await page.waitForTimeout(2500);
await clic(/plus tard/i, 400);            // écarter la bannière de saison

// ── 4. Le feed s'affiche ──
const corps = await page.textContent('body');
ok('Feed rendu après connexion', corps.includes('Highlights saison 2026'));
ok('Pas d\'état vide "Aucune vidéo"', !corps.includes('Aucune vidéo encore'));

// Les colonnes que `get_feed` doit rendre, vues depuis l'écran. Si l'une
// disparaît du contrat serveur, c'est ici que ça se voit.
ok('Niveau de l\'adversaire affiché', /Régional|National|District|International|Loisir/.test(corps),
   'colonne opponent_level');
// La saison a été RETIRÉE de la carte : la date de match la contient déjà,
// et les afficher toutes les deux disait deux fois la même chose. Le test
// vérifie donc l'inverse de ce qu'il vérifiait avant.
ok('Date du match affichée', /\d\d\/\d\d\/\d{4}/.test(corps), 'colonne match_date');
ok('Saison absente de la carte', !/20\d\d-20\d\d/.test(corps),
   'la date la contient : l\'afficher aussi ferait doublon');
await page.screenshot({ path: `${SHOT}/2-feed.png` });

// ── 5. Pagination par curseur ──
// Le feed ne doit PAS tout charger d'un coup : une première page, puis les
// suivantes à l'approche du bas.
const compter = async () =>
  (await page.textContent('body')).match(/Highlights saison 2026/g)?.length ?? 0;
const avant = await compter();
ok('Première page limitée', avant > 0 && avant <= 25, `${avant} cartes au chargement`);

const scroller = page.locator('div.overflow-y-auto').first();
if (await scroller.count()) {
  for (let i = 0; i < 8; i++) {
    await scroller.evaluate(el => { el.scrollTop = el.scrollHeight; });
    await page.waitForTimeout(400);
  }
}
const apres = await compter();
ok('Défilement infini charge une page suivante', apres > avant, `${avant} → ${apres} cartes`);
await page.screenshot({ path: `${SHOT}/3-scroll.png` });

// YouTube a été retiré : seules les vidéos filmées ou importées s'affichent.
// Le faux fil contient un ancien lien YouTube, sans fichier : il ne doit
// apparaître nulle part. Toutes les autres cartes ont leur miniature.
{
  const corpsFil = await page.textContent('body');
  ok('Ancien lien YouTube écarté du fil', !corpsFil.includes('Ancien lien YouTube'));
  const iframesYouTube = await page.locator('iframe[src*="youtube"]').count();
  ok('Aucun lecteur YouTube dans le fil', iframesYouTube === 0, `${iframesYouTube} iframe(s)`);
}

// ── 6. Les référentiels alimentent le formulaire de publication ──
await page.locator('nav button').nth(2).evaluate(e => e.click());
await page.waitForTimeout(1500);
// Le bloc « Le contexte » arrive replié : seul « Sport » est visible avant.
const avantOuverture = await page.locator('select').count();
ok('Bloc « Le contexte » replié à l\'ouverture', avantOuverture < 3,
   `${avantOuverture} liste${avantOuverture > 1 ? 's' : ''} visible${avantOuverture > 1 ? 's' : ''} sur 5`);
ok('Publication : plus d\'option YouTube',
   !(await page.textContent('body')).includes('Lien YouTube'),
   'seules les vidéos filmées ou importées se publient');
await page.getByText('Le contexte').first().evaluate(e => e.click());
await page.waitForTimeout(500);
const listes = page.locator('select');
const nbListes = await listes.count();
ok('Formulaire de publication : listes déroulantes', nbListes >= 5, `${nbListes} listes`);
if (nbListes >= 4) {
  const postes = await listes.nth(1).locator('option').allTextContents();
  ok('Postes restreints au sport choisi', postes.length > 1 && postes.length < 30,
     postes.slice(1, 4).join(', '));
  const saisons = await listes.nth(3).locator('option').allTextContents();
  const premiere = saisons[1] ?? '';
  const anneeCourante = new Date().getFullYear();
  ok('Saisons ordonnées : la courante en tête',
     Number(premiere.slice(0, 4)) >= anneeCourante - 1 && Number(premiere.slice(0, 4)) <= anneeCourante + 1,
     `première proposée : ${premiere}`);
}

// ── 7. La recherche passe par le serveur ──
await page.locator('nav button').nth(1).evaluate(e => e.click());
await page.waitForTimeout(2000);
const corpsRecherche = await page.textContent('body');
ok('Recherche : résultats rendus', /utilisateur|athlète/.test(corpsRecherche));
ok('Compte annoncé comme « affichés », pas « trouvés »', /affich/i.test(corpsRecherche),
   'la liste est paginée : annoncer un total qu\'on n\'a pas serait faux');
await page.screenshot({ path: `${SHOT}/4-recherche.png` });

// ── 7 bis. Le profil ──
// Galerie en vignettes (le faux backend donne sept vidéos au profil
// connecté) et ligne d'identité sans séparateur orphelin.
await page.locator('nav button').nth(4).evaluate(e => e.click());
await page.waitForTimeout(2000);
await clic(/plus tard/i, 400);
{
  const vignettes = await page.locator('[aria-label="Options de la vidéo"]').count();
  ok('Profil : galerie de vidéos', vignettes === 7, `${vignettes} vignettes sur 7`);
  const lignes = (await page.locator('body').innerText()).split('\n').map(l => l.trim());
  ok('Profil : aucune ligne qui commence par « · »', !lignes.some(l => l.startsWith('·')));
}
await page.screenshot({ path: `${SHOT}/5-profil.png` });

// ── 8. Aucune erreur applicative ──
// Le proxy de cet environnement bloque tout hôte externe. On distingue donc
// les échecs réseau externes (attendus) des erreurs applicatives.
const externes = echecsReseau.filter(u => /youtube|ytimg|gstatic|googleapis|fonts/.test(u));
const internes = echecsReseau.filter(u => !/youtube|ytimg|gstatic|googleapis|fonts/.test(u));
console.log(`\n  ressources externes bloquées par le proxy : ${externes.length}`);
if (internes.length) internes.slice(0, 5).forEach(u => console.log('    INTERNE ' + u.slice(0, 110)));

const graves = erreurs.filter(e =>
  !/favicon|React DevTools|ERR_TUNNEL_CONNECTION_FAILED|ERR_CERT_AUTHORITY_INVALID|Failed to load resource|WebSocket/i.test(e));
ok('Aucune requête applicative en échec', internes.length === 0, internes.slice(0, 2).join(' | '));
ok('Aucune erreur JavaScript applicative', graves.length === 0, graves.slice(0, 3).join(' | '));

await nav.close();
const echecs = res.filter(r => !r.c).length;
console.log(`\n${res.length - echecs}/${res.length} vérifications passées`);
process.exit(echecs ? 1 : 0);
