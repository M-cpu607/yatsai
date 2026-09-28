// Conditions d'utilisation : version en vigueur et enregistrement de
// l'acceptation. Les écrans sont dans src/EcranConditions.jsx.
import { supabase } from './supabase'

// Doit rester égale à public.version_conditions() côté base : le serveur
// refuse toute autre version. À changer (des deux côtés) à chaque
// modification de public/conditions.html.
export const VERSION_CONDITIONS = '2026-09-28'

// À l'inscription, le compte n'existe pas encore quand on coche la case, et
// l'application charge le profil pendant que l'inscription se termine. On
// note donc l'acceptation ici ; c'est l'application qui l'enregistre dès
// que le profil est là (voir enregistrerAcceptationEnAttente).
let acceptationEnAttente = null
export function noterAcceptationInscription() {
  acceptationEnAttente = VERSION_CONDITIONS
}

export function aUneAcceptationEnAttente() {
  return acceptationEnAttente === VERSION_CONDITIONS
}

export function conditionsAJour(profil) {
  return profil?.terms_version === VERSION_CONDITIONS
}

export async function accepter() {
  const { error } = await supabase.rpc('accepter_conditions', { p_version: VERSION_CONDITIONS })
  return error
}

// Rend true si une acceptation faite à l'inscription vient d'être enregistrée.
export async function enregistrerAcceptationEnAttente() {
  if (acceptationEnAttente !== VERSION_CONDITIONS) return false
  const error = await accepter()
  if (error) { console.error('Enregistrement des conditions :', error); return false }
  acceptationEnAttente = null
  return true
}
