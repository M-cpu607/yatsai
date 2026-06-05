import React, { useState, useRef } from 'react'
import { supabase } from './supabase'
import { Loader2, Mail, Lock, User as UserIcon, Building2, Calendar, MapPin, Flag, Trophy, Upload, FileCheck2 } from 'lucide-react'

// Liste des postes par sport (doit rester en phase avec App.jsx)
const POSITIONS_BY_SPORT = {
  foot: ['Gardien', 'Défenseur central', 'Latéral droit', 'Latéral gauche',
         'Milieu défensif', 'Milieu central', 'Milieu offensif',
         'Ailier droit', 'Ailier gauche', 'Avant-centre', 'Attaquant'],
  basket: ['Meneur', 'Arrière', 'Ailier', 'Ailier fort', 'Pivot'],
  hand: ['Gardien', 'Arrière gauche', 'Arrière droit', 'Demi-centre',
         'Ailier gauche', 'Ailier droit', 'Pivot'],
  rugby: ['Pilier', 'Talonneur', 'Deuxième ligne', 'Troisième ligne aile',
          'Troisième ligne centre', 'Demi de mêlée', 'Demi d\'ouverture',
          'Centre', 'Ailier', 'Arrière'],
  volley: ['Passeur', 'Pointu', 'Réceptionneur-attaquant', 'Central', 'Libéro'],
  'football-us': ['Quarterback', 'Running back', 'Wide receiver', 'Tight end',
                  'Offensive lineman', 'Defensive lineman', 'Linebacker',
                  'Cornerback', 'Safety', 'Kicker', 'Punter'],
  baseball: ['Lanceur', 'Receveur', 'Première base', 'Deuxième base',
             'Troisième base', 'Arrêt-court', 'Champ gauche', 'Champ centre',
             'Champ droit', 'Frappeur désigné'],
  hockey: ['Gardien', 'Défenseur', 'Ailier gauche', 'Ailier droit', 'Centre'],
  cricket: ['Batteur', 'Lanceur', 'Tout-rounder', 'Gardien de guichet'],
  athle: ['Sprint', 'Demi-fond', 'Fond', 'Haies', 'Marathon',
          'Saut en hauteur', 'Saut en longueur', 'Triple saut', 'Perche',
          'Lancer de poids', 'Lancer de disque', 'Lancer de javelot',
          'Marteau', 'Décathlon / Heptathlon'],
  nat: ['Crawl', 'Brasse', 'Dos', 'Papillon', '4 nages', 'Eau libre', 'Synchronisée'],
  cyclo: ['Sprinteur', 'Rouleur', 'Grimpeur', 'Puncheur', 'Contre-la-montre'],
}
const LEVELS_REQUIRING_PROOF = ['young_pro', 'senior_pro']

const C = {
  bg: '#080F20',
  surface: '#0F172A',
  surface2: '#16213A',
  border: 'rgba(255,255,255,0.06)',
  borderGold: 'rgba(255,184,0,0.25)',
  gold: '#FFB800',
  goldSoft: 'rgba(255,184,0,0.12)',
  text: '#FFFFFF',
  textDim: 'rgba(255,255,255,0.6)',
  textMute: 'rgba(255,255,255,0.4)',
  red: '#FF4757',
  green: '#22C55E',
}

// Liste compacte des sports (alignée avec SPORTS dans App.jsx)
const SPORTS = [
  { id: 'foot', label: 'Football', icon: '⚽' },
  { id: 'basket', label: 'Basketball', icon: '🏀' },
  { id: 'athle', label: 'Athlétisme', icon: '🏃' },
  { id: 'nat', label: 'Natation', icon: '🏊' },
  { id: 'tennis', label: 'Tennis', icon: '🎾' },
  { id: 'rugby', label: 'Rugby', icon: '🏉' },
  { id: 'hand', label: 'Handball', icon: '🤾' },
  { id: 'box', label: 'Boxe', icon: '🥊' },
  { id: 'mma', label: 'MMA', icon: '🥋' },
  { id: 'volley', label: 'Volleyball', icon: '🏐' },
  { id: 'badminton', label: 'Badminton', icon: '🏸' },
  { id: 'pingpong', label: 'Tennis de table', icon: '🏓' },
  { id: 'karting', label: 'Karting', icon: '🏎️' },
  { id: 'golf', label: 'Golf', icon: '⛳' },
  { id: 'cyclo', label: 'Cyclisme', icon: '🚴' },
  { id: 'esport', label: 'Esport', icon: '🎮' },
  { id: 'cricket', label: 'Cricket', icon: '🏏' },
  { id: 'football-us', label: 'Football américain', icon: '🏈' },
  { id: 'baseball', label: 'Baseball', icon: '⚾' },
  { id: 'hockey', label: 'Hockey sur glace', icon: '🏒' },
]

// ─── UI helpers (DÉFINIS HORS du composant pour rester stables) ──
// Sinon React les recrée à chaque render → unmount/remount + perte de focus.
function Section({ title, hint, children }) {
  return (
    <div className="mt-1">
      <div className="text-sm font-bold mb-1" style={{ color: C.text, letterSpacing: '-0.01em' }}>
        {title}
      </div>
      {hint && (
        <div className="text-[11px] mb-2" style={{ color: C.textMute }}>
          {hint}
        </div>
      )}
      {!hint && <div className="mb-2" />}
      {children}
    </div>
  )
}

const LEVELS = [
  { id: 'amateur',         label: 'Amateur',         desc: 'Joueur de loisir',                 icon: '🌱' },
  { id: 'young_pro',       label: 'Young Pro',       desc: 'Centre de formation / espoir pro', icon: '🚀' },
  { id: 'senior_amateur',  label: 'Senior Amateur',  desc: 'Adulte non rémunéré',              icon: '⭐' },
  { id: 'senior_semi_pro', label: 'Senior Semi-Pro', desc: 'Compensé sans contrat pro',        icon: '⭐⭐' },
  { id: 'senior_pro',      label: 'Senior Pro',      desc: 'Contrat professionnel',            icon: '⭐⭐⭐' },
]

export default function Auth({ initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode === 'signup' ? 'signup' : 'login')
  const [role, setRole] = useState('athlete')
  // Champs communs
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  // Athlète
  const [gender, setGender] = useState(null)        // 'M' | 'F' | 'O'
  const [birthdate, setBirthdate] = useState('')    // YYYY-MM-DD, non modifiable après inscription
  const [nationality, setNationality] = useState('')
  const [sport, setSport] = useState('')
  const [position, setPosition] = useState('')      // poste choisi dans la liste du sport
  const [hasClub, setHasClub] = useState(null)      // true | false
  const [club, setClub] = useState('')
  const [level, setLevel] = useState('')
  const [levelProofFile, setLevelProofFile] = useState(null) // preuve pour young_pro / senior_pro
  const proofInputRef = useRef(null)
  // Recruteur
  const [organization, setOrganization] = useState('')
  const [recruitingGender, setRecruitingGender] = useState('all')   // 'all' | 'M' | 'F' | 'O'
  const [recruitingLevels, setRecruitingLevels] = useState([])      // array de levels
  const [recruitingAgeMin, setRecruitingAgeMin] = useState('')
  const [recruitingAgeMax, setRecruitingAgeMax] = useState('')
  // Commun
  const [country, setCountry] = useState('')
  const [region, setRegion] = useState('')
  const [city, setCity] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  // Multi-étapes en mode inscription : 0 = profil, 1 = pratique, 2 = localisation + identifiants
  const [signupStep, setSignupStep] = useState(0)
  // Total dynamique : observateur a 2 étapes, athlète/recruteur en ont 3

  const isAthlete = role === 'athlete'
  const isRecruiter = role === 'recruiter'
  const isObserver = role === 'observer'

  // Calcul de l'âge à partir de la date de naissance (auto, change chaque année)
  const computeAgeFromBirthdate = (bd) => {
    if (!bd) return null
    const d = new Date(bd)
    if (isNaN(d.getTime())) return null
    const now = new Date()
    let a = now.getFullYear() - d.getFullYear()
    const hadBirthday = (now.getMonth() > d.getMonth()) ||
      (now.getMonth() === d.getMonth() && now.getDate() >= d.getDate())
    if (!hadBirthday) a -= 1
    return a >= 0 ? a : null
  }
  const computedAge = computeAgeFromBirthdate(birthdate)
  const ageOk = computedAge !== null && computedAge >= 10 && computedAge <= 100
  // Pour la date max autorisée à l'input (= aujourd'hui - 10 ans, prudence)
  const maxBirthdate = (() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 10)
    return d.toISOString().split('T')[0]
  })()

  // Validation côté athlète
  // - Niveau requis dans tous les cas.
  // - Si en club : nom du club requis aussi.
  // - Si young_pro/senior_pro : preuve obligatoire avant de soumettre.
  const needsProof = LEVELS_REQUIRING_PROOF.includes(level)
  const athleteReady = isAthlete && fullName.trim() && gender && ageOk && hasClub !== null
    && level
    && (hasClub === false || club.trim())
    && (!needsProof || !!levelProofFile)
  const recruiterReady = isRecruiter && fullName.trim() && organization.trim()
    && gender && ageOk && sport && recruitingGender
    && recruitingLevels.length > 0
    && recruitingAgeMin !== '' && recruitingAgeMax !== ''
    && Number(recruitingAgeMin) <= Number(recruitingAgeMax)
  // Observateur : juste un nom (date de naissance et genre non demandés)
  const observerReady = isObserver && fullName.trim()
  const baseReady = email.trim() && password.length >= 6

  // Validation par étape (inscription)
  // Pour les observateurs : pas besoin de genre/date naissance — uniquement nom.
  const step0Ready = isObserver
    ? (role && fullName.trim())
    : (role && fullName.trim() && gender && ageOk)
  const step1Ready = isAthlete
    ? (sport && hasClub !== null && level && (hasClub === false || club.trim())
        && (!needsProof || !!levelProofFile))
    : (organization.trim() && sport && recruitingGender
        && recruitingLevels.length > 0
        && recruitingAgeMin !== '' && recruitingAgeMax !== ''
        && Number(recruitingAgeMin) <= Number(recruitingAgeMax))
  const step2Ready = baseReady // localisation optionnelle

  // L'observateur n'a que 2 étapes : Profil → Identifiants (skip "pratique").
  const STEP_LABELS = isObserver
    ? ['Profil', 'Identifiants']
    : ['Profil', isAthlete ? 'Ta pratique' : 'Ton activité', 'Finalisation']
  const stepReady = isObserver
    ? [step0Ready, step2Ready]
    : [step0Ready, step1Ready, step2Ready]

  const canSubmit = mode === 'login'
    ? baseReady
    : baseReady && (athleteReady || recruiterReady || observerReady)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null); setMessage(null); setLoading(true)

    try {
      if (mode === 'signup') {
        // Pour les athlètes : on conserve le niveau choisi par l'athlète,
        // que ce soit avec ou sans club. Le statut "sans club" est dérivé
        // du champ `club` vide côté UI.
        const effectiveLevel = isAthlete ? (level || null) : null
        const metadata = {
          full_name: fullName.trim(),
          is_recruiter: isRecruiter,
          role, // 'athlete' | 'recruiter' | 'observer'
        }
        if (isAthlete) {
          metadata.gender = gender
          metadata.birthdate = birthdate || null
          metadata.age = computedAge !== null ? String(computedAge) : null
          metadata.nationality = nationality.trim() || null
          metadata.sport = sport || null
          metadata.position = position || null
          metadata.has_club = hasClub === true ? 'true' : 'false'
          metadata.club = (hasClub === true && club.trim()) ? club.trim() : null
          metadata.level = effectiveLevel
        }
        if (isRecruiter) {
          metadata.gender = gender
          metadata.birthdate = birthdate || null
          metadata.age = computedAge !== null ? String(computedAge) : null
          metadata.nationality = nationality.trim() || null
          metadata.sport = sport || null
          metadata.organization = organization.trim() || null
          metadata.recruiting_gender = recruitingGender
          metadata.recruiting_levels = recruitingLevels.join(',')
          metadata.recruiting_age_min = recruitingAgeMin !== '' ? String(Number(recruitingAgeMin)) : null
          metadata.recruiting_age_max = recruitingAgeMax !== '' ? String(Number(recruitingAgeMax)) : null
        }
        if (country.trim()) metadata.country = country.trim()
        if (region.trim())  metadata.region  = region.trim()
        if (city.trim())    metadata.city    = city.trim()

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: metadata },
        })
        if (error) throw error

        // Fallback : si le trigger n'a pas pu remplir (anciens projets), on UPDATE.
        if (data.user?.id) {
          const profileUpdate = {
            full_name: fullName.trim(),
            is_recruiter: isRecruiter,
            role, // 'athlete' | 'recruiter' | 'observer'
            country: country.trim() || null,
            region: region.trim() || null,
            city: city.trim() || null,
          }
          if (isAthlete) {
            profileUpdate.gender = gender
            profileUpdate.birthdate = birthdate || null
            profileUpdate.age = computedAge // cache, mais source de vérité = birthdate
            profileUpdate.nationality = nationality.trim() || null
            profileUpdate.sport = sport || null
            profileUpdate.position = position || null
            profileUpdate.has_club = hasClub
            profileUpdate.club = (hasClub === true && club.trim()) ? club.trim() : null
            profileUpdate.level = effectiveLevel
            // Statut de la preuve : 'none' par défaut, 'pending' si preuve attachée
            // pour un niveau qui en exige une.
            if (needsProof) {
              profileUpdate.level_proof_status = 'pending'
            } else {
              profileUpdate.level_proof_status = 'none'
            }
          } else if (isRecruiter) {
            profileUpdate.gender = gender
            profileUpdate.birthdate = birthdate || null
            profileUpdate.age = computedAge
            profileUpdate.nationality = nationality.trim() || null
            profileUpdate.sport = sport || null
            profileUpdate.organization = organization.trim() || null
            profileUpdate.recruiting_gender = recruitingGender
            profileUpdate.recruiting_levels = recruitingLevels
            profileUpdate.recruiting_age_min = recruitingAgeMin !== '' ? Number(recruitingAgeMin) : null
            profileUpdate.recruiting_age_max = recruitingAgeMax !== '' ? Number(recruitingAgeMax) : null
          }
          // Observateur : on n'écrit que le nom + email + localisation (déjà inclus ci-dessus).
          // Pas de sport, pas de niveau, pas de critères de recrutement.
          await supabase.from('profiles').update(profileUpdate).eq('id', data.user.id)

          // Upload de la preuve de niveau si fournie (young_pro / senior_pro)
          if (isAthlete && needsProof && levelProofFile) {
            try {
              const ext = (levelProofFile.name.split('.').pop() || 'jpg').toLowerCase()
              const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(ext) ? ext : 'jpg'
              const path = `${data.user.id}/${Date.now()}.${safeExt}`
              const { error: upErr } = await supabase.storage
                .from('level-proofs')
                .upload(path, levelProofFile, { cacheControl: '3600', upsert: false, contentType: levelProofFile.type })
              if (!upErr) {
                // On stocke le path interne (le bucket est privé, on lira via signed URL si besoin)
                await supabase.from('profiles')
                  .update({ level_proof_url: path, level_proof_status: 'pending' })
                  .eq('id', data.user.id)
              } else {
                console.warn('Upload preuve niveau échec :', upErr.message)
              }
            } catch (e) {
              console.warn('Erreur preuve niveau :', e)
            }
          }
        }

        // Le trigger DB `handle_new_user` crée déjà le profil COMPLET à partir
        // des metadata (role, birthdate, sport, niveau…). L'utilisateur est donc
        // auto-connecté avec un profil correct : on le laisse entrer directement
        // dans l'app, sans le forcer à se reconnecter.
        setMessage('Compte créé ! Bienvenue 🎉')
        // (la session active déclenche le rendu de l'app principale dans App.jsx)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8"
      style={{ backgroundColor: C.bg }}>
      <div className="mb-6 mt-4">
        <div className="text-4xl font-extrabold text-center" style={{ color: C.text }}>
          Yat<span style={{ color: C.gold }}>sai</span>
        </div>
        <p className="text-sm text-center mt-2" style={{ color: C.textDim }}>
          {mode === 'signup' ? 'Crée ton compte' : 'Connecte-toi'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-3">
        {/* Progress bar de l'inscription (3 étapes) */}
        {mode === 'signup' && (
          <div className="mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: C.textDim }}>
                Étape {signupStep + 1} / {STEP_LABELS.length} · <span style={{ color: C.gold }}>{STEP_LABELS[signupStep]}</span>
              </span>
              <span className="text-[10px]" style={{ color: C.textMute }}>
                {Math.round(((signupStep + 1) / STEP_LABELS.length) * 100)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: C.surface }}>
              <div className="h-full transition-all duration-300"
                style={{ width: `${((signupStep + 1) / STEP_LABELS.length) * 100}%`, backgroundColor: C.gold }} />
            </div>
          </div>
        )}

        {/* ========== Contenu des étapes (inscription) ========== */}
        {mode === 'signup' && (
          <>
            {/* Étape 0 : rôle + nom (visibles uniquement à l'étape 0) */}
            {signupStep === 0 && (
              <>
                <Section title="Je suis…">
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => setRole('athlete')}
                  className="py-3 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: isAthlete ? C.goldSoft : C.surface,
                    color: isAthlete ? C.gold : C.text,
                    border: `1px solid ${isAthlete ? C.gold : C.border}`,
                  }}>
                  ⚽ Athlète
                </button>
                <button type="button" onClick={() => setRole('recruiter')}
                  className="py-3 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: isRecruiter ? C.goldSoft : C.surface,
                    color: isRecruiter ? C.gold : C.text,
                    border: `1px solid ${isRecruiter ? C.gold : C.border}`,
                  }}>
                  💼 Recruteur
                </button>
                <button type="button" onClick={() => setRole('observer')}
                  className="py-3 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: isObserver ? C.goldSoft : C.surface,
                    color: isObserver ? C.gold : C.text,
                    border: `1px solid ${isObserver ? C.gold : C.border}`,
                  }}>
                  👀 Observateur
                </button>
              </div>
              {isObserver && (
                <p className="text-[11px] mt-2" style={{ color: C.textMute }}>
                  Tu pourras enregistrer les vidéos que tu aimes, suivre des athlètes
                  et explorer le feed. Pas de publication ni de recrutement.
                </p>
              )}
            </Section>

                {/* Nom */}
                <Section title="Comment t'appelles-tu ?">
                  <div className="relative">
                    <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: C.textDim }} />
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ton nom complet" required maxLength={80}
                      className="w-full pl-10 pr-3 py-3 rounded-xl text-sm outline-none"
                      style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
                  </div>
                </Section>
              </>
            )}

            {/* ===== ATHLÈTE — ÉTAPE 0 (identité) ===== */}
            {isAthlete && signupStep === 0 && (
              <>
                {/* Genre */}
                <Section title="Genre">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'M', label: '♂ Homme' },
                      { id: 'F', label: '♀ Femme' },
                      { id: 'O', label: '⚧ Autre' },
                    ].map(opt => {
                      const active = gender === opt.id
                      return (
                        <button key={opt.id} type="button" onClick={() => setGender(opt.id)}
                          className="py-2.5 rounded-xl text-xs font-semibold"
                          style={{
                            backgroundColor: active ? C.goldSoft : C.surface,
                            color: active ? C.gold : C.text,
                            border: `1px solid ${active ? C.gold : C.border}`,
                          }}>
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </Section>

                {/* Date de naissance (non modifiable après inscription) */}
                <Section title="Quelle est ta date de naissance ?"
                  hint="Non modifiable après création. Ton âge se mettra à jour automatiquement chaque année.">
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: C.textDim }} />
                    <input type="date" value={birthdate}
                      onChange={(e) => setBirthdate(e.target.value)}
                      required
                      max={maxBirthdate}
                      min="1925-01-01"
                      className="w-full pl-10 pr-3 py-3 rounded-xl text-sm outline-none"
                      style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}`, colorScheme: 'dark' }} />
                  </div>
                  {birthdate && (
                    <p className="text-[11px] mt-1.5"
                      style={{ color: ageOk ? C.gold : C.red }}>
                      {ageOk
                        ? `Âge actuel : ${computedAge} ans`
                        : `Âge invalide (doit être entre 10 et 100 ans)`}
                    </p>
                  )}
                </Section>

                {/* Nationalité */}
                <Section title="Ta nationalité">
                  <div className="relative">
                    <Flag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: C.textDim }} />
                    <input type="text" value={nationality} onChange={(e) => setNationality(e.target.value)}
                      placeholder="Ex : Française, Sénégalaise…" maxLength={60}
                      className="w-full pl-10 pr-3 py-3 rounded-xl text-sm outline-none"
                      style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
                  </div>
                </Section>
              </>
            )}

            {/* ===== ATHLÈTE — ÉTAPE 1 (pratique sportive) ===== */}
            {isAthlete && signupStep === 1 && (
              <>
                {/* Sport */}
                <Section title="Ton sport principal">
                  <select value={sport} onChange={(e) => { setSport(e.target.value); setPosition('') }}
                    className="w-full px-3 py-3 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }}>
                    <option value="">— Choisir un sport —</option>
                    {SPORTS.map(s => (
                      <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                    ))}
                  </select>
                </Section>

                {/* Poste — champ texte libre */}
                {sport && (
                  <Section title="Ton poste / ta spécialité (optionnel)">
                    <input type="text" value={position} onChange={(e) => setPosition(e.target.value)}
                      placeholder="Ex : Milieu offensif, Gardien, 100 m, simple…"
                      maxLength={60}
                      className="w-full px-3 py-3 rounded-xl text-sm outline-none"
                      style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
                  </Section>
                )}

                {/* Inscrit en club ? */}
                <Section title="Es-tu inscrit en club ?">
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => { setHasClub(true) }}
                      className="py-3 rounded-xl text-sm font-semibold"
                      style={{
                        backgroundColor: hasClub === true ? C.goldSoft : C.surface,
                        color: hasClub === true ? C.gold : C.text,
                        border: `1px solid ${hasClub === true ? C.gold : C.border}`,
                      }}>
                      ✅ Oui
                    </button>
                    <button type="button" onClick={() => { setHasClub(false); setClub(''); setLevel('') }}
                      className="py-3 rounded-xl text-sm font-semibold"
                      style={{
                        backgroundColor: hasClub === false ? C.goldSoft : C.surface,
                        color: hasClub === false ? C.gold : C.text,
                        border: `1px solid ${hasClub === false ? C.gold : C.border}`,
                      }}>
                      ❌ Non
                    </button>
                  </div>
                </Section>

                {/* Si en club : nom du club */}
                {hasClub === true && (
                  <Section title="Nom de ton club">
                    <div className="relative">
                      <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                        style={{ color: C.textDim }} />
                      <input type="text" value={club} onChange={(e) => setClub(e.target.value)}
                        placeholder="Ex : OL Centre Formation" maxLength={80}
                        className="w-full pl-10 pr-3 py-3 rounded-xl text-sm outline-none"
                        style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
                    </div>
                  </Section>
                )}

                {/* Si pas en club : message d'info */}
                {hasClub === false && (
                  <div className="rounded-xl px-3 py-2.5 flex items-start gap-2"
                    style={{ backgroundColor: C.goldSoft, border: `1px solid ${C.borderGold}` }}>
                    <Trophy size={14} style={{ color: C.gold }} className="mt-0.5 flex-shrink-0" />
                    <p className="text-[11px]" style={{ color: C.textDim }}>
                      Tu seras affiché comme <strong style={{ color: C.text }}>« sans club »</strong>.
                      Indique quand même ton niveau ci-dessous : les recruteurs pourront te repérer pour te proposer une structure adaptée.
                    </p>
                  </div>
                )}

                {/* NIVEAU — toujours requis, avec ou sans club */}
                {hasClub !== null && (
                  <Section title="Quel est ton niveau ?">
                    <div className="flex flex-col gap-1.5">
                      {LEVELS.map(lv => {
                        const active = level === lv.id
                        return (
                          <button key={lv.id} type="button"
                            onClick={() => { setLevel(lv.id); if (!LEVELS_REQUIRING_PROOF.includes(lv.id)) setLevelProofFile(null) }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm"
                            style={{
                              backgroundColor: active ? C.goldSoft : C.surface,
                              color: active ? C.gold : C.text,
                              border: `1px solid ${active ? C.gold : C.border}`,
                            }}>
                            <span>{lv.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold">{lv.label}</div>
                              <div className="text-[10px]" style={{ color: C.textMute }}>{lv.desc}</div>
                            </div>
                            {LEVELS_REQUIRING_PROOF.includes(lv.id) && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                                style={{ backgroundColor: 'rgba(255,184,0,0.15)', color: C.gold, border: `1px solid ${C.borderGold}` }}>
                                Preuve requise
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </Section>
                )}

                {/* PREUVE DE NIVEAU — affichée uniquement si young_pro / senior_pro choisi */}
                {needsProof && (
                  <Section title="Preuve de ton niveau">
                    <p className="text-[11px] mb-2" style={{ color: C.textMute }}>
                      Pour afficher le niveau <strong style={{ color: C.gold }}>{LEVELS.find(l => l.id === level)?.label}</strong> sur ton profil,
                      joins un document qui le justifie (contrat, licence, attestation du club…). PDF ou image (max 10 Mo).
                    </p>
                    <input ref={proofInputRef} type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (!f) return
                        if (f.size > 10 * 1024 * 1024) {
                          setError('Le fichier dépasse 10 Mo.')
                          return
                        }
                        setError(null)
                        setLevelProofFile(f)
                      }} />
                    {!levelProofFile ? (
                      <button type="button" onClick={() => proofInputRef.current?.click()}
                        className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
                        style={{ backgroundColor: C.surface, color: C.gold, border: `1.5px dashed ${C.borderGold}` }}>
                        <Upload size={15} />
                        Joindre la preuve
                      </button>
                    ) : (
                      <div className="rounded-xl p-3 flex items-center gap-2.5"
                        style={{ backgroundColor: C.surface, border: `1px solid ${C.borderGold}` }}>
                        <FileCheck2 size={18} style={{ color: C.gold, flexShrink: 0 }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold truncate" style={{ color: C.text }}>{levelProofFile.name}</div>
                          <div className="text-[10px]" style={{ color: C.textDim }}>
                            {(levelProofFile.size / 1024 / 1024).toFixed(2)} Mo · En attente de vérification
                          </div>
                        </div>
                        <button type="button"
                          onClick={() => { setLevelProofFile(null); if (proofInputRef.current) proofInputRef.current.value = '' }}
                          className="px-2 py-1 rounded text-[10px] font-bold"
                          style={{ color: C.red, border: `1px solid ${C.red}` }}>
                          Retirer
                        </button>
                      </div>
                    )}
                  </Section>
                )}
              </>
            )}

            {/* ===== RECRUTEUR ===== */}
            {/* ===== RECRUTEUR — ÉTAPE 0 (identité) ===== */}
            {isRecruiter && signupStep === 0 && (
              <>
                {/* Identité recruteur */}
                <Section title="Genre">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'M', label: '♂ Homme' },
                      { id: 'F', label: '♀ Femme' },
                      { id: 'O', label: '⚧ Autre' },
                    ].map(opt => {
                      const active = gender === opt.id
                      return (
                        <button key={opt.id} type="button" onClick={() => setGender(opt.id)}
                          className="py-2.5 rounded-xl text-xs font-semibold"
                          style={{
                            backgroundColor: active ? C.goldSoft : C.surface,
                            color: active ? C.gold : C.text,
                            border: `1px solid ${active ? C.gold : C.border}`,
                          }}>
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </Section>

                <Section title="Quelle est ta date de naissance ?"
                  hint="Non modifiable après création. Ton âge se mettra à jour automatiquement chaque année.">
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: C.textDim }} />
                    <input type="date" value={birthdate}
                      onChange={(e) => setBirthdate(e.target.value)}
                      required
                      max={maxBirthdate}
                      min="1925-01-01"
                      className="w-full pl-10 pr-3 py-3 rounded-xl text-sm outline-none"
                      style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}`, colorScheme: 'dark' }} />
                  </div>
                  {birthdate && (
                    <p className="text-[11px] mt-1.5"
                      style={{ color: ageOk ? C.gold : C.red }}>
                      {ageOk
                        ? `Âge actuel : ${computedAge} ans`
                        : `Âge invalide (doit être entre 10 et 100 ans)`}
                    </p>
                  )}
                </Section>

                <Section title="Ta nationalité">
                  <div className="relative">
                    <Flag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: C.textDim }} />
                    <input type="text" value={nationality} onChange={(e) => setNationality(e.target.value)}
                      placeholder="Ex : Française, Sénégalaise…" maxLength={60}
                      className="w-full pl-10 pr-3 py-3 rounded-xl text-sm outline-none"
                      style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
                  </div>
                </Section>
              </>
            )}

            {/* ===== RECRUTEUR — ÉTAPE 1 (activité) ===== */}
            {isRecruiter && signupStep === 1 && (
              <>
                <Section title="Pour quelle organisation ?">
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: C.textDim }} />
                    <input type="text" value={organization} onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Ex : Paris Saint-Germain, OL…" required maxLength={80}
                      className="w-full pl-10 pr-3 py-3 rounded-xl text-sm outline-none"
                      style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
                  </div>
                </Section>

                <Section title="Ton sport principal">
                  <select value={sport} onChange={(e) => setSport(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }}>
                    <option value="">— Choisir un sport —</option>
                    {SPORTS.map(s => (
                      <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                    ))}
                  </select>
                </Section>

                {/* Critères de recrutement */}
                <div className="rounded-xl p-3 mt-2 flex items-start gap-2"
                  style={{ backgroundColor: C.goldSoft, border: `1px solid ${C.borderGold}` }}>
                  <Trophy size={14} style={{ color: C.gold }} className="mt-0.5 flex-shrink-0" />
                  <p className="text-[11px]" style={{ color: C.textDim }}>
                    <strong style={{ color: C.text }}>Tes critères de recrutement</strong> : tu seras affiché aux athlètes correspondants et tu pourras filtrer tes recherches.
                  </p>
                </div>

                <Section title="Athlètes recherchés (genre)">
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'all', label: 'Tous' },
                      { id: 'M',   label: '♂ H' },
                      { id: 'F',   label: '♀ F' },
                      { id: 'O',   label: '⚧ Autre' },
                    ].map(opt => {
                      const active = recruitingGender === opt.id
                      return (
                        <button key={opt.id} type="button" onClick={() => setRecruitingGender(opt.id)}
                          className="py-2.5 rounded-xl text-xs font-semibold"
                          style={{
                            backgroundColor: active ? C.goldSoft : C.surface,
                            color: active ? C.gold : C.text,
                            border: `1px solid ${active ? C.gold : C.border}`,
                          }}>
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </Section>

                <Section title="Niveaux recherchés">
                  <div className="flex flex-wrap gap-1.5">
                    {LEVELS.map(lv => {
                      const active = recruitingLevels.includes(lv.id)
                      return (
                        <button key={lv.id} type="button"
                          onClick={() => setRecruitingLevels(prev =>
                            active ? prev.filter(x => x !== lv.id) : [...prev, lv.id]
                          )}
                          className="px-3 py-2 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: active ? C.goldSoft : C.surface,
                            color: active ? C.gold : C.text,
                            border: `1px solid ${active ? C.gold : C.border}`,
                          }}>
                          {lv.icon} {lv.label}
                        </button>
                      )
                    })}
                    {/* Option « Tous » en dernier : sélectionne tous les niveaux d'un coup */}
                    {(() => {
                      const allIds = LEVELS.map(l => l.id)
                      const allActive = allIds.every(id => recruitingLevels.includes(id))
                      return (
                        <button type="button"
                          onClick={() => setRecruitingLevels(allActive ? [] : allIds)}
                          className="px-3 py-2 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: allActive ? C.gold : C.surface,
                            color: allActive ? C.bg : C.text,
                            border: `1px solid ${allActive ? C.gold : C.border}`,
                          }}>
                          ✅ Tous
                        </button>
                      )
                    })()}
                  </div>
                </Section>

                <Section title="Tranche d'âge ciblée">
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={recruitingAgeMin}
                      onChange={(e) => setRecruitingAgeMin(e.target.value)}
                      placeholder="Âge min" min={10} max={100}
                      className="px-3 py-3 rounded-xl text-sm outline-none"
                      style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
                    <input type="number" value={recruitingAgeMax}
                      onChange={(e) => setRecruitingAgeMax(e.target.value)}
                      placeholder="Âge max" min={10} max={100}
                      className="px-3 py-3 rounded-xl text-sm outline-none"
                      style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
                  </div>
                  {recruitingAgeMin !== '' && recruitingAgeMax !== ''
                    && Number(recruitingAgeMin) > Number(recruitingAgeMax) && (
                    <p className="text-[10px] mt-1" style={{ color: C.red }}>
                      L'âge min doit être inférieur ou égal à l'âge max
                    </p>
                  )}
                </Section>
              </>
            )}

            {/* ===== Localisation (athlètes + recruteurs) — demandée dès l'étape 1 (Profil) ===== */}
            {!isObserver && signupStep === 0 && (
              <Section title="Où es-tu basé ?" hint="Permet aux recruteurs / athlètes de ta zone de te trouver.">
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" value={country} onChange={(e) => setCountry(e.target.value)}
                    placeholder="Pays" maxLength={60}
                    className="px-3 py-3 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
                  <input type="text" value={region} onChange={(e) => setRegion(e.target.value)}
                    placeholder="Région" maxLength={60}
                    className="px-3 py-3 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                    placeholder="Ville" maxLength={60}
                    className="px-3 py-3 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
                </div>
              </Section>
            )}
          </>
        )}

        {/* Email + password — visibles en login OU à la dernière étape de l'inscription */}
        {(mode === 'login' || signupStep === STEP_LABELS.length - 1) && (
          <Section title={mode === 'signup' ? 'Tes identifiants' : ''}>
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: C.textDim }} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="ton@email.com" required
                  className="w-full pl-10 pr-3 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
              </div>

              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: C.textDim }} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe (6 caractères min)" required minLength={6}
                  className="w-full pl-10 pr-3 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
              </div>
            </div>
          </Section>
        )}

        {error && (
          <div className="text-xs px-3 py-2 rounded-lg"
            style={{ backgroundColor: 'rgba(255,71,87,0.1)', color: C.red, border: `1px solid ${C.red}` }}>
            {error}
          </div>
        )}

        {message && (
          <div className="text-xs px-3 py-2 rounded-lg"
            style={{ backgroundColor: 'rgba(255,184,0,0.1)', color: C.gold, border: `1px solid ${C.borderGold}` }}>
            {message}
          </div>
        )}

        {/* Navigation des étapes (inscription) */}
        {mode === 'signup' ? (
          <div className="flex items-center gap-2 mt-2">
            {signupStep > 0 && (
              <button type="button"
                onClick={() => { setError(null); setSignupStep(s => Math.max(0, s - 1)) }}
                className="px-4 py-3 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: 'transparent', color: C.text, border: `1px solid ${C.border}` }}>
                ← Précédent
              </button>
            )}
            {signupStep < STEP_LABELS.length - 1 ? (
              <button type="button"
                disabled={!stepReady[signupStep]}
                onClick={() => { setError(null); setSignupStep(s => Math.min(STEP_LABELS.length - 1, s + 1)) }}
                className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                style={{
                  backgroundColor: C.gold, color: C.bg,
                  opacity: stepReady[signupStep] ? 1 : 0.5,
                }}>
                Suivant →
              </button>
            ) : (
              <button type="submit" disabled={loading || !canSubmit}
                className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                style={{
                  backgroundColor: C.gold, color: C.bg,
                  opacity: loading || !canSubmit ? 0.5 : 1,
                }}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                Créer mon compte
              </button>
            )}
          </div>
        ) : (
          <button type="submit" disabled={loading || !canSubmit}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mt-2"
            style={{ backgroundColor: C.gold, color: C.bg,
                     opacity: loading || !canSubmit ? 0.5 : 1 }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Se connecter
          </button>
        )}

        <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setMessage(null); setSignupStep(0) }}
          className="text-xs mt-2 mb-8"
          style={{ color: C.textDim }}>
          {mode === 'login' ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
        </button>
      </form>
    </div>
  )
}
