// Accord parental sous 15 ans : règle d'âge, lien à transmettre au parent,
// coordonnées du parent saisies à l'inscription. Les écrans sont dans
// src/EcranAccordParental.jsx ; la règle qui fait foi est côté serveur
// (public.sans_accord_parental).

export const AGE_SANS_ACCORD = 15

export function ageDepuis(dateNaissance) {
  if (!dateNaissance) return null
  const d = new Date(dateNaissance)
  if (isNaN(d.getTime())) return null
  const now = new Date()
  let a = now.getFullYear() - d.getFullYear()
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) a -= 1
  return a
}

// Même règle que le serveur : moins de 15 ans aujourd'hui et pas d'accord.
export function sansAccordParental(profil) {
  const age = ageDepuis(profil?.birthdate)
  return age !== null && age < AGE_SANS_ACCORD && !profil?.parental_consent_at
}

export function emailValide(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((email || '').trim())
}

// Le lien doit s'ouvrir dans le navigateur du parent. Sur le web, c'est
// l'adresse du site ; dans l'application iPhone, l'adresse locale
// (capacitor://…) ne mène nulle part : on prend alors l'adresse publique,
// VITE_URL_PUBLIQUE si elle est définie, sinon le site Netlify.
const URL_PUBLIQUE_PAR_DEFAUT = 'https://preeminent-dasik-ba7091.netlify.app'
export function lienAccordParental(jeton) {
  const web = typeof location !== 'undefined' && /^https?:$/.test(location.protocol)
  const base = web ? location.origin : (import.meta.env.VITE_URL_PUBLIQUE || URL_PUBLIQUE_PAR_DEFAUT)
  return `${base.replace(/\/$/, '')}/?accord=${jeton}`
}

// Le parent est désigné à l'inscription, avant que le compte existe : on le
// garde ici, et l'écran d'attente envoie la demande dès qu'il s'ouvre.
let parentInscription = null
export function noterParentInscription(nom, email) {
  parentInscription = { nom: nom.trim(), email: email.trim() }
}
export function prendreParentInscription() {
  const p = parentInscription
  parentInscription = null
  return p
}
