// Écrans des conditions d'utilisation : case à cocher de l'inscription,
// fenêtre de lecture, et écran d'acceptation pour les comptes qui ne les ont
// pas (encore) acceptées dans la version en vigueur.
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, X, FileText } from 'lucide-react'
import { accepter } from './conditions'

const C = {
  bg: '#080F20',
  surface: '#0F172A',
  border: 'rgba(255,255,255,0.08)',
  gold: '#FFB800',
  text: '#FFFFFF',
  textDim: 'rgba(255,255,255,0.6)',
  red: '#FF4757',
}

// Les pages légales sont des fichiers statiques embarqués avec l'application.
// Y naviguer ferait sortir de l'application sur iPhone, sans bouton retour :
// on les affiche donc dans une fenêtre, par-dessus.
export function ModaleDocument({ url, titre, onClose }) {
  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col" style={{ backgroundColor: C.bg }}>
      <div className="flex items-center justify-between px-4 pt-12 pb-3"
        style={{ borderBottom: `1px solid ${C.border}` }}>
        <span className="text-sm font-bold" style={{ color: C.text }}>{titre}</span>
        <button onClick={onClose} aria-label="Fermer"
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ border: `1px solid ${C.border}`, color: C.text }}>
          <X size={16} />
        </button>
      </div>
      <iframe src={url} title={titre} className="flex-1 w-full" style={{ border: 'none' }} />
    </div>,
    document.body,
  )
}

// La case de l'inscription, avec ses deux liens.
export function CaseConditions({ coche, onChange }) {
  const [doc, setDoc] = useState(null)
  const lien = (url, titre, texte) => (
    <button type="button" onClick={(e) => { e.preventDefault(); setDoc({ url, titre }) }}
      className="font-semibold underline" style={{ color: C.text }}>
      {texte}
    </button>
  )
  return (
    <>
      <label className="flex items-start gap-3 cursor-pointer select-none">
        <input type="checkbox" checked={coche} onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 w-5 h-5 flex-shrink-0" style={{ accentColor: C.gold }} />
        <span className="text-xs leading-relaxed" style={{ color: C.textDim }}>
          J'ai lu et j'accepte les {lien('/conditions.html', "Conditions d'utilisation", "conditions d'utilisation")}
          {' '}et la {lien('/privacy.html', 'Confidentialité', 'politique de confidentialité')}.
          Je m'engage à ne publier que des vidéos sportives, et à respecter les autres membres.
        </span>
      </label>
      {doc && <ModaleDocument url={doc.url} titre={doc.titre} onClose={() => setDoc(null)} />}
    </>
  )
}

// Écran bloquant pour un compte existant qui n'a pas accepté la version en
// vigueur (compte créé avant les conditions, ou conditions modifiées).
export function EcranConditions({ onAcceptees, onDeconnexion }) {
  const [coche, setCoche] = useState(false)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState(null)

  const valider = async () => {
    setEnCours(true); setErreur(null)
    const error = await accepter()
    setEnCours(false)
    if (error) { setErreur(error.message || 'Réessaie dans un instant.'); return }
    onAcceptees()
  }

  return (
    <div className="min-h-screen flex flex-col px-5 pt-16 pb-10" style={{ backgroundColor: C.bg }}>
      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
        <FileText size={20} style={{ color: C.text }} />
      </div>
      <h1 className="text-2xl font-extrabold mb-2" style={{ color: C.text }}>
        Nos conditions d'utilisation
      </h1>
      <p className="text-sm leading-relaxed mb-6" style={{ color: C.textDim }}>
        Pour continuer à utiliser Yatsai, lis et accepte nos conditions. L'essentiel :
      </p>
      <ul className="text-sm leading-relaxed mb-8 space-y-2" style={{ color: C.textDim }}>
        <li>• Des vidéos sportives uniquement, de 30 secondes au plus, 3 par jour.</li>
        <li>• Aucune tolérance pour le harcèlement, la nudité, la violence, la haine ou les arnaques : le contenu est retiré et le compte peut être fermé.</li>
        <li>• Tu peux signaler un contenu ou bloquer un compte à tout moment.</li>
        <li>• Moins de 15 ans : l'accord d'un parent est obligatoire.</li>
      </ul>
      <div className="mt-auto">
        <CaseConditions coche={coche} onChange={setCoche} />
        {erreur && <p className="text-xs mt-3" style={{ color: C.red }}>{erreur}</p>}
        <button onClick={valider} disabled={!coche || enCours}
          className="w-full mt-5 py-3.5 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2"
          style={{ backgroundColor: C.gold, color: C.bg, opacity: (!coche || enCours) ? 0.4 : 1 }}>
          {enCours && <Loader2 size={16} className="animate-spin" />}
          Accepter et continuer
        </button>
        <button onClick={onDeconnexion}
          className="w-full mt-3 py-3 text-sm font-semibold" style={{ color: C.textDim }}>
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
