#!/usr/bin/env node
/**
 * Test de charge du feed Scolympia — sans dépendance (Node 18+).
 *
 *   node loadtest/quick.mjs
 *   node loadtest/quick.mjs --max 200 --duration 10
 *
 * Le principe : on augmente la concurrence par paliers et on mesure la
 * latence à chaque palier. Tant que la latence reste plate, le serveur
 * absorbe. Dès qu'elle grimpe, on a trouvé le plafond — c'est ce point
 * qui donne la capacité réelle, pas la latence d'une requête isolée.
 *
 * Lecture seule : aucune écriture en base.
 */
import { readFileSync } from 'node:fs';

// ── Configuration ──────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).join(' ').split('--').filter(Boolean)
    .map(s => s.trim().split(/\s+/)).map(([k, v]) => [k, v ?? true])
);

const PALIERS  = (args.paliers ?? '1,5,10,25,50,100').split(',').map(Number);
const MAX      = Number(args.max ?? Infinity);
const DUREE_S  = Number(args.duration ?? 8);
const PAGE     = Number(args.page ?? 20);
// Garde-fou : le plan gratuit inclut 5 Go/mois et un test consomme vite.
// Mesuré : ~14 Ko par page, soit ~118 Mo en 6 s à faible concurrence.
const BUDGET_MO = Number(args['budget-mo'] ?? 150);

function lireEnv() {
  let txt = '';
  try { txt = readFileSync(new URL('../.env', import.meta.url), 'utf8'); }
  catch {
    if (!args.url) { console.error('✖ Fichier .env introuvable à la racine du projet.'); process.exit(1); }
  }
  const get = (k) => txt.split('\n')
    .filter(l => !l.trim().startsWith('#'))
    .find(l => l.startsWith(k + '='))?.slice(k.length + 1).trim();
  const url = args.url ?? get('VITE_SUPABASE_URL');
  const key = args.key ?? get('VITE_SUPABASE_ANON_KEY');
  if (!url || !key) { console.error('✖ VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquant dans .env'); process.exit(1); }
  return { url, key };
}

const { url, key } = lireEnv();
const ENDPOINT = `${url}/rest/v1/rpc/get_feed`;
const HEADERS = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

// ── Une requête = une page de feed ─────────────────────────────
// On fait varier le curseur pour éviter de taper toujours la même
// page : sinon on mesurerait surtout l'efficacité d'un cache.
let curseurs = [null];

async function unePage() {
  const c = curseurs[Math.floor(Math.random() * curseurs.length)];
  const corps = JSON.stringify({
    p_limit: PAGE,
    p_cursor_created_at: c?.created_at ?? null,
    p_cursor_id: c?.id ?? null,
    p_sport: null,
  });
  const t0 = performance.now();
  try {
    const r = await fetch(ENDPOINT, { method: 'POST', headers: HEADERS, body: corps });
    const txt = await r.text();
    const ms = performance.now() - t0;
    if (!r.ok) return { ms, ok: false, octets: txt.length, statut: r.status };
    // On mémorise les curseurs rencontrés pour diversifier les pages suivantes
    try {
      const lignes = JSON.parse(txt);
      if (Array.isArray(lignes) && lignes.length) {
        const d = lignes[lignes.length - 1];
        if (curseurs.length < 40) curseurs.push({ created_at: d.created_at, id: d.id });
      }
    } catch { /* réponse non-JSON : comptée comme erreur plus bas */ }
    return { ms, ok: true, octets: txt.length, statut: r.status };
  } catch (e) {
    return { ms: performance.now() - t0, ok: false, octets: 0, statut: e.cause?.code ?? 'RESEAU' };
  }
}

const pct = (tri, p) => tri.length ? tri[Math.min(tri.length - 1, Math.floor(tri.length * p))] : 0;

// ── Un palier de concurrence ───────────────────────────────────
async function palier(concurrence, octetsRestants) {
  const latences = [];
  let erreurs = 0, octets = 0, total = 0;
  const statuts = new Map();
  const fin = Date.now() + DUREE_S * 1000;
  let stop = false;

  const worker = async () => {
    while (!stop && Date.now() < fin) {
      const r = await unePage();
      total++; octets += r.octets; latences.push(r.ms);
      if (!r.ok) { erreurs++; statuts.set(r.statut, (statuts.get(r.statut) ?? 0) + 1); }
      // Le budget est verifie ici, pas seulement en fin de palier :
      // sinon un palier a forte concurrence le depasse largement avant
      // qu'on ait la main.
      if (octets >= octetsRestants) stop = true;
    }
  };

  const t0 = Date.now();
  await Promise.all(Array.from({ length: concurrence }, worker));
  const secondes = (Date.now() - t0) / 1000;
  latences.sort((a, b) => a - b);

  return {
    budgetAtteint: octets >= octetsRestants,
    concurrence, total, secondes,
    debit: total / secondes,
    p50: pct(latences, 0.50), p95: pct(latences, 0.95), p99: pct(latences, 0.99),
    tauxErreur: total ? (erreurs / total) * 100 : 0,
    mo: octets / 1024 / 1024,
    statuts,
  };
}

// ── Programme principal ────────────────────────────────────────
console.log(`\nTest de charge — ${ENDPOINT}`);
console.log(`Paliers : ${PALIERS.filter(p => p <= MAX).join(', ')} · ${DUREE_S}s par palier · pages de ${PAGE}`);
console.log(`Budget de bande passante : ${BUDGET_MO} Mo (--budget-mo pour changer)\n`);

// Requête de contrôle avant de lancer quoi que ce soit
const controle = await unePage();
if (!controle.ok) {
  console.error(`✖ La requête de contrôle a échoué (${controle.statut}).`);
  const aide = {
    401: 'Clé refusée — vérifiez VITE_SUPABASE_ANON_KEY dans le .env.',
    403: 'Accès interdit. Souvent un proxy d\'entreprise ou une politique réseau, pas Supabase lui-même.',
    404: 'Fonction get_feed introuvable — la migration a-t-elle bien été appliquée sur CE projet ?',
    503: 'Projet probablement en pause. Réveillez-le depuis la console Supabase.',
  }[controle.statut];
  console.error('  ' + (aide ?? 'Vérifiez l\'URL et la clé du .env, et que le projet n\'est pas en pause.'));
  process.exit(1);
}
console.log(`✓ Contrôle OK — ${controle.ms.toFixed(0)} ms, ${(controle.octets / 1024).toFixed(1)} Ko par page\n`);

const entete = ['Concur.', 'req/s', 'p50 ms', 'p95 ms', 'p99 ms', 'erreurs', 'Mo'];
console.log(entete.map((h, i) => h.padStart(i ? 9 : 7)).join(' '));
console.log('─'.repeat(63));

let moTotal = 0, plafond = null;
for (const c of PALIERS.filter(p => p <= MAX)) {
  const r = await palier(c, (BUDGET_MO - moTotal) * 1024 * 1024);
  moTotal += r.mo;
  console.log([
    String(r.concurrence).padStart(7),
    r.debit.toFixed(0).padStart(9),
    r.p50.toFixed(0).padStart(9),
    r.p95.toFixed(0).padStart(9),
    r.p99.toFixed(0).padStart(9),
    (r.tauxErreur.toFixed(1) + '%').padStart(9),
    r.mo.toFixed(1).padStart(9),
  ].join(' '));

  if (r.statuts.size) {
    console.log(`         ↳ ${[...r.statuts].map(([s, n]) => `${s}×${n}`).join(', ')}`);
  }
  // Le plafond : au-delà, soit ça casse, soit la latence devient
  // perceptible par l'utilisateur.
  if (r.budgetAtteint || moTotal >= BUDGET_MO) {
    console.log(`\n⏹  Budget de ${BUDGET_MO} Mo atteint — arrêt volontaire pour préserver votre quota.`);
    console.log(`   Relancez avec --budget-mo <valeur> pour aller plus loin.`);
    break;
  }
  if (!plafond && (r.tauxErreur > 5 || r.p95 > 2000)) {
    plafond = r;
    console.log(`\n⚠  Plafond atteint à ${c} connexions simultanées `
      + `(p95 ${r.p95.toFixed(0)} ms, ${r.tauxErreur.toFixed(1)}% d'erreurs). Arrêt.`);
    break;
  }
}

console.log('─'.repeat(63));
console.log(`\nBande passante consommée : ${moTotal.toFixed(1)} Mo`
  + `  (quota plan gratuit : 5 120 Mo/mois)`);

console.log(`
Comment lire ces chiffres
  · Tant que p95 reste plat quand la concurrence monte, le serveur absorbe.
  · Dès que p95 grimpe fortement, vous avez trouvé la capacité réelle.
  · req/s au dernier palier sain = ce que l'infrastructure encaisse aujourd'hui.

Rappel : 10 000 utilisateurs ne font PAS 10 000 req/s. Un utilisateur qui
fait défiler charge 20 vidéos puis ne redemande rien pendant ~30 s, soit
environ 0,03 req/s par personne. 10 000 utilisateurs actifs représentent
donc de l'ordre de 300 req/s — comparez ce nombre au débit ci-dessus.
`);
