// Accord parental : l'écran d'attente de l'enfant (compte inactif tant que
// son parent n'a pas confirmé), et la page que le parent ouvre depuis le
// lien (sans compte). Règles et lien : src/accordParental.js.
import { useEffect, useState } from 'react'
import { Loader2, ShieldCheck, Share2, Copy, Check, RefreshCw, Pencil } from 'lucide-react'
import { supabase } from './supabase'
import { emailValide, lienAccordParental, prendreParentInscription } from './accordParental'

const C = {
  bg: '#080F20',
  surface: '#0F172A',
  border: 'rgba(255,255,255,0.08)',
  gold: '#FFB800',
  text: '#FFFFFF',
  textDim: 'rgba(255,255,255,0.6)',
  textMute: 'rgba(255,255,255,0.4)',
  red: '#FF4757',
  green: '#22C55E',
}

const champ = 'w-full px-3.5 py-3 rounded-xl text-sm outline-none'
const styleChamp = { backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }

function Icone({ children }) {
  return (
    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
      {children}
    </div>
  )
}

// ─── Côté enfant ─────────────────────────────────────────────────────
export function EcranAttenteAccord({ profil, onAccorde, onDeconnexion }) {
  const [demande, setDemande] = useState(null)      // { token, parent_name, parent_email }
  const [chargement, setChargement] = useState(true)
  const [edition, setEdition] = useState(false)
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [info, setInfo] = useState(null)
  const [copie, setCopie] = useState(false)

  const lireDemande = async () => {
    const { data, error } = await supabase.rpc('mon_accord_parental')
    if (error) console.error('Lecture de la demande d\'accord :', error)
    return data?.[0] || null
  }

  const envoyerDemande = async (n, e) => {
    const { error } = await supabase.rpc('demander_accord_parental',
      { p_parent_nom: n.trim(), p_parent_email: e.trim() })
    if (error) return error.message || 'Réessaie dans un instant.'
    return null
  }

  // À l'ouverture : si le parent a été désigné à l'inscription, la demande
  // part d'elle-même ; sinon on reprend celle qui existe déjà.
  useEffect(() => {
    let annule = false
    ;(async () => {
      const parent = prendreParentInscription()
      if (parent) {
        const err = await envoyerDemande(parent.nom, parent.email)
        if (err && !annule) { setErreur(err); setNom(parent.nom); setEmail(parent.email) }
      }
      const d = await lireDemande()
      if (annule) return
      setDemande(d)
      setChargement(false)
    })()
    return () => { annule = true }
  }, [])

  const valider = async () => {
    setEnCours(true); setErreur(null)
    const err = await envoyerDemande(nom, email)
    if (err) { setErreur(err); setEnCours(false); return }
    setDemande(await lireDemande())
    setEdition(false)
    setEnCours(false)
  }

  const lien = demande ? lienAccordParental(demande.token) : ''
  const prenom = (profil?.full_name || '').trim().split(' ')[0]
  const message = `Bonjour, j'ai créé mon compte sur Yatsai, l'application où les jeunes sportifs montrent leurs vidéos aux recruteurs. Comme j'ai moins de 15 ans, il me faut ton accord. Tu peux lire ce que c'est et le donner ici : ${lien}`

  const partager = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Accord parental Yatsai', text: message }); return }
      catch (e) { if (e?.name === 'AbortError') return }
    }
    copier()
  }
  const copier = async () => {
    try { await navigator.clipboard.writeText(message); setCopie(true); setTimeout(() => setCopie(false), 2000) }
    catch { setInfo('Copie impossible : sélectionne le lien à la main.') }
  }

  const verifier = async () => {
    setEnCours(true); setInfo(null)
    const { data } = await supabase.rpc('get_my_profile')
    setEnCours(false)
    if (data?.parental_consent_at) onAccorde(data)
    else setInfo(`Pas encore d'accord. Dès que ${demande?.parent_name || 'ton parent'} l'aura donné, ton compte s'activera.`)
  }

  if (chargement) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: C.bg }}>
        <Loader2 size={22} className="animate-spin" style={{ color: C.textDim }} />
      </div>
    )
  }

  const formulaire = !demande || edition

  return (
    <div className="min-h-screen flex flex-col px-5 pt-16 pb-10" style={{ backgroundColor: C.bg }}>
      <Icone><ShieldCheck size={20} style={{ color: C.text }} /></Icone>
      <h1 className="text-2xl font-extrabold mb-2" style={{ color: C.text }}>
        {formulaire ? "L'accord d'un parent" : 'En attente de ton parent'}
      </h1>
      <p className="text-sm leading-relaxed mb-6" style={{ color: C.textDim }}>
        {prenom ? `${prenom}, tu` : 'Tu'} as moins de 15 ans : pour activer ton compte, un parent doit
        donner son accord. En attendant, tu ne peux ni publier, ni envoyer ou recevoir de messages.
      </p>

      {formulaire ? (
        <div className="space-y-3">
          <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom de ton parent"
            maxLength={120} className={champ} style={styleChamp} />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Son adresse e-mail" className={champ} style={styleChamp} />
          {erreur && <p className="text-xs" style={{ color: C.red }}>{erreur}</p>}
          <button onClick={valider} disabled={enCours || nom.trim().length < 2 || !emailValide(email)}
            className="w-full py-3.5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2"
            style={{ backgroundColor: C.gold, color: C.bg,
                     opacity: (enCours || nom.trim().length < 2 || !emailValide(email)) ? 0.4 : 1 }}>
            {enCours && <Loader2 size={16} className="animate-spin" />}
            Continuer
          </button>
          {demande && (
            <button onClick={() => setEdition(false)} className="w-full py-2 text-sm font-semibold"
              style={{ color: C.textDim }}>Annuler</button>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            <p className="text-xs mb-1" style={{ color: C.textMute }}>Envoie ce lien à</p>
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-sm font-bold truncate" style={{ color: C.text }}>
                {demande.parent_name} · <span style={{ color: C.textDim, fontWeight: 500 }}>{demande.parent_email}</span>
              </p>
              <button onClick={() => { setNom(demande.parent_name); setEmail(demande.parent_email); setEdition(true) }}
                aria-label="Modifier le parent" className="flex-shrink-0" style={{ color: C.textDim }}>
                <Pencil size={15} />
              </button>
            </div>
            <p className="text-xs break-all mb-4 select-all" style={{ color: C.textDim }}>{lien}</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={partager}
                className="py-3 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2"
                style={{ backgroundColor: C.gold, color: C.bg }}>
                <Share2 size={15} /> Envoyer
              </button>
              <button onClick={copier}
                className="py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                style={{ color: C.text, border: `1px solid ${C.border}` }}>
                {copie ? <Check size={15} /> : <Copy size={15} />} {copie ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <p className="text-xs leading-relaxed mb-5" style={{ color: C.textMute }}>
            Par SMS, WhatsApp ou e-mail : ton parent ouvre le lien, lit ce qu'est Yatsai, et confirme.
          </p>
          {info && <p className="text-xs mb-3" style={{ color: C.textDim }}>{info}</p>}
          <button onClick={verifier} disabled={enCours}
            className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ color: C.text, border: `1px solid ${C.border}` }}>
            {enCours ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Mon parent a confirmé
          </button>
        </>
      )}

      <button onClick={onDeconnexion} className="w-full mt-auto pt-8 text-sm font-semibold"
        style={{ color: C.textDim }}>
        Se déconnecter
      </button>
    </div>
  )
}

// ─── Côté parent (page publique, sans compte) ────────────────────────
export function PageAccordParental({ jeton }) {
  const [etat, setEtat] = useState('chargement') // chargement | invalide | formulaire | merci
  const [infos, setInfos] = useState(null)
  const [nom, setNom] = useState('')
  const [autorite, setAutorite] = useState(false)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    let annule = false
    ;(async () => {
      const uuid = /^[0-9a-f-]{36}$/i.test(jeton || '') ? jeton : null
      const { data, error } = uuid
        ? await supabase.rpc('infos_accord_parental', { p_token: uuid })
        : { data: null, error: null }
      if (annule) return
      if (error) console.error('Lecture du lien d\'accord :', error)
      const ligne = data?.[0]
      if (!ligne) { setEtat('invalide'); return }
      setInfos(ligne)
      setNom(ligne.parent_name || '')
      setEtat(ligne.deja_donne ? 'merci' : 'formulaire')
    })()
    return () => { annule = true }
  }, [jeton])

  const confirmer = async () => {
    setEnCours(true); setErreur(null)
    const { error } = await supabase.rpc('confirmer_accord_parental', { p_token: jeton, p_nom: nom.trim() })
    setEnCours(false)
    if (error) { setErreur(error.message || 'Réessayez dans un instant.'); return }
    setEtat('merci')
  }

  const enfant = infos?.prenom || 'Votre enfant'

  return (
    <div className="min-h-screen px-5 pt-14 pb-12" style={{ backgroundColor: C.bg }}>
      <div className="max-w-md mx-auto">
        <div className="text-2xl font-black mb-10" style={{ color: C.text }}>
          Yat<span style={{ color: C.gold }}>sai</span>
        </div>

        {etat === 'chargement' && (
          <div className="flex justify-center py-16">
            <Loader2 size={22} className="animate-spin" style={{ color: C.textDim }} />
          </div>
        )}

        {etat === 'invalide' && (
          <>
            <h1 className="text-2xl font-extrabold mb-3" style={{ color: C.text }}>Lien non valide</h1>
            <p className="text-sm leading-relaxed" style={{ color: C.textDim }}>
              Ce lien d'accord parental n'existe pas ou a été mal copié. Demandez à votre enfant de
              vous le renvoyer depuis l'application.
            </p>
          </>
        )}

        {etat === 'merci' && (
          <>
            <Icone><Check size={20} style={{ color: C.green }} /></Icone>
            <h1 className="text-2xl font-extrabold mb-3" style={{ color: C.text }}>Merci, c'est fait</h1>
            <p className="text-sm leading-relaxed" style={{ color: C.textDim }}>
              Le compte de {enfant} est activé. Sur son téléphone, il suffit de toucher
              « Mon parent a confirmé ». Vous pouvez à tout moment demander la suppression du compte
              en écrivant à <a href="mailto:contact@yatsai.app" style={{ color: C.gold }}>contact@yatsai.app</a>.
            </p>
          </>
        )}

        {etat === 'formulaire' && (
          <>
            <h1 className="text-2xl font-extrabold mb-3" style={{ color: C.text }}>
              {enfant}{infos?.age != null ? ` (${infos.age} ans)` : ''} souhaite utiliser Yatsai
            </h1>
            <p className="text-sm leading-relaxed mb-6" style={{ color: C.textDim }}>
              Yatsai permet aux jeunes sportifs de publier de courtes vidéos de leurs actions (30 secondes
              au plus), pour se faire repérer par des clubs et des recruteurs. En France, un enfant de moins
              de 15 ans ne peut pas s'y inscrire sans l'accord d'un parent.
            </p>
            <div className="rounded-2xl p-4 mb-6 space-y-2"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              <p className="text-xs font-bold mb-1" style={{ color: C.text }}>Ce que cela implique</p>
              {[
                'Ses vidéos et son profil (prénom, nom, sport, club, âge) sont visibles des autres membres.',
                'Des recruteurs peuvent lui écrire dans l\'application. Aucun ne doit demander d\'argent ni proposer de poursuivre la conversation ailleurs.',
                'Tout rendez-vous (essai, visite) se fait avec votre accord.',
                'Chacun peut signaler un contenu ou bloquer un compte ; nous traitons les signalements sous 24 heures.',
              ].map(t => (
                <p key={t} className="text-xs leading-relaxed" style={{ color: C.textDim }}>• {t}</p>
              ))}
            </div>

            <label className="block text-xs font-semibold mb-2" style={{ color: C.textDim }}>Votre nom</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} maxLength={120}
              className={champ + ' mb-4'} style={styleChamp} />

            <label className="flex items-start gap-3 cursor-pointer select-none mb-5">
              <input type="checkbox" checked={autorite} onChange={(e) => setAutorite(e.target.checked)}
                className="mt-0.5 w-5 h-5 flex-shrink-0" style={{ accentColor: C.gold }} />
              <span className="text-xs leading-relaxed" style={{ color: C.textDim }}>
                J'exerce l'autorité parentale sur {enfant}. J'ai lu les{' '}
                <a href="/conditions.html" target="_blank" rel="noopener" style={{ color: C.text, textDecoration: 'underline' }}>conditions d'utilisation</a>
                {' '}et la{' '}
                <a href="/privacy.html" target="_blank" rel="noopener" style={{ color: C.text, textDecoration: 'underline' }}>politique de confidentialité</a>,
                et j'autorise son inscription sur Yatsai.
              </span>
            </label>

            {erreur && <p className="text-xs mb-3" style={{ color: C.red }}>{erreur}</p>}
            <button onClick={confirmer} disabled={enCours || !autorite || nom.trim().length < 2}
              className="w-full py-3.5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2"
              style={{ backgroundColor: C.gold, color: C.bg,
                       opacity: (enCours || !autorite || nom.trim().length < 2) ? 0.4 : 1 }}>
              {enCours && <Loader2 size={16} className="animate-spin" />}
              Je donne mon accord
            </button>
            <p className="text-xs leading-relaxed mt-4" style={{ color: C.textMute }}>
              Vous ne souhaitez pas donner votre accord ? Ne faites rien : le compte reste inactif.
              Pour le faire supprimer, écrivez à contact@yatsai.app.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
