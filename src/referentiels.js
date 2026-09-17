import { useState, useEffect } from 'react';
import { supabase } from './supabase';

// ─── RÉFÉRENTIELS ────────────────────────────────────────────────
// Postes, catégories d'âge, saisons et niveaux de compétition vivent en
// base (tables positions / age_categories / seasons /
// competition_levels). Les charger plutôt que les coder en dur évite la
// dérive qui rendait les filtres muets sur `sport` : une liste figée
// côté client finit toujours par diverger de ce que la base accepte.
//
// Chargement unique pour toute l'application : la promesse est mise en
// cache au niveau du module, donc dix écrans qui montent en même temps
// déclenchent une seule requête.
let _refsPromise = null;

export function chargerReferentiels() {
  if (_refsPromise) return _refsPromise;
  _refsPromise = (async () => {
    const [pos, ages, seasons, levels, sports] = await Promise.all([
      supabase.from('positions').select('sport_id, id, label').order('sort_order'),
      supabase.from('age_categories').select('id, label').order('sort_order'),
      supabase.from('seasons').select('id, label, starts_on').order('sort_order'),
      supabase.from('competition_levels').select('id, label, rank').order('rank'),
      supabase.from('sports').select('id, has_jersey_number'),
    ]);
    const err = pos.error || ages.error || seasons.error || levels.error || sports.error;
    if (err) {
      console.error('Référentiels : chargement impossible', err);
      // On relâche le cache : un écran monté plus tard pourra réessayer.
      _refsPromise = null;
      throw err;
    }
    // Postes regroupés par sport, pour n'afficher que ceux du sport choisi.
    const postesParSport = {};
    for (const r of pos.data ?? []) {
      (postesParSport[r.sport_id] ||= []).push({ id: r.id, label: r.label });
    }
    // Le référentiel va de 2015-2016 à 2034-2035. Présenté tel quel, il
    // ouvrirait la liste sur une saison dix ans dans le futur. On met donc
    // la saison en cours en tête, puis les précédentes de la plus récente
    // à la plus ancienne, et on relègue les saisons à venir en fin de liste.
    const aujourdhui = new Date().toISOString().slice(0, 10);
    const toutes = seasons.data ?? [];
    const saisons = [
      ...toutes.filter(s => s.starts_on <= aujourdhui).reverse(),
      ...toutes.filter(s => s.starts_on > aujourdhui),
    ];
    return {
      postesParSport,
      categoriesAge: ages.data ?? [],
      saisons,
      niveauxCompetition: levels.data ?? [],
      // La base refuse un numéro de maillot sur un sport qui n'en porte
      // pas (trigger trg_check_jersey_number) : on lit la même source
      // plutôt que d'entretenir une seconde liste ici.
      sportsAvecMaillot: new Set((sports.data ?? []).filter(s => s.has_jersey_number).map(s => s.id)),
    };
  })();
  return _refsPromise;
}

const REFS_VIDES = {
  postesParSport: {}, categoriesAge: [], saisons: [],
  niveauxCompetition: [], sportsAvecMaillot: new Set(),
};

export function useReferentiels() {
  const [refs, setRefs] = useState(REFS_VIDES);
  useEffect(() => {
    let vivant = true;
    chargerReferentiels()
      .then(r => { if (vivant) setRefs(r); })
      .catch(() => { /* déjà journalisé ; les listes restent vides */ });
    return () => { vivant = false; };
  }, []);
  return refs;
}

// Compare deux libellés de poste sans tenir compte de la casse, des
// accents ni de la ponctuation : « Avant-centre », « avant centre » et
// « Avant  Centre » désignent le même poste.
export function normaliserPoste(s) {
  if (!s) return '';
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
