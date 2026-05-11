import React, { useState } from 'react'
import { supabase } from './supabase'
import { Loader2, Mail, Lock, User as UserIcon } from 'lucide-react'

const C = {
  bg: '#080F20',
  surface: '#0F172A',
  border: 'rgba(255,255,255,0.06)',
  borderGold: 'rgba(255,184,0,0.25)',
  gold: '#FFB800',
  text: '#FFFFFF',
  textDim: 'rgba(255,255,255,0.6)',
  red: '#FF4757',
}

export default function Auth() {
  const [mode, setMode] = useState('login') // 'login' ou 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('athlete')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, is_recruiter: role === 'recruiter' },
          },
        })
        if (error) throw error
        setMessage('Compte créé ! Tu peux te connecter.')
        setMode('login')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        // Connexion réussie → App.jsx va détecter le changement
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: C.bg }}>
      
      {/* Logo */}
      <div className="mb-8">
        <div className="text-4xl font-extrabold" style={{ color: C.text }}>
          Sco<span style={{ color: C.gold }}>lympia</span>
        </div>
        <p className="text-sm text-center mt-2" style={{ color: C.textDim }}>
          {mode === 'signup' ? 'Crée ton compte' : 'Connecte-toi'}
        </p>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-3">
        
       {mode === 'signup' && (
          <>
            <div className="relative">
              <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: C.textDim }} />
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder="Ton nom complet" required
                className="w-full pl-10 pr-3 py-3 rounded-xl text-sm outline-none"
                style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
            </div>

            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>
                Je suis :
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setRole('athlete')}
                  className="py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: role === 'athlete' ? 'rgba(255,184,0,0.12)' : C.surface,
                    color: role === 'athlete' ? C.gold : C.text,
                    border: `1px solid ${role === 'athlete' ? C.gold : C.border}`,
                  }}>
                  ⚽ Athlète
                </button>
                <button type="button" onClick={() => setRole('recruiter')}
                  className="py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: role === 'recruiter' ? 'rgba(255,184,0,0.12)' : C.surface,
                    color: role === 'recruiter' ? C.gold : C.text,
                    border: `1px solid ${role === 'recruiter' ? C.gold : C.border}`,
                  }}>
                  💼 Recruteur
                </button>
              </div>
            </div>
          </>
        )}

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

        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
          style={{ backgroundColor: C.gold, color: C.bg, opacity: loading ? 0.5 : 1 }}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          {mode === 'signup' ? 'Créer mon compte' : 'Se connecter'}
        </button>

        <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setMessage(null) }}
          className="text-xs mt-2"
          style={{ color: C.textDim }}>
          {mode === 'login' ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
        </button>
      </form>
    </div>
  )
}