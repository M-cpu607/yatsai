import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Heart, MessageCircle, Bookmark, Share2, Volume2, VolumeX,
  Plus, Search, User, Home, Inbox, Sparkles, BadgeCheck,
  ChevronDown, ChevronUp, RotateCcw, Camera, X, ArrowLeft,
  Play, Pause, MapPin as PinIcon, Trash2, CheckCircle2, ArrowDown,
  Briefcase, Star, NotebookPen, Building2,
  Mail, Edit3, Save, Loader2,
  Bot, Send, SlidersHorizontal, Wand2,
  Eye, EyeOff, Flag, MoreVertical, AlertTriangle,
  Mic, MicOff, Bell, Video, Users, Settings, Lock,
  Folder, FolderOpen, Upload, FileCheck2,
} from 'lucide-react';
import { supabase } from './supabase';
import Auth from './Auth';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle, Color, FontFamily, FontSize } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import Image from '@tiptap/extension-image';
import CharacterCount from '@tiptap/extension-character-count';

// ─── PALETTE ───────────────────────────────────────────────────────
const C = {
  bg: '#080F20', bgDeep: '#040812',
  surface: '#0F172A', surface2: '#16213A',
  border: 'rgba(255,255,255,0.06)',
  borderGold: 'rgba(255,184,0,0.25)',
  gold: '#FFB800', goldDeep: '#E0A100',
  goldSoft: 'rgba(255,184,0,0.12)',
  text: '#FFFFFF',
  textDim: 'rgba(255,255,255,0.6)',
  textMute: 'rgba(255,255,255,0.4)',
  red: '#FF4757', green: '#22C55E',
};

const FontStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500&display=swap');
    * { font-family: 'Outfit', system-ui, sans-serif; }
    /* font-mono : on garde le visuel pour les CHIFFRES uniquement (compteurs).
       Avant : tous les labels avaient cette police, ce qui faisait "terminal de dev".
       Maintenant on l'utilise seulement quand c'est explicitement appliqué. */
    .font-mono { font-family: 'JetBrains Mono', monospace; letter-spacing: -0.02em; }
    /* Labels de section : nouvelle classe douce qui remplace 'font-semibold uppercase' */
    .label-soft { font-weight: 600; font-size: 12px; letter-spacing: 0; text-transform: none; }
    body { margin: 0; background: ${C.bg}; }
    @keyframes goldTap { 0% { box-shadow: 0 0 0 0 rgba(255,184,0,0.5); } 100% { box-shadow: 0 0 0 12px rgba(255,184,0,0); } }
    .gold-tap:active { animation: goldTap 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    .fade-in { animation: fadeIn 0.3s ease-out both; }
    @keyframes heartPop { 0% { transform: scale(1); } 50% { transform: scale(1.4); } 100% { transform: scale(1); } }
    .heart-pop { animation: heartPop 0.4s ease-out; }
    @keyframes slideInRight { from { transform: translateX(100%); opacity: 0.6; } to { transform: translateX(0); opacity: 1; } }
    .slide-in-right { animation: slideInRight 0.28s cubic-bezier(0.22, 1, 0.36, 1) both; }
    /* Trois points qui sautent (essai en cours) */
    @keyframes dotJump { 0%, 80%, 100% { transform: translateY(0); opacity: 0.5; } 40% { transform: translateY(-4px); opacity: 1; } }
    .dot-jump > span { display: inline-block; width: 4px; height: 4px; margin: 0 1px; border-radius: 50%; background: currentColor; animation: dotJump 1.2s infinite ease-in-out both; }
    .dot-jump > span:nth-child(1) { animation-delay: -0.32s; }
    .dot-jump > span:nth-child(2) { animation-delay: -0.16s; }
    .dot-jump > span:nth-child(3) { animation-delay: 0s; }
    input[type="range"] { -webkit-appearance: none; appearance: none; background: transparent; width: 100%; }
    input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: ${C.gold}; box-shadow: 0 0 8px rgba(255,184,0,0.5); cursor: pointer; margin-top: -7px; }
    input[type="range"]::-webkit-slider-runnable-track { height: 4px; background: rgba(255,255,255,0.12); border-radius: 2px; }
    button { -webkit-tap-highlight-color: transparent; }
    .scrollbar-none::-webkit-scrollbar { display: none; }
    .scrollbar-none { scrollbar-width: none; }
    /* Styles pour l'éditeur TipTap (rich text Word/Pages-like, sur fond blanc "page") */
    .tiptap-editor { outline: none; color: #1A1A1A; font-size: 14px; line-height: 1.6; min-height: 60vh; }
    .tiptap-editor p { margin: 0 0 0.5em; }
    .tiptap-editor h1 { font-size: 1.8em; font-weight: 800; margin: 0.6em 0 0.3em; color: #1A1A1A; }
    .tiptap-editor h2 { font-size: 1.4em; font-weight: 700; margin: 0.5em 0 0.3em; color: #1A1A1A; }
    .tiptap-editor h3 { font-size: 1.15em; font-weight: 700; margin: 0.5em 0 0.3em; color: #555; }
    .tiptap-editor ul, .tiptap-editor ol { padding-left: 1.5em; margin: 0.4em 0; }
    .tiptap-editor ul { list-style: disc; }
    .tiptap-editor ol { list-style: decimal; }
    .tiptap-editor li { margin: 0.2em 0; }
    .tiptap-editor blockquote { border-left: 3px solid #FFB800; padding-left: 1em; margin: 0.6em 0; color: #555; font-style: italic; }
    .tiptap-editor code { background: #F5F5F5; padding: 0.1em 0.3em; border-radius: 3px; font-family: 'JetBrains Mono', monospace; font-size: 0.9em; color: #C7254E; }
    .tiptap-editor pre { background: #F8F8F8; border: 1px solid #E0E0E0; padding: 0.8em; border-radius: 8px; margin: 0.6em 0; overflow-x: auto; }
    .tiptap-editor pre code { background: transparent; padding: 0; color: #1A1A1A; }
    .tiptap-editor s { text-decoration: line-through; }
    .tiptap-editor a { color: #2563EB; text-decoration: underline; cursor: pointer; }
    .tiptap-editor mark { background: #FFEB3B; padding: 0 2px; border-radius: 2px; }
    /* Tableaux */
    .tiptap-editor table { border-collapse: collapse; margin: 0.8em 0; width: 100%; table-layout: fixed; overflow: hidden; }
    .tiptap-editor th, .tiptap-editor td { border: 1px solid #D0D0D0; padding: 6px 10px; vertical-align: top; min-width: 60px; position: relative; }
    .tiptap-editor th { background: #F5F5F5; font-weight: 700; text-align: left; }
    .tiptap-editor .selectedCell:after { background: rgba(255,184,0,0.15); content: ""; position: absolute; inset: 0; pointer-events: none; }
    .tiptap-editor p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #B0B0B0; pointer-events: none; float: left; height: 0; }
    /* Image insérée */
    .tiptap-editor img { max-width: 100%; height: auto; border-radius: 6px; margin: 0.5em 0; }
    /* Saut de page : trait horizontal stylisé */
    .tiptap-editor hr[data-page-break] { border: 0; border-top: 2px dashed #D0D0D0; margin: 2em 0; height: 0; position: relative; page-break-after: always; }
    .tiptap-editor hr[data-page-break]::before { content: '— Saut de page —'; position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #FFFFFF; padding: 0 12px; font-size: 0.75em; color: #999; }
  `}</style>
);

// ─── IA SPORT ──────────────────────────────────────────────────────
class SportDetectorAI {
  static W = { motion: 0.32, equipment: 0.24, environment: 0.18, audio: 0.14, pose: 0.12 };
  static analyze(meta) {
    const f = {
      motion: meta.motion ?? 0,
      equipment: Math.min((meta.equipment?.length ?? 0) / 3, 1),
      environment: ['stadium', 'court', 'pool', 'ring', 'track', 'gym'].includes(meta.environment) ? 1 : 0,
      audio: Math.min((meta.audio?.length ?? 0) / 2, 1),
      pose: meta.pose ?? 0.8,
    };
    let score = 0;
    for (const k in this.W) score += f[k] * this.W[k];
    score = Math.min(0.99, score + (Math.random() * 0.04 - 0.02));
    return { isSport: score >= 0.65, sport: meta.sport, confidence: Math.round(score * 100) };
  }
  static filter(videos) {
    const enriched = videos.map(v => ({ ...v, detection: this.analyze(v) }));
    return { videos: enriched.filter(v => v.detection.isSport) };
  }
}

// ─── DATA ──────────────────────────────────────────────────────────
const VIDEOS = [
  { id: 1, name: 'Kylian Benga', handle: '@kylian.b', age: 19, sport: 'Football', icon: '⚽', gender: 'M',
    position: 'Attaquant', club: 'AS Bordeaux U19', rating: 8.7, verified: true,
    likes: '14.2K', comments: '423', views: '2.1M',
    poster: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800',
    motion: 0.92, equipment: ['ball', 'goalpost'], environment: 'stadium', audio: ['crowd', 'whistle'], pose: 0.95,
    stats: [{ v: 12, l: 'Buts' }, { v: 24, l: 'Matchs' }, { v: 18, l: 'Passes' }, { v: 89, l: 'Note moy' }] },
  { id: 2, name: 'Aminata Diallo', handle: '@aminata.d', age: 21, sport: 'Athlétisme', icon: '🏃‍♀️', gender: 'F',
    position: 'Sprint 100m', club: 'Stade Lyonnais', rating: 8.9, verified: true,
    likes: '22.8K', comments: '892', views: '4.6M',
    poster: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800',
    motion: 0.97, equipment: ['blocks'], environment: 'track', audio: ['crowd'], pose: 0.93,
    stats: [{ v: '11.2s', l: '100m' }, { v: '23.4s', l: '200m' }, { v: 6, l: 'Médailles' }, { v: 92, l: 'Note moy' }] },
  { id: 3, name: 'Karim Benzaoui', handle: '@karim.bz', age: 22, sport: 'Basketball', icon: '🏀', gender: 'M',
    position: 'Point Guard', club: 'Paris Basket', rating: 9.1, verified: true,
    likes: '31.5K', comments: '1.2K', views: '3.4M',
    poster: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
    motion: 0.88, equipment: ['ball'], environment: 'court', audio: ['crowd'], pose: 0.91,
    stats: [{ v: 24.5, l: 'Pts/match' }, { v: 7.2, l: 'Passes' }, { v: 4.1, l: 'Rebonds' }, { v: 91, l: 'Note moy' }] },
  { id: 4, name: 'Sophie Martin', handle: '@sophie.swim', age: 20, sport: 'Natation', icon: '🏊', gender: 'F',
    position: '200m papillon', club: 'CN Marseille', rating: 8.5, verified: true,
    likes: '8.7K', comments: '267', views: '1.3M',
    poster: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800',
    motion: 0.85, equipment: ['cap'], environment: 'pool', audio: ['water'], pose: 0.88,
    stats: [{ v: '2:08.5', l: '200m papillon' }, { v: 4, l: 'Médailles' }, { v: 87, l: 'Note moy' }] },
  { id: 5, name: 'Lucas Mendes', handle: '@lucas.mendes', age: 18, sport: 'Football', icon: '⚽', gender: 'M',
    position: 'Milieu', club: 'OM Centre Formation', rating: 8.3, verified: false,
    likes: '5.1K', comments: '142', views: '980K',
    poster: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    motion: 0.89, equipment: ['ball'], environment: 'stadium', audio: ['crowd'], pose: 0.86,
    stats: [{ v: 8, l: 'Buts' }, { v: 18, l: 'Matchs' }, { v: 12, l: 'Passes' }, { v: 84, l: 'Note moy' }] },
];

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
];

// ─── RÔLES UTILISATEUR ───────────────────────────────────────────
// 3 rôles : athlete (publie des vidéos), recruiter (recrute, peut signer)
// et observer (parents, coachs, fans : peut juste enregistrer des vidéos).
function getUserRole(profile) {
  if (!profile) return 'athlete';
  if (profile.role) return profile.role;
  // Fallback pour les profils legacy qui n'ont que is_recruiter
  return profile.is_recruiter ? 'recruiter' : 'athlete';
}
function isAthleteRole(profile) { return getUserRole(profile) === 'athlete'; }
function isRecruiterRole(profile) { return getUserRole(profile) === 'recruiter'; }
function isObserverRole(profile) { return getUserRole(profile) === 'observer'; }
// Peut enregistrer (bookmark) des vidéos : recruteur + observateur
function canBookmarkVideos(profile) {
  const r = getUserRole(profile);
  return r === 'recruiter' || r === 'observer';
}

// ─── PERMISSIONS NATIVES (onboarding iOS/Android) ────────────────
// Chaque fonction déclenche la vraie boîte de dialogue native du téléphone.
// Sur le web classique, elles ne font rien (ou utilisent l'API web).
async function isNativeApp() {
  try {
    const { Capacitor } = await import('@capacitor/core');
    return !!Capacitor?.isNativePlatform?.();
  } catch { return false; }
}

async function requestNotificationsPermission() {
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const res = await PushNotifications.requestPermissions();
    if (res.receive === 'granted') { try { await PushNotifications.register(); } catch {} }
    return res.receive === 'granted';
  } catch (e) { console.warn('Notifications:', e?.message); return false; }
}

async function requestCameraMicPermission() {
  // En WKWebView/Android WebView, getUserMedia déclenche les dialogues natifs
  // caméra + micro (les textes viennent de l'Info.plist sur iOS).
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    stream.getTracks().forEach(t => t.stop()); // on coupe tout de suite, c'était juste pour l'autorisation
    return true;
  } catch (e) { console.warn('Caméra/Micro:', e?.message); return false; }
}

async function requestContactsPermission() {
  try {
    const { Contacts } = await import('@capacitor-community/contacts');
    const res = await Contacts.requestPermissions();
    return res?.contacts === 'granted';
  } catch (e) { console.warn('Contacts:', e?.message); return false; }
}

async function requestLocationPermission() {
  try {
    const { Geolocation } = await import('@capacitor/geolocation');
    const res = await Geolocation.requestPermissions();
    return res?.location === 'granted' || res?.coarseLocation === 'granted';
  } catch (e) { console.warn('Localisation:', e?.message); return false; }
}

const ONBOARD_FLAG = 'yatsai_permissions_onboarded';

function PermissionsOnboarding({ onDone }) {
  const STEPS = [
    { key: 'notifs',   icon: Bell,    title: 'Notifications',  desc: 'Être prévenu des likes, messages, abonnés et opportunités.', run: requestNotificationsPermission },
    { key: 'camera',   icon: Camera,  title: 'Caméra & micro', desc: 'Filmer et publier tes performances directement depuis l\'app.', run: requestCameraMicPermission },
    { key: 'contacts', icon: Users,   title: 'Contacts',        desc: 'Retrouver facilement tes amis déjà présents sur Yatsai.', run: requestContactsPermission },
    { key: 'location', icon: PinIcon, title: 'Localisation',    desc: 'Te proposer des athlètes et recruteurs proches de toi.', run: requestLocationPermission },
  ];
  const [i, setI] = useState(0);
  const [busy, setBusy] = useState(false);
  const step = STEPS[i];
  const isLast = i === STEPS.length - 1;

  const finish = () => { try { localStorage.setItem(ONBOARD_FLAG, '1'); } catch {} onDone?.(); };
  const next = () => { if (isLast) finish(); else setI(n => n + 1); };

  const allow = async () => {
    setBusy(true);
    try { await step.run(); } catch {}
    setBusy(false);
    next();
  };

  const Icon = step.icon;
  return (
    <div className="fixed inset-0 z-[200] flex flex-col" style={{ backgroundColor: C.bg }}>
      {/* Progression */}
      <div className="px-6 pt-14 flex gap-1.5">
        {STEPS.map((s, idx) => (
          <div key={s.key} className="flex-1 h-1 rounded-full"
            style={{ backgroundColor: idx <= i ? C.gold : C.border }} />
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-7"
          style={{ backgroundColor: C.goldSoft, border: `1px solid ${C.borderGold}` }}>
          <Icon size={42} style={{ color: C.gold }} strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-extrabold mb-3" style={{ color: C.text }}>
          {step.title}
        </h1>
        <p className="text-base max-w-sm leading-relaxed" style={{ color: C.textDim }}>
          {step.desc}
        </p>
      </div>

      <div className="px-6 pb-10 flex flex-col gap-3">
        <button onClick={allow} disabled={busy}
          className="w-full py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2"
          style={{ backgroundColor: C.gold, color: C.bg, opacity: busy ? 0.6 : 1 }}>
          {busy ? <Loader2 size={18} className="animate-spin" /> : null}
          Autoriser
        </button>
        <button onClick={next}
          className="w-full py-3 text-sm font-semibold" style={{ color: C.textDim }}>
          Plus tard
        </button>
      </div>
    </div>
  );
}

// ─── LANDING PAGE ────────────────────────────────────────────────
function LandingPage({ onStart }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#080F20' }}>
      {/* Top bar */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <div className="text-2xl font-extrabold" style={{ color: '#FFFFFF', letterSpacing: '-0.02em' }}>
          Yat<span style={{ color: '#FFB800' }}>sai</span>
        </div>
        <button onClick={() => onStart('login')}
          className="px-4 py-2 rounded-full text-xs font-bold"
          style={{ backgroundColor: 'transparent', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.15)' }}>
          Se connecter
        </button>
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Halo doré derrière le logo */}
        <div className="relative mb-6">
          <div className="absolute inset-0 -m-12 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,184,0,0.20) 0%, transparent 70%)',
              filter: 'blur(20px)',
            }} />
          <div className="relative text-7xl font-extrabold" style={{ color: '#FFFFFF', letterSpacing: '-0.04em' }}>
            Yat<span style={{ color: '#FFB800' }}>sai</span>
          </div>
        </div>

        <h1 className="text-3xl font-extrabold mb-3 max-w-md" style={{ color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          Le réseau qui révèle <span style={{ color: '#FFB800' }}>les talents</span> sportifs.
        </h1>
        <p className="text-base max-w-md mb-10" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
          Publie tes meilleures actions. Sois repéré par des recruteurs du monde entier.
        </p>

        {/* CTA principal */}
        <button onClick={() => onStart('signup')}
          className="w-full max-w-sm py-4 rounded-full font-extrabold text-base mb-4"
          style={{
            backgroundColor: '#FFB800', color: '#080F20',
            boxShadow: '0 8px 24px -8px rgba(255,184,0,0.5)',
            letterSpacing: '0.01em',
          }}>
          Commencer gratuitement
        </button>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          C'est rapide, sans engagement.
        </p>
      </div>

      {/* Features (3 colonnes) */}
      <div className="px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {[
            { icon: '🎬', title: 'Publie tes vidéos', desc: 'Films de match, entraînements, performances — tout en un seul endroit.' },
            { icon: '🎯', title: 'Sois repéré', desc: 'Les recruteurs cherchent ton sport, ton poste, ton niveau. Apparais dans leur radar.' },
            { icon: '🏆', title: 'Signe avec un club', desc: 'Discute directement avec des recruteurs vérifiés et décroche ton contrat.' },
          ].map(f => (
            <div key={f.title} className="rounded-2xl p-5"
              style={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-3xl mb-2">{f.icon}</div>
              <div className="text-sm font-extrabold mb-1" style={{ color: '#FFFFFF' }}>{f.title}</div>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-6 text-center text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
        © Yatsai · Le talent sportif, sans intermédiaire.
      </div>
    </div>
  );
}

// ─── POSITIONS / POSTES par sport ────────────────────────────────
// Pour les sports collectifs et certaines disciplines, on propose une liste
// fermée de postes. Pour les sports individuels sans poste, on laisse vide.
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
};
function getPositionsForSport(sport) {
  return POSITIONS_BY_SPORT[sport] || null;
}
// Niveaux qui nécessitent une preuve avant affichage sur le profil
const LEVELS_REQUIRING_PROOF = ['young_pro', 'senior_pro'];
function levelRequiresProof(level) {
  return LEVELS_REQUIRING_PROOF.includes(level);
}
// Le niveau est affichable si soit il ne nécessite pas de preuve,
// soit la preuve est approuvée.
function isLevelDisplayable(profile) {
  if (!profile?.level) return false;
  if (!levelRequiresProof(profile.level)) return true;
  return profile.level_proof_status === 'approved';
}

const CURRENT_RECRUITER = {
  firstName: 'Marc', lastName: 'Dubois',
  email: 'marc.dubois@psg.fr',
  organization: 'Paris Saint-Germain', role: 'Head Scout',
  sports: ['Football'], verified: true,
  followers: 1842, following: 87,
  stats: { contacted: 47, responses: 32, signed: 8 },
};

// ─── CHATBOT NLP (filtres simples) ─────────────────────────────────
const SPORT_KEYWORDS = {
  Football: ['foot', 'football', 'soccer'],
  Basketball: ['basket', 'basketball', 'nba'],
  'Athlétisme': ['athle', 'athletisme', 'sprint', 'course'],
  Natation: ['natation', 'nageur', 'piscine'],
  Tennis: ['tennis'],
  Rugby: ['rugby'],
  Handball: ['hand', 'handball'],
  Boxe: ['boxe', 'boxeur'],
  MMA: ['mma', 'arts martiaux'],
  Volleyball: ['volley', 'volleyball'],
  Badminton: ['badminton'],
  'Tennis de table': ['ping pong', 'tennis de table', 'pingpong'],
  Karting: ['karting', 'kart'],
  Golf: ['golf'],
  Cyclisme: ['cyclo', 'cyclisme', 'velo', 'vélo'],
  Esport: ['esport', 'esports', 'gaming', 'jeux video'],
  Cricket: ['cricket'],
  'Football américain': ['football americain', 'football américain', 'nfl'],
  Baseball: ['baseball'],
  'Hockey sur glace': ['hockey', 'hockey sur glace', 'nhl'],
};
function stripAccents(s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function parseQuery(text) {
  const q = stripAccents(text.toLowerCase());
  const filters = {}; const matched = [];
  for (const [sport, kws] of Object.entries(SPORT_KEYWORDS)) {
    if (kws.some(k => q.includes(k))) { filters.sport = sport; matched.push(`Sport : ${sport}`); break; }
  }
  const u = q.match(/\bu(\d{1,2})\b/);
  if (u) {
    const cap = Number(u[1]);
    filters.ageMin = Math.max(14, cap - 3); filters.ageMax = cap;
    matched.push(`Catégorie U${cap}`);
  } else {
    const range = q.match(/(\d{2})\s*(?:a|-)\s*(\d{2})\s*ans?/);
    if (range) { filters.ageMin = +range[1]; filters.ageMax = +range[2]; matched.push(`Âge : ${filters.ageMin}-${filters.ageMax} ans`); }
  }
  const score = q.match(/(?:score|note)\s*(?:>=?|sup(?:e|é)rieur(?:e)?(?: a)?)?\s*(\d(?:[.,]\d)?)/);
  if (score) { filters.minRating = parseFloat(score[1].replace(',', '.')); matched.push(`Score IA ≥ ${filters.minRating}`); }
  else if (/excellent|elite|top/.test(q)) { filters.minRating = 8.5; matched.push('Score IA ≥ 8.5'); }

  // Gender — restreint aux mots explicitement genrés pour éviter
  // les faux positifs ("joueur" est trop générique en français)
  if (/\b(femme|feminin|feminine|fille|joueuse|sportive)\b/.test(q)) {
    filters.gender = 'F'; matched.push('Genre : Femme');
  } else if (/\b(homme|garcon|masculin)\b/.test(q)) {
    filters.gender = 'M'; matched.push('Genre : Homme');
  }

  return { filters, matched };
}

// ═══ ATOMS ═════════════════════════════════════════════════════════
function Logo({ size = 'lg' }) {
  const cls = size === 'sm' ? 'text-xl' : 'text-2xl';
  return (
    <div className={`font-extrabold tracking-tight ${cls}`} style={{ color: C.text }}>
      Yat<span style={{ color: C.gold }}>sai</span>
    </div>
  );
}

function GoldButton({ children, variant = 'solid', icon: Icon, fullWidth, onClick, className = '', disabled }) {
  const styles = variant === 'solid'
    ? { backgroundColor: C.gold, color: C.bg, border: 'none' }
    : variant === 'outline'
      ? { backgroundColor: 'transparent', color: C.gold, border: `1px solid ${C.borderGold}` }
      : { backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`gold-tap rounded-xl py-3 px-4 font-semibold flex items-center justify-center gap-2 text-sm transition-all active:scale-95 ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50' : ''} ${className}`}
      style={styles}>
      {Icon && <Icon size={16} strokeWidth={2.4} />}
      {children}
    </button>
  );
}

// ─── MicButton (dictée vocale via Web Speech API) ────────────────
// Capture la voix de l'utilisateur et appelle onTranscript avec le texte
function MicButton({ onTranscript, lang = 'fr-FR', size = 38, title = 'Dictée vocale' }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = typeof window !== 'undefined'
      && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) { setSupported(false); return; }
    const rec = new SpeechRecognition();
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;
    rec.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join(' ').trim();
      if (text) onTranscript(text);
    };
    rec.onerror = (e) => { console.warn('SpeechRecognition error:', e.error); setListening(false); };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    return () => { try { rec.abort(); } catch {} };
  }, [lang, onTranscript]);

  const toggle = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (listening) { try { rec.stop(); } catch {} return; }
    try {
      rec.start();
      setListening(true);
    } catch (e) {
      console.warn('SpeechRecognition start failed:', e);
    }
  };

  if (!supported) return null;

  return (
    <button onClick={toggle} type="button" title={title}
      aria-label={listening ? 'Arrêter la dictée' : 'Démarrer la dictée'}
      className="rounded-full flex items-center justify-center gold-tap"
      style={{
        width: size, height: size,
        backgroundColor: listening ? C.red : C.surface,
        border: `1px solid ${listening ? C.red : C.border}`,
        color: listening ? C.text : C.gold,
        animation: listening ? 'goldTap 1s ease-out infinite' : 'none',
      }}>
      {listening ? <MicOff size={size * 0.45} strokeWidth={2.4} /> : <Mic size={size * 0.45} strokeWidth={2.4} />}
    </button>
  );
}

// ─── Avatar (image OU initiales) ─────────────────────────────────
function Avatar({ profile, size = 48, ringColor, ringWidth = 2, className = '' }) {
  const url = profile?.avatar_url;
  const initial = (profile?.full_name || '?').charAt(0).toUpperCase();
  const fontSize = Math.round(size * 0.45);
  const style = {
    width: size, height: size,
    borderRadius: '50%',
    backgroundColor: C.surface,
    color: C.gold,
    fontWeight: 800,
    fontSize,
    border: ringColor ? `${ringWidth}px solid ${ringColor}` : 'none',
    overflow: 'hidden',
    flexShrink: 0,
  };
  if (url) {
    return (
      <div style={style} className={`flex items-center justify-center ${className}`}>
        <img src={url} alt={profile?.full_name || 'avatar'}
          loading="lazy" decoding="async"
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      </div>
    );
  }
  return (
    <div style={style} className={`flex items-center justify-center ${className}`}>
      {initial}
    </div>
  );
}

function IconButton({ icon: Icon, label, onClick, active, count }) {
  // Style nu (sans cercle) — l'icône respire directement sur la vidéo,
  // l'état actif = icône remplie + couleur, plus l'ombre portée pour la lisibilité.
  const iconColor = active ? C.gold : C.text;
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 gold-tap" aria-label={label}>
      <Icon size={32} strokeWidth={2}
        fill={active ? C.gold : 'transparent'}
        style={{ color: iconColor, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.7))' }}
        className={active && Icon === Heart ? 'heart-pop' : ''} />
      {count !== undefined && (
        <span className="text-[11px] font-mono font-bold"
          style={{ color: active ? C.gold : C.text, textShadow: '0 1px 3px rgba(0,0,0,0.85)' }}>
          {count}
        </span>
      )}
    </button>
  );
}

// ═══ FEED ══════════════════════════════════════════════════════════
function VideoCard({ data, muted, onToggleMute, onSelectAthlete }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);

  return (
    <div className="relative h-screen snap-start" style={{ backgroundColor: '#000' }}>
      {data.poster && (
        <img loading="lazy" decoding="async" src={data.poster} alt={data.name}
          className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(8,15,32,0.85) 0%, transparent 50%)' }} />

      <div className="absolute top-12 left-4 right-4 flex items-center justify-between fade-in">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md"
          style={{ backgroundColor: 'rgba(8,15,32,0.7)', backdropFilter: 'blur(10px)', border: `1px solid ${C.borderGold}` }}>
          <Sparkles size={11} style={{ color: C.gold }} />
          <span className="font-mono text-[9px] tracking-wider" style={{ color: C.gold }}>
            SPORT DÉTECTÉ · {data.sport.toUpperCase()} · {data.detection?.confidence ?? 95}%
          </span>
        </div>
        <button onClick={onToggleMute}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(8,15,32,0.6)', backdropFilter: 'blur(10px)' }}>
          {muted ? <VolumeX size={14} style={{ color: C.text }} /> : <Volume2 size={14} style={{ color: C.text }} />}
        </button>
      </div>

      <div className="absolute right-3 bottom-32 flex flex-col gap-3">
        <IconButton icon={Heart} label="J'aime" active={liked}
          onClick={() => setLiked(!liked)} count={liked ? '14.3K' : data.likes} />
        <IconButton icon={MessageCircle} label="Commentaires" count={data.comments} />
        <IconButton icon={Bookmark} label="Sauver" active={saved}
          onClick={() => setSaved(!saved)} />
        <IconButton icon={Share2} label="Partager" />
      </div>

      <div className="absolute bottom-24 left-4 right-20 fade-in">
        <button onClick={() => onSelectAthlete?.(data)}
          className="flex items-center gap-2.5 mb-2 text-left">
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold"
            style={{ backgroundColor: C.surface2, color: C.gold, border: `2px solid ${C.gold}` }}>
            {data.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm" style={{ color: C.text }}>{data.name}</span>
              {data.verified && <BadgeCheck size={13} fill={C.gold} stroke={C.bg} strokeWidth={2.5} />}
            </div>
            <span className="font-mono text-[10px]" style={{ color: C.gold }}>{data.handle}</span>
          </div>
        </button>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{data.icon}</span>
          <span className="text-sm font-semibold" style={{ color: C.text }}>{data.position}</span>
          <span className="text-xs" style={{ color: C.textDim }}>· {data.club}</span>
        </div>

        <button onClick={() => setFollowing(!following)}
          className="px-4 py-1.5 rounded-full text-xs font-bold gold-tap"
          style={{
            backgroundColor: following ? 'transparent' : C.gold,
            color: following ? C.gold : C.bg,
            border: `1.5px solid ${C.gold}`,
          }}>
          {following ? 'Suivi' : '+ Suivre'}
        </button>
      </div>
    </div>
  );
}

// ─── Helper formatage compteurs ──────────────────────────────────
function formatCount(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K';
  return String(n);
}

// ─── Helper âge calculé depuis date de naissance ────────────────
// Retourne l'âge calendaire (mis à jour automatiquement chaque année).
function computeAge(birthdate) {
  if (!birthdate) return null;
  const bd = new Date(birthdate);
  if (isNaN(bd.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - bd.getFullYear();
  const hasHadBirthday = (now.getMonth() > bd.getMonth()) ||
    (now.getMonth() === bd.getMonth() && now.getDate() >= bd.getDate());
  if (!hasHadBirthday) age -= 1;
  return age >= 0 ? age : null;
}

// Retourne la saison sportive courante au format "2025/2026"
// (basée sur le mois de début configuré : 8 = août, 9 = septembre)
function currentSeasonLabel(seasonStartMonth = 9) {
  const now = new Date();
  const m = now.getMonth() + 1;
  const y = now.getFullYear();
  const startYear = m >= seasonStartMonth ? y : y - 1;
  return `${startYear}/${startYear + 1}`;
}

// True si on est dans la fenêtre où l'utilisateur devrait penser à
// mettre à jour son club / saison / championnat (1er août → 15 septembre).
function isSeasonReminderWindow() {
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  return (m === 8) || (m === 9 && d <= 15);
}

// ─── Helpers source vidéo (YouTube OU fichier uploadé) ───────────
function getYouTubeIdFromUrl(url) {
  const m = url?.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
  return m ? m[1] : null;
}
function isUploadedVideo(data) {
  return !!data?.video_url && !data?.youtube_url;
}
function getVideoThumb(data) {
  // Priorité : thumbnail_url explicite > YouTube hqdefault > null (le composant gérera le fallback)
  if (data?.thumbnail_url) return data.thumbnail_url;
  const yId = getYouTubeIdFromUrl(data?.youtube_url);
  if (yId) return `https://img.youtube.com/vi/${yId}/hqdefault.jpg`;
  return null;
}

// Extrait une frame d'un fichier vidéo local et retourne une image + un blob JPEG
async function extractFrameFromVideoFile(file, atTime = 0.5) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.src = url;

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      try { URL.revokeObjectURL(url); } catch {}
    };

    video.onloadedmetadata = () => {
      // Position cible : milieu de la vidéo ou atTime (sec), borné
      const target = Math.min(Math.max(atTime, 0), Math.max(0.1, (video.duration || 1) - 0.1));
      const seek = () => {
        const canvas = document.createElement('canvas');
        const w = video.videoWidth || 640;
        const h = video.videoHeight || 360;
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        try {
          ctx.drawImage(video, 0, 0, w, h);
        } catch (e) {
          cleanup(); reject(e); return;
        }
        canvas.toBlob((blob) => {
          if (!blob) { cleanup(); reject(new Error('toBlob a échoué')); return; }
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          const img = new Image();
          img.onload = () => {
            cleanup();
            resolve({ blob, dataUrl, img, width: w, height: h, duration: video.duration });
          };
          img.onerror = (e) => { cleanup(); reject(e); };
          img.src = dataUrl;
        }, 'image/jpeg', 0.82);
      };
      // Sur certains navigateurs il faut "play" + pause pour récupérer une frame
      video.onseeked = () => { seek(); video.onseeked = null; };
      try {
        video.currentTime = target;
      } catch {
        seek();
      }
    };
    video.onerror = (e) => { cleanup(); reject(e); };
  });
}

// ─── COMPOSANT pour afficher les vraies vidéos Supabase ──────────
function SupabaseVideoCard({ data, muted, onToggleMute, engagement, onLike, onOpenComments, onOpenShare,
                             isRecruiter, canBookmark, shortlistStatus, onAddShortlist, isOwnVideo, onSelectProfile,
                             onReport, isSaved, onToggleSave }) {
  const [infoHidden, setInfoHidden] = useState(false);
  const thumbnailUrl = getVideoThumb(data);

  const videoRef = useRef(null);
  const wrapRef = useRef(null);
  const youtubeId = getYouTubeIdFromUrl(data.youtube_url);
  const isUpload = !youtubeId && !!data.video_url;
  const [isPaused, setIsPaused] = useState(false);
  const [ytOpen, setYtOpen] = useState(false);

  // Lecture / pause automatique selon la visibilité (façon TikTok)
  useEffect(() => {
    if (!isUpload) return;
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      const e = entries[0];
      const v = videoRef.current;
      if (!v) return;
      if (e.isIntersecting && e.intersectionRatio >= 0.6) {
        v.play().then(() => setIsPaused(false)).catch(() => {});
      } else {
        v.pause();
        try { v.currentTime = 0; } catch {}
      }
    }, { threshold: [0, 0.6, 1] });
    io.observe(el);
    return () => io.disconnect();
  }, [isUpload]);

  // Synchronise le son avec l'état global (muet par défaut)
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setIsPaused(false); }
    else { v.pause(); setIsPaused(true); }
  };

  const sport = SPORTS.find(s => s.id === data.sport);
  const authorName = data.profiles?.full_name || 'Athlète';
  const stats = engagement || { likes: 0, comments: 0, shares: 0, likedByMe: false };
  const isShortlisted = !!shortlistStatus;

  // Couleur/label selon statut shortlist
  const STATUS_LABELS = {
    en_attente: { label: 'En attente', color: C.textDim },
    essai_en_cours: { label: 'Essai en cours', color: C.gold },
    essai_termine: { label: 'Essai terminé', color: '#3B82F6' },
    signe: { label: 'Signé', color: C.green },
  };
  const statusInfo = isShortlisted ? STATUS_LABELS[shortlistStatus] : null;

  return (
    <div className="relative h-screen snap-start flex flex-col"
      style={{ backgroundColor: '#000' }}>

      {/* Zone vidéo — lecture INTÉGRÉE dans la carte (façon TikTok, sans agrandissement) */}
      <div ref={wrapRef} className="relative flex-1 w-full overflow-hidden">
        {isUpload ? (
          <>
            {/* Vidéo uploadée : lecture auto en plein cadre, tap pour pause/lecture */}
            <video
              ref={videoRef}
              src={data.video_url}
              poster={thumbnailUrl || undefined}
              loop muted playsInline preload="metadata"
              onClick={togglePlay}
              className="absolute inset-0 w-full h-full object-contain"
              style={{ backgroundColor: '#000' }} />
            {/* Icône play affichée uniquement quand l'utilisateur a mis en pause */}
            {isPaused && (
              <button onClick={togglePlay} aria-label="Lecture"
                className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,184,0,0.95)' }}>
                  <Play size={32} fill={C.bg} stroke={C.bg} className="ml-1" />
                </div>
              </button>
            )}
          </>
        ) : ytOpen && youtubeId ? (
          // Vidéo YouTube : iframe intégré DANS la carte (pas d'overlay plein écran)
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&playsinline=1&rel=0`}
            title={data.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            className="absolute inset-0 w-full h-full"
            style={{ border: 0 }} />
        ) : (
          // Miniature YouTube : tap = lecture intégrée dans la carte
          <button onClick={() => setYtOpen(true)} className="absolute inset-0 w-full h-full">
            {thumbnailUrl ? (
              <img loading="lazy" decoding="async" src={thumbnailUrl} alt={data.title}
                className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ backgroundColor: C.surface }}>
                <span style={{ color: C.textDim }}>Vidéo</span>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255,184,0,0.95)' }}>
                <Play size={32} fill={C.bg} stroke={C.bg} className="ml-1" />
              </div>
            </div>
          </button>
        )}

        {/* Overlay gradient (laisse passer les clics vers la vidéo) */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%)' }} />

        {/* Bouton son (muet/activé) — vidéos uploadées uniquement */}
        {isUpload && (
          <button onClick={(e) => { e.stopPropagation(); onToggleMute?.(); }}
            aria-label={muted ? 'Activer le son' : 'Couper le son'}
            className="absolute top-24 right-3 w-10 h-10 rounded-full flex items-center justify-center z-10"
            style={{
              backgroundColor: 'rgba(8,15,32,0.6)',
              backdropFilter: 'blur(10px)',
              border: `1px solid rgba(255,255,255,0.15)`,
            }}>
            {muted
              ? <VolumeX size={18} style={{ color: C.text }} strokeWidth={2.2} />
              : <Volume2 size={18} style={{ color: C.text }} strokeWidth={2.2} />}
          </button>
        )}
      </div>

      {/* Colonne droite : actions like/commentaire/partage + shortlist + menu options */}
      <div className="absolute right-3 bottom-32 flex flex-col gap-3 z-10">
        <IconButton icon={Heart} label="J'aime" active={stats.likedByMe}
          onClick={(e) => { e?.stopPropagation?.(); onLike?.(data.id); }}
          count={formatCount(stats.likes)} />
        <IconButton icon={MessageCircle} label="Commentaires"
          onClick={(e) => { e?.stopPropagation?.(); onOpenComments?.(data); }}
          count={formatCount(stats.comments)} />
        <IconButton icon={Share2} label="Partager"
          onClick={(e) => { e?.stopPropagation?.(); onOpenShare?.(data); }}
          count={formatCount(stats.shares)} />
        {/* Bouton Signaler — accessible à tous (sauf sur sa propre vidéo) */}
        {!isOwnVideo && (
          <IconButton icon={Flag} label="Signaler"
            onClick={(e) => { e?.stopPropagation?.(); onReport?.('video', data.id, data.title); }} />
        )}
        {/* Bouton enregistrer (favoris) — recruteurs + observateurs */}
        {canBookmark && !isOwnVideo && (
          <IconButton icon={Bookmark} label="Enregistrer" active={isSaved}
            onClick={(e) => { e?.stopPropagation?.(); onToggleSave?.(data.id); }} />
        )}
        {isRecruiter && !isOwnVideo && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddShortlist?.(data); }}
            aria-label={isShortlisted ? `Shortlist: ${statusInfo?.label}` : 'Ajouter à la shortlist'}
            className="flex flex-col items-center gap-1 gold-tap">
            <div className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: isShortlisted ? C.gold : 'rgba(8,15,32,0.5)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${isShortlisted ? C.gold : 'rgba(255,255,255,0.15)'}`,
              }}>
              <Star size={20} strokeWidth={2.2}
                fill={isShortlisted ? C.bg : 'transparent'}
                style={{ color: isShortlisted ? C.bg : C.text }} />
            </div>
            <span className="text-[10px] font-mono font-bold inline-flex items-center gap-1"
              style={{ color: isShortlisted ? C.gold : C.text, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
              {isShortlisted ? statusInfo?.label : 'Shortlist'}
              {shortlistStatus === 'essai_en_cours' && (
                <span className="dot-jump" aria-hidden="true"><span /><span /><span /></span>
              )}
            </span>
          </button>
        )}

      </div>

      {/* Infos en bas (masquables) */}
      <div className="absolute bottom-24 left-4 right-20 fade-in z-10">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <button onClick={(e) => { e.stopPropagation(); data.profiles && onSelectProfile?.(data.profiles); }}
            aria-label="Voir le profil"
            className="flex-shrink-0">
            <Avatar profile={data.profiles} size={48} ringColor={C.gold} />
          </button>
          {/* Niveau de l'athlète — masquable via le bouton œil */}
          {!infoHidden && data.profiles?.level && <LevelChip level={data.profiles.level} />}
          {/* Bouton œil — placé après le niveau */}
          <button onClick={(e) => { e.stopPropagation(); setInfoHidden(h => !h); }}
            aria-label={infoHidden ? 'Afficher les infos' : 'Masquer les infos'}
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: 'rgba(8,15,32,0.6)',
              backdropFilter: 'blur(10px)',
              border: `1px solid rgba(255,255,255,0.15)`,
            }}>
            {infoHidden
              ? <Eye size={13} style={{ color: C.text }} strokeWidth={2.2} />
              : <EyeOff size={13} style={{ color: C.text }} strokeWidth={2.2} />}
          </button>
          {/* Catégorie de la vidéo (Match ou Entraînement) — masquable via le bouton œil */}
          {!infoHidden && data.video_type && <VideoTypeBadge type={data.video_type} />}
          {/* Poste de l'athlète — affiché en dessous du type, masquable aussi */}
          {!infoHidden && data.position && (
            <span className="inline-flex items-center gap-1 rounded-full font-semibold px-2.5 py-1 text-[11px]"
              style={{
                backgroundColor: 'rgba(8,15,32,0.65)', color: C.text,
                border: `1px solid rgba(255,255,255,0.15)`, backdropFilter: 'blur(6px)',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}>
              🎯 {data.position}
            </span>
          )}
        </div>

        {!infoHidden && (
          <>
            <h2 className="text-lg font-extrabold mb-1" style={{ color: C.text }}>
              {data.title}
            </h2>

            {/* Ligne meta : âge · catégorie d'âge · niveau spécifique vidéo */}
            {(() => {
              const authorAge = computeAge(data.profiles?.birthdate) ?? data.profiles?.age;
              const videoLevelLabel = data.level && {
                amateur: '🌱 Amateur', semi_pro: '⭐ Semi-pro',
                pro: '🏆 Pro', entrainement: '🏋️ Entraînement',
              }[data.level];
              const items = [];
              if (authorAge) items.push(`${authorAge} ans`);
              if (data.age_category) items.push(data.age_category);
              if (videoLevelLabel) items.push(videoLevelLabel);
              if (items.length === 0) return null;
              return (
                <div className="text-xs mb-1" style={{ color: C.textDim }}>
                  {items.join(' · ')}
                </div>
              );
            })()}

            {/* Championnat (mise en avant gold) */}
            {data.championship && (
              <div className="text-xs font-semibold mb-1" style={{ color: C.gold }}>
                🏆 {data.championship}
              </div>
            )}

            {data.description && (
              <p className="text-xs line-clamp-2" style={{ color: C.textDim }}>
                {data.description}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── LECTEUR VIDÉO en overlay (YouTube iframe OU fichier natif) ───
function YouTubePlayer({ video, onClose }) {
  const youtubeId = getYouTubeIdFromUrl(video.youtube_url);
  const isUpload = !youtubeId && !!video.video_url;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col"
      style={{ backgroundColor: '#000' }}>

      {/* Header avec bouton fermer */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: C.bg }}>
        <button onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: C.surface }}>
          <X size={20} style={{ color: C.text }} />
        </button>
        <div className="text-sm font-semibold truncate flex-1 mx-3 text-center" style={{ color: C.text }}>
          {video.title}
        </div>
        <div className="w-10" />
      </div>

      {/* Lecteur */}
      <div className="flex-1 flex items-center justify-center">
        {youtubeId ? (
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ border: 0 }}
          />
        ) : isUpload ? (
          <video
            src={video.video_url}
            poster={video.thumbnail_url || undefined}
            controls
            autoPlay
            playsInline
            className="w-full h-full"
            style={{ backgroundColor: '#000', objectFit: 'contain' }}
          />
        ) : (
          <div style={{ color: C.textDim }}>Vidéo introuvable</div>
        )}
      </div>
    </div>
  );
}

// ─── COMMENTAIRES MODAL ─────────────────────────────────────────
function CommentsModal({ video, currentUserId, onClose, onAdd, onDelete }) {
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*, profiles!comments_user_id_fkey(id, full_name, is_recruiter, avatar_url, level, sport)')
        .eq('video_id', video.id)
        .order('created_at', { ascending: false });
      if (cancel) return;
      if (error) console.error('Erreur chargement commentaires:', error);
      setComments(data || []);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [video.id]);

  // Realtime : si un profil change (nom, avatar, niveau…), patcher les commentaires affichés
  useEffect(() => {
    const channel = supabase
      .channel(`comments-profiles-${video.id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          const updated = payload.new;
          if (!updated?.id) return;
          setComments(prev => prev.map(c =>
            c.profiles?.id === updated.id
              ? { ...c, profiles: { ...c.profiles, ...updated } }
              : c
          ));
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [video.id]);

  const handlePost = async () => {
    if (!draft.trim() || posting) return;
    setPosting(true);
    const newComment = await onAdd(video.id, draft);
    setPosting(false);
    if (newComment) {
      setComments(prev => [newComment, ...prev]);
      setDraft('');
    }
  };

  const handleDelete = async (commentId) => {
    const ok = await onDelete(video.id, commentId);
    if (ok) setComments(prev => prev.filter(c => c.id !== commentId));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}>
      <div className="w-full rounded-t-2xl flex flex-col"
        style={{ backgroundColor: C.bg, height: '75dvh', border: `1px solid ${C.border}` }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: C.border }}>
          <div>
            <div className="text-base font-extrabold" style={{ color: C.text }}>Commentaires</div>
            <div className="text-[11px]" style={{ color: C.textDim }}>{comments.length} commentaire{comments.length > 1 ? 's' : ''}</div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: C.surface }}>
            <X size={16} style={{ color: C.text }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin" style={{ color: C.gold }} />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle size={32} style={{ color: C.textMute }} className="mx-auto mb-2" />
              <p className="text-sm" style={{ color: C.textDim }}>Aucun commentaire pour l'instant</p>
              <p className="text-xs mt-1" style={{ color: C.textMute }}>Sois le premier à réagir !</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {comments.map(c => {
                const isMine = c.user_id === currentUserId;
                const author = c.profiles?.full_name || 'Utilisateur';
                return (
                  <div key={c.id} className="flex gap-2.5">
                    <Avatar profile={c.profiles} size={36} ringColor={C.gold} />
                    <div className="flex-1 min-w-0">
                      <div className="rounded-xl px-3 py-2"
                        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-bold" style={{ color: C.text }}>{author}</span>
                          {c.profiles?.is_recruiter && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold"
                              style={{ backgroundColor: C.goldSoft, color: C.gold }}>Recruteur</span>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: C.text }}>{c.body}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-1 px-1">
                        <span className="text-[10px]" style={{ color: C.textMute }}>
                          {new Date(c.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMine && (
                          <button onClick={() => handleDelete(c.id)}
                            className="text-[10px]" style={{ color: C.red }}>
                            Supprimer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t flex gap-2" style={{ borderColor: C.border }}>
          <input type="text" value={draft} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handlePost(); }}
            placeholder="Ajouter un commentaire…" maxLength={500} disabled={posting}
            className="flex-1 px-3.5 py-2.5 rounded-xl text-sm outline-none"
            style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
          <button onClick={handlePost} disabled={!draft.trim() || posting}
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: draft.trim() && !posting ? C.gold : 'rgba(255,184,0,0.25)',
              color: draft.trim() && !posting ? C.bg : 'rgba(8,15,32,0.4)',
            }}>
            {posting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} strokeWidth={2.4} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PARTAGE MODAL ──────────────────────────────────────────────
function ShareModal({ video, currentUserId, onClose, onShare }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sentTo, setSentTo] = useState(new Set());
  const [copyState, setCopyState] = useState('idle'); // 'idle' | 'success' | 'failed'

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, is_recruiter, avatar_url')
        .neq('id', currentUserId)
        .order('full_name');
      if (cancel) return;
      if (error) console.error('Erreur chargement contacts:', error);
      setContacts(data || []);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [currentUserId]);

  // Fallback de copie compatible iframe / contexte non sécurisé
  const copyToClipboardFallback = (text) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, text.length);
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      console.error('Fallback copy failed:', e);
      return false;
    }
  };

  const handleNativeShare = async () => {
    // Lien partageable : YouTube si dispo, sinon URL publique de la vidéo uploadée
    const url = video.youtube_url || video.video_url;
    const title = video.title;
    const text = `Regarde cette vidéo sur Yatsai : ${title}`;

    // 1) Web Share API (mobile principalement)
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        await onShare(video.id, 'external', null);
        return;
      } catch (e) {
        if (e.name === 'AbortError') return; // user a annulé
        console.warn('Web Share échec, fallback clipboard:', e);
      }
    }

    // 2) Clipboard API moderne (HTTPS / localhost)
    let copied = false;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        copied = true;
      } catch (e) {
        console.warn('Clipboard API échec:', e);
      }
    }

    // 3) Fallback execCommand (vieux navigateurs, iframes restreints)
    if (!copied) copied = copyToClipboardFallback(url);

    if (copied) {
      await onShare(video.id, 'external', null);
      setCopyState('success');
      setTimeout(() => setCopyState('idle'), 2500);
    } else {
      setCopyState('failed');
    }
  };

  const sendToContact = async (contactId) => {
    if (sentTo.has(contactId)) return;
    const { error } = await supabase.from('messages').insert({
      sender_id: currentUserId,
      receiver_id: contactId,
      content: `📹 Regarde cette vidéo : "${video.title}"`,
      video_id: video.id,
    });
    if (error) { console.error('Erreur envoi message:', error); return; }
    await onShare(video.id, 'internal', contactId);
    setSentTo(prev => new Set(prev).add(contactId));
  };

  const filtered = contacts.filter(c =>
    !search || (c.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}>
      <div className="w-full rounded-t-2xl flex flex-col"
        style={{ backgroundColor: C.bg, height: '75dvh', border: `1px solid ${C.border}` }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: C.border }}>
          <div className="text-base font-extrabold" style={{ color: C.text }}>Partager</div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: C.surface }}>
            <X size={16} style={{ color: C.text }} />
          </button>
        </div>

        <div className="px-4 pt-3 pb-2">
          <button onClick={handleNativeShare}
            className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-colors"
            style={{
              backgroundColor: copyState === 'success' ? C.green : copyState === 'failed' ? C.red : C.gold,
              color: copyState === 'idle' ? C.bg : C.text,
            }}>
            <Share2 size={16} strokeWidth={2.4} />
            {copyState === 'success' ? '✓ Lien copié !'
              : copyState === 'failed' ? '⚠️ Copie auto bloquée'
              : (typeof navigator !== 'undefined' && navigator.share ? 'Partager via…' : 'Copier le lien')}
          </button>

          {copyState === 'failed' && (
            <div className="mt-2 fade-in">
              <p className="text-[11px] mb-1.5" style={{ color: C.textDim }}>
                Sélectionne et copie le lien manuellement :
              </p>
              <input type="text" readOnly value={video.youtube_url || video.video_url || ''}
                onFocus={(e) => e.target.select()}
                className="w-full px-3 py-2 rounded-lg text-xs outline-none font-mono"
                style={{ backgroundColor: C.surface, color: C.gold, border: `1px solid ${C.borderGold}` }} />
            </div>
          )}
        </div>

        <div className="px-4 mt-2">
          <div className="text-[10px] font-semibold mb-2" style={{ color: C.gold }}>
            Envoyer à un contact
          </div>
          <div className="relative mb-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMute }} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
              style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin" style={{ color: C.gold }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-sm" style={{ color: C.textDim }}>
              Aucun contact trouvé
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {filtered.map(c => {
                const sent = sentTo.has(c.id);
                return (
                  <button key={c.id} onClick={() => sendToContact(c.id)} disabled={sent}
                    className="flex items-center gap-3 p-2 rounded-lg text-left"
                    style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, opacity: sent ? 0.6 : 1 }}>
                    <Avatar profile={c} size={40} ringColor={C.gold} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: C.text }}>
                        {c.full_name || 'Utilisateur'}
                      </div>
                      {c.is_recruiter && (
                        <div className="text-[10px]" style={{ color: C.gold }}>Recruteur</div>
                      )}
                    </div>
                    <span className="text-xs font-bold" style={{ color: sent ? C.green : C.gold }}>
                      {sent ? '✓ Envoyé' : 'Envoyer'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Filtres de période disponibles dans le feed (chips horizontaux)
const FEED_PERIOD_FILTERS = [
  { id: 1,   label: '24 h' },
  { id: 3,   label: '3 jours' },
  { id: 7,   label: '1 semaine' },
  { id: 30,  label: '1 mois' },
  { id: 90,  label: '3 mois' },
  { id: 180, label: '6 mois' },
  { id: 365, label: '1 an' },
];

function FeedView({ videos, periodFilter, onChangePeriodFilter,
                    typeFilter, onChangeTypeFilter,
                    engagement, currentUserId, isRecruiter, canBookmark, dbShortlist,
                    onLike, onAddComment, onDeleteComment, onShare,
                    onAddToShortlist, onSelectProfile, onOpenSearch, onReport,
                    onOpenNotifications, notifUnreadCount,
                    savedVideoIds, onToggleSaveVideo }) {
  const [muted, setMuted] = useState(true);      // son global du feed (muet par défaut)
  const [commentsVideo, setCommentsVideo] = useState(null);
  const [shareVideo, setShareVideo] = useState(null);

  const isEmpty = !videos || videos.length === 0;
  const hasFilter = !!periodFilter;

  return (
    <>
      {/* Chips de filtre type (Tout / Matchs / Entraînements) — flottants en haut */}
      <div className="fixed top-12 left-28 right-4 z-20 flex gap-1.5 overflow-x-auto scrollbar-none">
        {[
          { id: null,       label: 'Tout',           icon: null },
          { id: 'match',    label: 'Matchs',         icon: '🏆' },
          { id: 'training', label: 'Entraînements',  icon: '🏋️' },
        ].map(f => {
          const active = (typeFilter ?? null) === f.id;
          return (
            <button key={String(f.id)} onClick={() => onChangeTypeFilter?.(f.id)}
              className="px-2.5 py-1 rounded-full text-[10px] font-bold flex-shrink-0 whitespace-nowrap"
              style={{
                backgroundColor: active ? C.gold : 'rgba(8,15,32,0.6)',
                color: active ? C.bg : C.text,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${active ? C.gold : 'rgba(255,255,255,0.15)'}`,
              }}>
              {f.icon ? `${f.icon} ` : ''}{f.label}
            </button>
          );
        })}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center px-6"
          style={{ backgroundColor: C.bg, height: '100dvh' }}>
          <div className="text-6xl mb-4">🎬</div>
          <h2 className="text-xl font-extrabold mb-2 text-center" style={{ color: C.text }}>
            {hasFilter ? 'Aucune vidéo dans cette période' : 'Aucune vidéo encore'}
          </h2>
          <p className="text-sm text-center" style={{ color: C.textDim }}>
            {hasFilter ? (
              <>Essaie un filtre plus large<br />ou clique sur <strong style={{ color: C.gold }}>Tout</strong> pour voir toutes les vidéos.</>
            ) : (
              <>Sois le premier à publier !<br />Clique sur le bouton + en bas.</>
            )}
          </p>
          {hasFilter && (
            <button onClick={() => onChangePeriodFilter?.(null)}
              className="mt-4 px-4 py-2 rounded-full text-xs font-bold"
              style={{ backgroundColor: C.gold, color: C.bg }}>
              Voir tout
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-y-auto snap-y snap-mandatory scrollbar-none"
          style={{ height: '100dvh', backgroundColor: '#000' }}>
          {videos.map(v => {
            const slStatus = dbShortlist?.get(v.user_id)?.status;
            return (
              <SupabaseVideoCard key={v.id} data={v}
                muted={muted} onToggleMute={() => setMuted(m => !m)}
                engagement={engagement?.[v.id]}
                onLike={onLike}
                onOpenComments={setCommentsVideo}
                onOpenShare={setShareVideo}
                isRecruiter={isRecruiter}
                canBookmark={canBookmark}
                shortlistStatus={slStatus}
                onAddShortlist={(vid) => onAddToShortlist?.(vid)}
                isOwnVideo={v.user_id === currentUserId}
                onSelectProfile={onSelectProfile}
                onReport={onReport}
                isSaved={savedVideoIds?.has(v.id)}
                onToggleSave={onToggleSaveVideo} />
            );
          })}
        </div>
      )}

      {/* Loupe Recherche en haut à gauche (overlay fixe) */}
      <button onClick={onOpenSearch} aria-label="Recherche"
        className="fixed top-12 left-4 z-20 w-10 h-10 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: 'rgba(8,15,32,0.6)',
          backdropFilter: 'blur(10px)',
          border: `1px solid rgba(255,255,255,0.15)`,
        }}>
        <Search size={18} style={{ color: C.text }} strokeWidth={2.2} />
      </button>

      {/* Cloche notifications en haut à droite (mais à gauche du menu ... éventuel) */}
      <button onClick={onOpenNotifications} aria-label="Notifications"
        className="fixed top-12 left-16 z-20 w-10 h-10 rounded-full flex items-center justify-center relative"
        style={{
          backgroundColor: 'rgba(8,15,32,0.6)',
          backdropFilter: 'blur(10px)',
          border: `1px solid rgba(255,255,255,0.15)`,
        }}>
        <Bell size={18} style={{ color: C.text }} strokeWidth={2.2} />
        {notifUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1"
            style={{ backgroundColor: C.red, color: C.text, border: `2px solid ${C.bg}` }}>
            {notifUnreadCount > 9 ? '9+' : notifUnreadCount}
          </span>
        )}
      </button>

      {/* Plus d'overlay plein écran : la vidéo se lit directement dans chaque carte */}

      {commentsVideo && (
        <CommentsModal video={commentsVideo} currentUserId={currentUserId}
          onClose={() => setCommentsVideo(null)}
          onAdd={onAddComment} onDelete={onDeleteComment} />
      )}

      {shareVideo && (
        <ShareModal video={shareVideo} currentUserId={currentUserId}
          onClose={() => setShareVideo(null)}
          onShare={onShare} />
      )}
    </>
  );
}

// ═══ DÉTECTEUR IA "VIDÉO DE SPORT" (100% local) ═══════════════════
// Combine 2 méthodes :
//   1. Heuristique TEXTE : mots-clés sportifs dans titre + description + nom du sport
//   2. Vision IA : MobileNet (TensorFlow.js) classifie la miniature YouTube
//      → cherche des objets sportifs (ballon, raquette, jersey, terrain…)
// Si CORS bloque l'image, fallback sur le score texte uniquement.

// 100+ classes ImageNet considérées comme "sportives"
const SPORT_IMAGE_CLASSES = [
  'soccer ball', 'football', 'rugby ball', 'volleyball', 'basketball', 'tennis ball',
  'tennis racket', 'racket', 'racquet', 'baseball', 'baseball bat', 'baseball glove',
  'golf ball', 'golf club', 'football helmet', 'ping-pong ball', 'pool table',
  'ski', 'skis', 'snowboard', 'surfboard', 'skateboard', 'inline skate',
  'punching bag', 'dumbbell', 'barbell', 'parallel bars', 'horizontal bar',
  'balance beam', 'swing', 'jersey', 'sweatshirt', 'maillot',
  'swimming pool', 'swimming trunks', 'bathing suit', 'water bottle',
  'bicycle', 'mountain bike', 'unicycle', 'motorcycle', 'motor scooter',
  'racing car', 'race car', 'horse', 'speedboat', 'paddle',
  'stopwatch', 'whistle', 'scoreboard',
];

const SPORT_TEXT_KEYWORDS = [
  // Sports
  'foot', 'football', 'soccer', 'basket', 'basketball', 'tennis', 'rugby',
  'hand', 'handball', 'volley', 'volleyball', 'natation', 'piscine', 'nage',
  'athle', 'athletisme', 'course', 'sprint', 'marathon', 'sauter', 'lancer',
  'boxe', 'boxer', 'mma', 'judo', 'karate', 'lutte', 'taekwondo', 'krav maga',
  'velo', 'cyclisme', 'cycling', 'bicycle', 'golf', 'skate', 'skating',
  'ski', 'snow', 'snowboard', 'surf', 'surfing',
  'crossfit', 'fitness', 'musculation', 'gym', 'gymnastique',
  // Actions / situations
  'match', 'tournoi', 'championnat', 'finale', 'demi finale', 'quart',
  'but', 'goal', 'panier', 'ace', 'essai', 'point', 'penalty', 'corner',
  'entrainement', 'entraînement', 'training', 'workout', 'compet', 'compétition',
  'stade', 'terrain', 'court', 'salle', 'piste',
  'saison', 'club', 'equipe', 'équipe', 'team',
  // Rôles
  'joueur', 'joueuse', 'athlete', 'athlète', 'sportif', 'sportive',
  'coach', 'entraineur', 'capitaine', 'gardien', 'attaquant', 'defenseur',
  'milieu', 'ailier', 'pivot', 'arbitre',
  // Niveaux / catégories
  'amateur', 'pro', 'professionnel', 'espoir', 'u15', 'u17', 'u18', 'u19', 'u21',
  'r1', 'r2', 'r3', 'national', 'regional', 'départemental', 'departemental',
  'ligue', 'division', 'serie a', 'serie b', 'premier league', 'liga',
];

// Cache du modèle MobileNet (lazy load)
let _mobilenetPromise = null;
function loadMobileNetOnce() {
  if (_mobilenetPromise) return _mobilenetPromise;
  _mobilenetPromise = (async () => {
    const tf = await import('@tensorflow/tfjs');
    await tf.ready();
    const mobilenet = await import('@tensorflow-models/mobilenet');
    return await mobilenet.load({ version: 2, alpha: 1.0 });
  })();
  return _mobilenetPromise;
}

function extractYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
  return m ? m[1] : null;
}

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function checkVideoIsSport({ title, description, youtubeUrl, sport, onProgress, thumbImage }) {
  // thumbImage : HTMLImageElement déjà chargée (utilisée pour les vidéos uploadées)
  // Quand thumbImage est fournie, on skip la partie "miniature YouTube".
  // ─── COUCHE 1 : ANALYSE TEXTE ───
  onProgress?.({ step: 'text', label: '🔍 Analyse du titre et de la description…' });
  const text = stripAccents(((title || '') + ' ' + (description || '')).toLowerCase());
  let textScore = 0;
  const matchedKw = [];
  for (let i = 0; i < SPORT_TEXT_KEYWORDS.length; i++) {
    const kw = SPORT_TEXT_KEYWORDS[i];
    if (text.indexOf(kw) >= 0) {
      textScore++;
      matchedKw.push(kw);
    }
  }
  // Bonus si le nom du sport choisi est mentionné
  const sportObj = SPORTS.find(s => s.id === sport);
  if (sportObj && text.indexOf(stripAccents(sportObj.label.toLowerCase())) >= 0) {
    textScore += 2;
  }

  // Texte très clair (≥4 mots-clés) → on valide direct, pas besoin du visuel
  if (textScore >= 4) {
    return {
      isSport: true,
      confidence: 0.95,
      method: 'texte',
      details: `${textScore} indices sportifs détectés dans le titre/description`,
    };
  }

  // ─── COUCHE 2 : ANALYSE VISUELLE (frame de vidéo OU miniature YouTube + MobileNet) ───
  let visualDetections = [];
  let visualSuccess = false;
  try {
    onProgress?.({ step: 'model', label: '🤖 Chargement du modèle IA (≈10s la 1ère fois)…' });
    const model = await loadMobileNetOnce();

    let img = thumbImage || null;
    if (!img) {
      // Mode YouTube : on tente plusieurs résolutions de miniature
      const yId = extractYouTubeId(youtubeUrl);
      if (!yId) {
        return { isSport: false, confidence: 0, method: 'aucun', details: 'Aucune source vidéo valide' };
      }
      onProgress?.({ step: 'image', label: '🖼 Téléchargement de la miniature…' });
      const candidates = [
        `https://img.youtube.com/vi/${yId}/hqdefault.jpg`,
        `https://img.youtube.com/vi/${yId}/mqdefault.jpg`,
        `https://img.youtube.com/vi/${yId}/default.jpg`,
      ];
      for (let i = 0; i < candidates.length; i++) {
        try { img = await loadImage(candidates[i]); break; } catch {}
      }
      if (!img) throw new Error('Impossible de charger la miniature');
    }

    onProgress?.({ step: 'classify', label: '🧠 Analyse de l\'image en cours…' });
    const predictions = await model.classify(img, 10); // top 10
    visualSuccess = true;
    visualDetections = predictions.filter(p => {
      const cn = p.className.toLowerCase();
      return SPORT_IMAGE_CLASSES.some(c => cn.indexOf(c) >= 0) && p.probability > 0.05;
    });
  } catch (err) {
    console.warn('Analyse visuelle indisponible:', err);
  }

  // ─── DÉCISION FINALE ───
  if (visualDetections.length > 0) {
    return {
      isSport: true,
      confidence: visualDetections[0].probability,
      method: 'image' + (textScore > 0 ? '+texte' : ''),
      details: `Détecté visuellement : ${visualDetections.slice(0, 3).map(d => d.className.split(',')[0]).join(', ')}`,
    };
  }
  // Si le texte avait au moins 2 indices, on accepte avec confiance modérée
  if (textScore >= 2) {
    return {
      isSport: true,
      confidence: 0.6,
      method: 'texte',
      details: `Indices sportifs dans le texte : ${matchedKw.slice(0, 5).join(', ')}`,
    };
  }
  // Si analyse visuelle a réussi mais rien trouvé → c'est probablement pas du sport
  if (visualSuccess) {
    return {
      isSport: false,
      confidence: 0.2,
      method: 'image',
      details: 'Aucun élément sportif détecté dans l\'image ni le texte',
    };
  }
  // Analyse visuelle a échoué (CORS, etc.) ET texte faible → on demande confirmation
  return {
    isSport: false,
    confidence: 0.3,
    method: 'texte (image indisponible)',
    details: 'Pas assez d\'indices sportifs. Précise davantage ton titre et ta description.',
  };
}

// ═══ PUBLISH (avec tracker conservé) ══════════════════════════════
// ─── PUBLISH (Upload direct OU lien YouTube) ──────────────────────
function PublishView({ userProfile, setTab }) {
  const [mode, setMode] = useState('upload'); // 'upload' | 'youtube'
  const [youtubeUrl, setYoutubeUrl] = useState('');
  // Upload direct
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [thumbDataUrl, setThumbDataUrl] = useState(null);
  const [thumbImg, setThumbImg] = useState(null);   // HTMLImageElement (pour l'IA)
  const [thumbBlob, setThumbBlob] = useState(null); // Blob JPEG (pour Storage)
  const [videoDuration, setVideoDuration] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0); // 0..100
  const fileInputRef = useRef(null);
  const captureInputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [sport, setSport] = useState('foot');
  const [position, setPosition] = useState('');
  const [description, setDescription] = useState('');
  const [videoType, setVideoType] = useState(null); // 'match' | 'training'
  // Nouveaux champs vidéo
  const [championship, setChampionship] = useState('');
  const [ageCategory, setAgeCategory] = useState('');
  const [videoLevel, setVideoLevel] = useState(''); // amateur | semi_pro | pro | entrainement
  const [city, setCity] = useState(userProfile?.city || '');
  const [region, setRegion] = useState(userProfile?.region || '');
  const [country, setCountry] = useState(userProfile?.country || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  // Analyse IA
  const [aiStep, setAiStep] = useState(null);
  const [aiResult, setAiResult] = useState(null);

  // Nettoyage URL.createObjectURL au démontage
  useEffect(() => () => {
    if (videoPreviewUrl) { try { URL.revokeObjectURL(videoPreviewUrl); } catch {} }
  }, [videoPreviewUrl]);

  const isValidYouTubeUrl = (url) => {
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return regex.test(url);
  };

  // Limite 200 Mo (cohérent avec le bucket)
  const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

  const onPickFile = async (file) => {
    setError('');
    setAiResult(null);
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setError('Le fichier sélectionné n\'est pas une vidéo.');
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setError(`Vidéo trop lourde (${(file.size / (1024 * 1024)).toFixed(1)} Mo). Maximum 200 Mo.`);
      return;
    }
    // Reset preview précédente
    if (videoPreviewUrl) { try { URL.revokeObjectURL(videoPreviewUrl); } catch {} }
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    setThumbDataUrl(null);
    setThumbImg(null);
    setThumbBlob(null);
    setVideoDuration(null);

    // Extrait une frame pour la miniature + l'IA
    try {
      const frame = await extractFrameFromVideoFile(file, 0.5);
      setThumbDataUrl(frame.dataUrl);
      setThumbImg(frame.img);
      setThumbBlob(frame.blob);
      setVideoDuration(frame.duration || null);
    } catch (e) {
      console.warn('Extraction frame impossible:', e);
      // On laisse l'upload se faire quand même, sans miniature
    }
  };

  const clearUpload = () => {
    if (videoPreviewUrl) { try { URL.revokeObjectURL(videoPreviewUrl); } catch {} }
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setThumbDataUrl(null);
    setThumbImg(null);
    setThumbBlob(null);
    setVideoDuration(null);
    setUploadProgress(0);
    setAiResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (captureInputRef.current) captureInputRef.current.value = '';
  };

  const uploadToStorage = async () => {
    if (!videoFile || !userProfile?.id) return null;
    const stamp = Date.now();
    const ext = (videoFile.name.split('.').pop() || 'mp4').toLowerCase();
    const safeExt = ['mp4', 'mov', 'webm', 'm4v', 'mkv'].includes(ext) ? ext : 'mp4';
    const basePath = `${userProfile.id}/${stamp}`;
    const videoPath = `${basePath}.${safeExt}`;
    const thumbPath = `${basePath}.jpg`;

    setUploadProgress(5);
    // 1) Upload vidéo
    const { error: upErr } = await supabase.storage
      .from('videos')
      .upload(videoPath, videoFile, { cacheControl: '3600', upsert: false, contentType: videoFile.type });
    if (upErr) { setError('Upload vidéo : ' + upErr.message); return null; }
    setUploadProgress(70);

    // 2) Upload miniature si dispo
    let thumbPublicUrl = null;
    if (thumbBlob) {
      const { error: thErr } = await supabase.storage
        .from('videos')
        .upload(thumbPath, thumbBlob, { cacheControl: '3600', upsert: false, contentType: 'image/jpeg' });
      if (!thErr) {
        const { data: thPub } = supabase.storage.from('videos').getPublicUrl(thumbPath);
        thumbPublicUrl = thPub?.publicUrl || null;
      }
    }
    setUploadProgress(90);

    const { data: vPub } = supabase.storage.from('videos').getPublicUrl(videoPath);
    setUploadProgress(100);
    return {
      video_url: vPub?.publicUrl || null,
      thumbnail_url: thumbPublicUrl,
    };
  };

  const insertVideoRow = async (extra = {}) => {
    const row = {
      user_id: userProfile.id,
      title: title.trim(),
      sport,
      position: position.trim() || null,
      description: description.trim() || null,
      video_type: videoType,
      youtube_url: extra.youtube_url ?? null,
      video_url: extra.video_url ?? null,
      thumbnail_url: extra.thumbnail_url ?? null,
      duration_seconds: extra.duration_seconds ?? null,
      championship: championship.trim() || null,
      age_category: ageCategory.trim() || null,
      level: videoLevel || null,
      city: city.trim() || null,
      region: region.trim() || null,
      country: country.trim() || null,
    };
    const { error: insertError } = await supabase.from('videos').insert(row);
    if (insertError) { setError('Erreur : ' + insertError.message); return false; }
    return true;
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    setError(''); setAiResult(null);

    if (!title.trim()) {
      setError('Donne un titre à ta vidéo.');
      return;
    }
    if (!videoType) {
      setError('Choisis le type de la vidéo (Match ou Entraînement / divertissement).');
      return;
    }
    if (mode === 'youtube' && !isValidYouTubeUrl(youtubeUrl)) {
      setError('Lien YouTube invalide. Exemple : https://youtube.com/watch?v=...');
      return;
    }
    if (mode === 'upload' && !videoFile) {
      setError('Sélectionne ou filme une vidéo avant de publier.');
      return;
    }

    setLoading(true);

    // ─── ANALYSE IA AVANT PUBLICATION ───
    const result = await checkVideoIsSport({
      title, description,
      youtubeUrl: mode === 'youtube' ? youtubeUrl : null,
      thumbImage: mode === 'upload' ? thumbImg : null,
      sport,
      onProgress: (s) => setAiStep(s),
    });
    setAiStep(null);
    setAiResult(result);

    if (!result.isSport) {
      setLoading(false);
      return;
    }

    // ─── PUBLICATION ───
    let extra = {};
    if (mode === 'upload') {
      const uploaded = await uploadToStorage();
      if (!uploaded || !uploaded.video_url) {
        setLoading(false);
        return;
      }
      extra = {
        video_url: uploaded.video_url,
        thumbnail_url: uploaded.thumbnail_url,
        duration_seconds: videoDuration ? Math.round(videoDuration) : null,
      };
    } else {
      extra = { youtube_url: youtubeUrl };
    }

    const ok = await insertVideoRow(extra);
    setLoading(false);
    if (!ok) return;

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setYoutubeUrl(''); setTitle(''); setPosition(''); setDescription('');
      setVideoType(null);
      setChampionship(''); setAgeCategory(''); setVideoLevel('');
      setCity(userProfile?.city || ''); setRegion(userProfile?.region || ''); setCountry(userProfile?.country || '');
      clearUpload();
      setAiResult(null);
      setTab('feed');
    }, 2200);
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ backgroundColor: C.bg }}>
        <CheckCircle2 size={64} style={{ color: C.green }} />
        <h2 className="text-2xl font-extrabold mt-4" style={{ color: C.text }}>
          Vidéo publiée !
        </h2>
        <p className="text-sm mt-2" style={{ color: C.textDim }}>
          Redirection vers le feed...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: C.bg }}>
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-extrabold" style={{ color: C.text }}>
          Publier une vidéo
        </h1>
        <p className="text-sm mt-1" style={{ color: C.textDim }}>
          Partage tes meilleures actions
        </p>
      </div>

      <form onSubmit={handlePublish} className="px-5 space-y-4">
        {/* Sélecteur de mode : Uploader / YouTube */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          {[
            { id: 'upload', label: '📱 Filmer / Uploader', icon: <Video size={14} /> },
            { id: 'youtube', label: '▶ Lien YouTube', icon: null },
          ].map(opt => (
            <button key={opt.id} type="button"
              onClick={() => { setMode(opt.id); setError(''); setAiResult(null); }}
              className="py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              style={{
                backgroundColor: mode === opt.id ? C.gold : 'transparent',
                color: mode === opt.id ? C.bg : C.textDim,
              }}>
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>

        {/* MODE UPLOAD */}
        {mode === 'upload' && (
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>
              Vidéo (max 200 Mo) *
            </label>

            {/* Inputs cachés */}
            <input ref={fileInputRef} type="file" accept="video/*" className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0])} />
            <input ref={captureInputRef} type="file" accept="video/*" capture="environment" className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0])} />

            {!videoFile ? (
              <div className="rounded-xl py-8 px-4 text-center"
                style={{ backgroundColor: C.surface, border: `1.5px dashed ${C.border}` }}>
                <Video size={32} style={{ color: C.gold }} className="mx-auto mb-3" />
                <p className="text-xs mb-3" style={{ color: C.textDim }}>
                  Filme directement avec ta caméra, ou choisis un fichier sur ton appareil.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => captureInputRef.current?.click()}
                    className="py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: C.gold, color: C.bg }}>
                    <Camera size={14} /> Filmer
                  </button>
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: 'transparent', color: C.gold, border: `1px solid ${C.borderGold}` }}>
                    <Plus size={14} /> Choisir un fichier
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden"
                style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                <div className="relative" style={{ aspectRatio: '16/9', backgroundColor: '#000' }}>
                  {videoPreviewUrl && (
                    <video src={videoPreviewUrl} controls playsInline
                      className="absolute inset-0 w-full h-full object-contain" />
                  )}
                </div>
                <div className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold truncate" style={{ color: C.text }}>
                      {videoFile.name}
                    </div>
                    <div className="text-[11px]" style={{ color: C.textDim }}>
                      {(videoFile.size / (1024 * 1024)).toFixed(1)} Mo
                      {videoDuration ? ` · ${Math.round(videoDuration)} s` : ''}
                      {thumbDataUrl ? ' · miniature ✓' : ''}
                    </div>
                  </div>
                  <button type="button" onClick={clearUpload}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold"
                    style={{ backgroundColor: 'transparent', color: C.red, border: `1px solid ${C.red}` }}>
                    Retirer
                  </button>
                </div>
                {/* Progress bar */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="h-1 w-full" style={{ backgroundColor: C.border }}>
                    <div className="h-full transition-all"
                      style={{ width: `${uploadProgress}%`, backgroundColor: C.gold }} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODE YOUTUBE */}
        {mode === 'youtube' && (
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>
              Lien YouTube *
            </label>
            <input type="url" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
          </div>
        )}

        {/* Titre */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>
            Titre *
          </label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : Mes 5 meilleurs buts saison 2025" required maxLength={80}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
        </div>

        {/* Sport */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>
            Sport *
          </label>
          <select value={sport} onChange={(e) => setSport(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }}>
            {SPORTS.map(s => (
              <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
            ))}
          </select>
        </div>

        {/* Type de vidéo : Match / Entraînement */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>
            Type de vidéo *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'match',    label: 'Match',    icon: '🏆', desc: 'Compétition officielle' },
              { id: 'training', label: 'Entraînement', icon: '🏋️', desc: 'Entraînement / divertissement' },
            ].map(opt => {
              const active = videoType === opt.id;
              return (
                <button key={opt.id} type="button" onClick={() => setVideoType(opt.id)}
                  className="px-3 py-3 rounded-xl text-left transition-colors"
                  style={{
                    backgroundColor: active ? C.goldSoft : C.surface,
                    color: active ? C.gold : C.text,
                    border: `1px solid ${active ? C.gold : C.border}`,
                  }}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{opt.icon}</span>
                    <span className="text-sm font-bold">{opt.label}</span>
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: C.textMute }}>{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Position */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>
            Poste (optionnel)
          </label>
          <input type="text" value={position} onChange={(e) => setPosition(e.target.value)}
            placeholder="Ex : Milieu offensif, Ailier, Pivot..." maxLength={60}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>
            Description (optionnel)
          </label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Quelques mots sur cette vidéo..." rows={3} maxLength={300}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
          <div className="text-[10px] mt-1 text-right" style={{ color: C.textMute }}>
            {description.length}/300
          </div>
        </div>

        {/* Championnat */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>
            🏆 Championnat (optionnel)
          </label>
          <input type="text" value={championship} onChange={(e) => setChampionship(e.target.value)}
            placeholder="Ex : National 2, Championnat de France, Ligue 1…" maxLength={80}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
        </div>

        {/* Catégorie d'âge */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>
            🎂 Catégorie d'âge (optionnel)
          </label>
          <input type="text" value={ageCategory} onChange={(e) => setAgeCategory(e.target.value)}
            placeholder="Ex : U15, U17, U19, Senior, Vétérans…" maxLength={40}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
        </div>

        {/* Niveau de la vidéo */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>
            🏅 Niveau de la vidéo (optionnel)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'amateur', label: '🌱 Amateur' },
              { id: 'semi_pro', label: '⭐ Semi-pro' },
              { id: 'pro', label: '🏆 Pro' },
              { id: 'entrainement', label: '🏋️ Entraînement' },
            ].map(opt => {
              const active = videoLevel === opt.id;
              return (
                <button key={opt.id} type="button"
                  onClick={() => setVideoLevel(active ? '' : opt.id)}
                  className="py-2.5 rounded-xl text-xs font-semibold"
                  style={{
                    backgroundColor: active ? C.goldSoft : C.surface,
                    color: active ? C.gold : C.text,
                    border: `1px solid ${active ? C.gold : C.border}`,
                  }}>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Localisation (pré-remplie depuis le profil) */}
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>
            📍 Localisation
            <span className="ml-1.5 font-normal" style={{ color: C.textMute }}>
              (pré-remplie depuis tes paramètres)
            </span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] mb-1 block" style={{ color: C.textMute }}>Pays</label>
              <input type="text" value={country} onChange={(e) => setCountry(e.target.value)}
                placeholder="France" maxLength={60}
                className="w-full px-3 py-2.5 rounded-lg text-xs outline-none"
                style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
            </div>
            <div>
              <label className="text-[10px] mb-1 block" style={{ color: C.textMute }}>Région</label>
              <input type="text" value={region} onChange={(e) => setRegion(e.target.value)}
                placeholder="Île-de-France" maxLength={60}
                className="w-full px-3 py-2.5 rounded-lg text-xs outline-none"
                style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
            </div>
            <div>
              <label className="text-[10px] mb-1 block" style={{ color: C.textMute }}>Ville</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                placeholder="Paris" maxLength={60}
                className="w-full px-3 py-2.5 rounded-lg text-xs outline-none"
                style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
            </div>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="px-4 py-3 rounded-xl text-sm"
            style={{ backgroundColor: 'rgba(255,71,87,0.12)', color: C.red, border: `1px solid ${C.red}` }}>
            {error}
          </div>
        )}

        {/* État IA — pendant l'analyse */}
        {aiStep && (
          <div className="px-4 py-3 rounded-xl text-xs flex items-center gap-2"
            style={{ backgroundColor: C.goldSoft, color: C.text, border: `1px solid ${C.borderGold}` }}>
            <Loader2 size={14} className="animate-spin" style={{ color: C.gold }} />
            <span>{aiStep.label}</span>
          </div>
        )}

        {/* Résultat IA — refus de publication */}
        {aiResult && !aiResult.isSport && (
          <div className="px-4 py-3 rounded-xl"
            style={{ backgroundColor: 'rgba(255,71,87,0.12)', color: C.text, border: `1px solid ${C.red}` }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🚫</span>
              <strong style={{ color: C.red }}>Publication bloquée par l'IA</strong>
            </div>
            <p className="text-xs leading-relaxed mb-2">
              Cette vidéo ne semble <strong>pas être du sport</strong>. Yatsai est réservé au contenu sportif.
            </p>
            <p className="text-[11px]" style={{ color: C.textDim }}>
              Analyse : {aiResult.method} · Détail : {aiResult.details}
            </p>
            <p className="text-[11px] mt-2" style={{ color: C.textDim }}>
              💡 Solutions : enrichis le <strong style={{ color: C.text }}>titre</strong> et la
              <strong style={{ color: C.text }}> description</strong> avec des mots-clés sportifs (sport, championnat, niveau, club…), ou vérifie que ton lien YouTube est bien la bonne vidéo.
            </p>
          </div>
        )}

        {/* Résultat IA — confirmation positive */}
        {aiResult && aiResult.isSport && !success && (
          <div className="px-4 py-3 rounded-xl"
            style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: C.text, border: `1px solid ${C.green}` }}>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} style={{ color: C.green }} />
              <span className="text-xs">
                <strong style={{ color: C.green }}>Votre vidéo est bien une vidéo de sport ✓</strong>
              </span>
            </div>
            <p className="text-[11px] mt-1" style={{ color: C.textDim }}>
              {aiResult.details} (confiance {Math.round(aiResult.confidence * 100)}% · {aiResult.method})
            </p>
          </div>
        )}

        {/* Bouton Publier */}
        <button type="submit" disabled={loading}
          className="w-full py-4 rounded-xl text-sm font-extrabold mt-6 flex items-center justify-center gap-2"
          style={{ backgroundColor: C.gold, color: C.bg, opacity: loading ? 0.6 : 1 }}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          {loading
            ? (aiStep
                ? 'Vérification IA…'
                : (mode === 'upload' && uploadProgress > 0 && uploadProgress < 100
                    ? `Upload ${uploadProgress}%…`
                    : 'Publication…'))
            : (aiResult?.isSport ? 'Publier ma vidéo' : '🤖 Vérifier et publier')}
        </button>
      </form>
    </div>
  );
}

// ═══ NOTIFICATIONS PANEL ════════════════════════════════════════════
function NotificationsPanel({ notifications: allNotifs, onClose, onMarkAllRead, onDelete,
                                onSelectProfile, currentUserId }) {
  useEffect(() => {
    // Auto-mark all as read when opened
    onMarkAllRead?.();
  }, []);

  // Respecte les réglages de notifications (Paramètres). Un type désactivé
  // n'est plus affiché ici → les toggles ont un effet réel.
  const pref = (k) => { try { const v = localStorage.getItem('pref_' + k); return v === null ? true : v === '1'; } catch { return true; } };
  const TYPE_PREF = { like: 'notif_likes', comment: 'notif_comments', message: 'notif_messages', follow: 'notif_follows' };
  const notifications = (allNotifs || []).filter(n => {
    const prefKey = TYPE_PREF[n.type];
    return prefKey ? pref(prefKey) : true; // types sans réglage (ex : video_published) toujours affichés
  });

  const ICONS = {
    comment: '💬',
    video_published: '🎬',
    message: '📩',
    follow: '➕',
    like: '❤️',
  };

  return (
    <div className="fixed inset-0 z-[88] flex items-start justify-end fade-in"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}>
      <div className="w-full rounded-l-2xl flex flex-col slide-in-right"
        style={{
          backgroundColor: C.bg, maxWidth: 420, height: '100dvh',
          borderLeft: `1px solid ${C.border}`,
        }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: C.border }}>
          <div className="flex items-center gap-2">
            <Bell size={16} style={{ color: C.gold }} />
            <div className="text-base font-extrabold" style={{ color: C.text }}>Notifications</div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: C.surface }}>
            <X size={16} style={{ color: C.text }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Bell size={36} style={{ color: C.textMute }} className="mx-auto mb-3" />
              <h3 className="text-base font-bold mb-1" style={{ color: C.text }}>Aucune notification</h3>
              <p className="text-xs" style={{ color: C.textDim }}>
                Tu seras prévenu·e quand quelqu'un commente, te suit, ou publie une vidéo.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map(n => {
                const isMessage = n.type === 'message';
                return (
                  <div key={n.id} className="px-4 py-3 flex items-start gap-3"
                    style={{
                      borderBottom: `1px solid ${C.border}`,
                      backgroundColor: n.read ? 'transparent' : 'rgba(255,184,0,0.04)',
                    }}>
                    <button onClick={() => n.actor && onSelectProfile?.(n.actor)} className="flex-shrink-0">
                      <Avatar profile={n.actor} size={40} ringColor={n.read ? C.border : C.gold} ringWidth={1.5} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-1.5">
                        <span className="text-base flex-shrink-0">{ICONS[n.type] || '🔔'}</span>
                        <p className="text-xs leading-relaxed flex-1" style={{ color: C.text }}>
                          {n.body}
                        </p>
                      </div>
                      <div className="text-[10px] mt-1.5" style={{ color: C.textMute }}>
                        {timeAgo(n.created_at)}
                      </div>
                    </div>
                    <button onClick={() => onDelete(n.id)} aria-label="Supprimer"
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 opacity-50"
                      style={{ color: C.textMute }}>
                      <X size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══ FEED SEARCH INLINE (barre + résultats par-dessus le feed) ═════
function FeedSearchInline({ currentUserId, isRecruiter, dbShortlist,
                            onAddToShortlist, onRemoveFromShortlist,
                            onSelectProfile, onPlayVideo, onClose }) {
  const [query, setQuery] = useState('');
  const [searchTab, setSearchTab] = useState('all'); // 'all' | 'users' | 'videos'
  const [profiles, setProfiles] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const inputRef = useRef(null);

  // ─── Filtres VIDÉOS ─────────────────────────────────────────────
  const DEFAULT_FILTERS = {
    sport: null,
    videoType: null,       // 'match' | 'training'
    levels: [],            // niveaux d'auteur
    videoLevels: [],       // niveau spécifique à la vidéo (amateur/semi_pro/pro/entrainement)
    position: '',          // texte libre
    periodDays: null,      // 1, 7, 30, 90, 180
    championship: '',      // nom du championnat
    ageCategory: '',       // U17, U19, Senior…
    country: '',
    region: '',
    city: '',
  };
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Auto-focus à l'ouverture
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Charger profils + vidéos en parallèle (avec auteur)
  useEffect(() => {
    let cancel = false;
    setLoading(true);
    (async () => {
      const [pRes, vRes] = await Promise.all([
        supabase.from('profiles')
          .select('id, full_name, is_recruiter, organization, sport, position, club, age, level, verified, avatar_url')
          .neq('id', currentUserId || '00000000-0000-0000-0000-000000000000')
          .order('created_at', { ascending: false }).limit(80),
        supabase.from('videos')
          .select(`*, profiles!videos_user_id_fkey(id, full_name, avatar_url, sport, level, is_recruiter)`)
          .order('created_at', { ascending: false }).limit(150),
      ]);
      if (cancel) return;
      if (pRes.error) console.error('Erreur profils:', pRes.error);
      if (vRes.error) console.error('Erreur vidéos:', vRes.error);
      // Côté recruteur : on garde seulement les profils athlètes dans la section "Profils"
      const filteredProfiles = (pRes.data || []).filter(p => isRecruiter ? !p.is_recruiter : true);
      setProfiles(filteredProfiles);
      setVideos(vRes.data || []);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [currentUserId, isRecruiter]);

  const norm = (s) => (s || '').toLowerCase().trim();
  const needle = norm(query);

  // ─── Vidéos filtrées ─────────────────────────────────────────
  const filteredVideos = useMemo(() => videos.filter(v => {
    // Filtre texte : titre, description, sport, position, championship, age_category, ville, pays OU nom de l'auteur
    if (needle) {
      const hay = `${v.title || ''} ${v.description || ''} ${v.sport || ''} ${v.position || ''} ${v.championship || ''} ${v.age_category || ''} ${v.city || ''} ${v.region || ''} ${v.country || ''} ${v.profiles?.full_name || ''}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    if (filters.sport && v.sport !== filters.sport) return false;
    if (filters.videoType && v.video_type !== filters.videoType) return false;
    if (filters.levels.length > 0) {
      const lvl = v.profiles?.level;
      if (!lvl || !filters.levels.includes(lvl)) return false;
    }
    // Filtre Niveau spécifique de la vidéo
    if (filters.videoLevels.length > 0) {
      if (!v.level || !filters.videoLevels.includes(v.level)) return false;
    }
    if (filters.position && !norm(v.position).includes(norm(filters.position))) return false;
    if (filters.periodDays && v.created_at) {
      const ageDays = (Date.now() - new Date(v.created_at).getTime()) / 86400000;
      if (ageDays > filters.periodDays) return false;
    }
    if (filters.championship && !norm(v.championship).includes(norm(filters.championship))) return false;
    if (filters.ageCategory && !norm(v.age_category).includes(norm(filters.ageCategory))) return false;
    if (filters.country && !norm(v.country).includes(norm(filters.country))) return false;
    if (filters.region && !norm(v.region).includes(norm(filters.region))) return false;
    if (filters.city && !norm(v.city).includes(norm(filters.city))) return false;
    return true;
  }), [videos, needle, filters]);

  // ─── Profils filtrés (uniquement par texte, pour ne pas dupliquer la logique vidéo) ───
  const filteredProfiles = useMemo(() => {
    if (!needle && !filters.sport && filters.levels.length === 0) return profiles;
    return profiles.filter(p => {
      if (needle) {
        const hay = `${p.full_name || ''} ${p.club || ''} ${p.organization || ''} ${p.position || ''}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (filters.sport && p.sport !== filters.sport) return false;
      if (filters.levels.length > 0 && !filters.levels.includes(p.level)) return false;
      return true;
    });
  }, [profiles, needle, filters]);

  const activeFilterCount = (filters.sport ? 1 : 0)
    + (filters.videoType ? 1 : 0)
    + (filters.levels.length > 0 ? 1 : 0)
    + (filters.videoLevels.length > 0 ? 1 : 0)
    + (filters.position.trim() ? 1 : 0)
    + (filters.periodDays ? 1 : 0)
    + (filters.championship.trim() ? 1 : 0)
    + (filters.ageCategory.trim() ? 1 : 0)
    + (filters.country.trim() ? 1 : 0)
    + (filters.region.trim() ? 1 : 0)
    + (filters.city.trim() ? 1 : 0);

  const toggleLevel = (lv) => setFilters(f => ({
    ...f,
    levels: f.levels.includes(lv) ? f.levels.filter(x => x !== lv) : [...f.levels, lv],
  }));

  const getYouTubeId = (url) => {
    const m = url?.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
    return m ? m[1] : null;
  };

  return (
    <>
      {/* Barre de recherche flottante en haut */}
      <div className="fixed top-0 left-0 right-0 z-[88] px-4 pt-12 pb-3 fade-in"
        style={{
          background: `linear-gradient(180deg, ${C.bg} 70%, transparent 100%)`,
        }}>
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.textMute }} />
            <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Vidéos, athlètes, recruteurs…"
              className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none"
              style={{
                backgroundColor: C.surface, color: C.text,
                border: `1px solid ${C.gold}`,
                boxShadow: `0 4px 20px rgba(0,0,0,0.4)`,
              }} />
            {query && (
              <button onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: C.surface2 }} aria-label="Effacer">
                <X size={11} style={{ color: C.textDim }} />
              </button>
            )}
          </div>
          <MicButton size={46} title="Recherche vocale" onTranscript={(text) => setQuery(text)} />
          <button onClick={() => setFiltersOpen(o => !o)} aria-label="Filtres"
            className="w-12 h-12 rounded-xl flex items-center justify-center relative"
            style={{
              backgroundColor: filtersOpen ? C.gold : C.surface,
              border: `1px solid ${C.borderGold}`,
              color: filtersOpen ? C.bg : C.gold,
            }}
            title="Filtres (sport, type, niveau, poste, période)">
            <SlidersHorizontal size={18} strokeWidth={2.2} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1"
                style={{ backgroundColor: C.red, color: C.text, border: `2px solid ${C.bg}` }}>
                {activeFilterCount}
              </span>
            )}
          </button>
          <button onClick={onClose} aria-label="Fermer la recherche"
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            <X size={18} style={{ color: C.text }} />
          </button>
        </div>
      </div>

      {/* Panneau résultats par-dessus le feed (commence sous la barre) */}
      <div className="fixed left-0 right-0 z-[87] overflow-y-auto fade-in"
        style={{
          top: 92,
          bottom: 0,
          background: `linear-gradient(180deg, rgba(8,15,32,0.95) 0%, ${C.bg} 60%)`,
          backdropFilter: 'blur(20px)',
        }}>
        <div className="px-4 pb-32 pt-3">
          {/* Panneau Filtres (dépliable) */}
          {filtersOpen && (
            <div className="rounded-2xl p-4 mb-4 fade-in space-y-4"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.borderGold}` }}>
              {/* Sport */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: C.text }}>🏆 Sport</label>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setFilters(f => ({ ...f, sport: null }))}
                    className="px-2.5 py-1.5 rounded-full text-[11px] font-medium"
                    style={{
                      backgroundColor: !filters.sport ? C.goldSoft : C.bg,
                      color: !filters.sport ? C.gold : C.text,
                      border: `1px solid ${!filters.sport ? C.gold : C.border}`,
                    }}>Tout</button>
                  {SPORTS.slice(0, 10).map(s => {
                    const active = filters.sport === s.id;
                    return (
                      <button key={s.id} onClick={() => setFilters(f => ({ ...f, sport: active ? null : s.id }))}
                        className="px-2.5 py-1.5 rounded-full text-[11px] font-medium"
                        style={{
                          backgroundColor: active ? C.goldSoft : C.bg,
                          color: active ? C.gold : C.text,
                          border: `1px solid ${active ? C.gold : C.border}`,
                        }}>
                        {s.icon} {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Type de vidéo */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: C.text }}>📹 Type</label>
                <div className="flex gap-1.5">
                  {[
                    { id: null, label: 'Tout' },
                    { id: 'match', label: '🏆 Match' },
                    { id: 'training', label: '🏋️ Entraînement' },
                  ].map(t => {
                    const active = (filters.videoType ?? null) === t.id;
                    return (
                      <button key={String(t.id)} onClick={() => setFilters(f => ({ ...f, videoType: t.id }))}
                        className="px-2.5 py-1.5 rounded-full text-[11px] font-medium"
                        style={{
                          backgroundColor: active ? C.goldSoft : C.bg,
                          color: active ? C.gold : C.text,
                          border: `1px solid ${active ? C.gold : C.border}`,
                        }}>{t.label}</button>
                    );
                  })}
                </div>
              </div>

              {/* Niveaux de l'auteur */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: C.text }}>🏅 Niveau de l'auteur</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'amateur',         label: '🌱 Amateur' },
                    { id: 'young_pro',       label: '🚀 Young Pro' },
                    { id: 'senior_amateur',  label: '✨ Senior Am.' },
                    { id: 'senior_semi_pro', label: '⭐ Semi-Pro' },
                    { id: 'senior_pro',      label: '🏆 Pro' },
                  ].map(lv => {
                    const active = filters.levels.includes(lv.id);
                    return (
                      <button key={lv.id} onClick={() => toggleLevel(lv.id)}
                        className="px-2.5 py-1.5 rounded-full text-[11px] font-medium"
                        style={{
                          backgroundColor: active ? C.goldSoft : C.bg,
                          color: active ? C.gold : C.text,
                          border: `1px solid ${active ? C.gold : C.border}`,
                        }}>{lv.label}</button>
                    );
                  })}
                </div>
              </div>

              {/* Niveau de la vidéo (déclaré à la publication) */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: C.text }}>🎬 Niveau de la vidéo</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'amateur',      label: '🌱 Amateur' },
                    { id: 'semi_pro',     label: '⭐ Semi-pro' },
                    { id: 'pro',          label: '🏆 Pro' },
                    { id: 'entrainement', label: '🏋️ Entraînement' },
                  ].map(lv => {
                    const active = filters.videoLevels.includes(lv.id);
                    return (
                      <button key={lv.id}
                        onClick={() => setFilters(f => ({
                          ...f,
                          videoLevels: active
                            ? f.videoLevels.filter(x => x !== lv.id)
                            : [...f.videoLevels, lv.id],
                        }))}
                        className="px-2.5 py-1.5 rounded-full text-[11px] font-medium"
                        style={{
                          backgroundColor: active ? C.goldSoft : C.bg,
                          color: active ? C.gold : C.text,
                          border: `1px solid ${active ? C.gold : C.border}`,
                        }}>{lv.label}</button>
                    );
                  })}
                </div>
              </div>

              {/* Poste */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: C.text }}>🎯 Poste</label>
                <input type="text" value={filters.position}
                  onChange={(e) => setFilters(f => ({ ...f, position: e.target.value }))}
                  placeholder="Ex : Milieu, Gardien, Ailier…"
                  className="w-full px-2.5 py-2 rounded-lg text-xs outline-none"
                  style={{ backgroundColor: C.bg, color: C.text, border: `1px solid ${C.border}` }} />
              </div>

              {/* Période */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: C.text }}>📹 Vidéo publiée dans</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: null,  label: 'Tout' },
                    { id: 1,     label: '< 24 h' },
                    { id: 7,     label: '< 1 semaine' },
                    { id: 30,    label: '< 1 mois' },
                    { id: 90,    label: '< 3 mois' },
                    { id: 180,   label: '< 6 mois' },
                  ].map(p => {
                    const active = (filters.periodDays ?? null) === p.id;
                    return (
                      <button key={String(p.id)} onClick={() => setFilters(f => ({ ...f, periodDays: p.id }))}
                        className="px-2.5 py-1.5 rounded-full text-[11px] font-medium"
                        style={{
                          backgroundColor: active ? C.goldSoft : C.bg,
                          color: active ? C.gold : C.text,
                          border: `1px solid ${active ? C.gold : C.border}`,
                        }}>{p.label}</button>
                    );
                  })}
                </div>
              </div>

              {/* Championnat */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: C.text }}>🏆 Championnat</label>
                <input type="text" value={filters.championship}
                  onChange={(e) => setFilters(f => ({ ...f, championship: e.target.value }))}
                  placeholder="Ex : National 2, Ligue 1, Régional 1…"
                  className="w-full px-2.5 py-2 rounded-lg text-xs outline-none"
                  style={{ backgroundColor: C.bg, color: C.text, border: `1px solid ${C.border}` }} />
              </div>

              {/* Catégorie d'âge */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: C.text }}>🎂 Catégorie d'âge</label>
                <input type="text" value={filters.ageCategory}
                  onChange={(e) => setFilters(f => ({ ...f, ageCategory: e.target.value }))}
                  placeholder="Ex : U17, U19, Senior, Vétérans…"
                  className="w-full px-2.5 py-2 rounded-lg text-xs outline-none"
                  style={{ backgroundColor: C.bg, color: C.text, border: `1px solid ${C.border}` }} />
              </div>

              {/* Localisation vidéo */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: C.text }}>📍 Localisation</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <input type="text" value={filters.country}
                    onChange={(e) => setFilters(f => ({ ...f, country: e.target.value }))}
                    placeholder="Pays"
                    className="px-2 py-2 rounded-lg text-xs outline-none"
                    style={{ backgroundColor: C.bg, color: C.text, border: `1px solid ${C.border}` }} />
                  <input type="text" value={filters.region}
                    onChange={(e) => setFilters(f => ({ ...f, region: e.target.value }))}
                    placeholder="Région"
                    className="px-2 py-2 rounded-lg text-xs outline-none"
                    style={{ backgroundColor: C.bg, color: C.text, border: `1px solid ${C.border}` }} />
                  <input type="text" value={filters.city}
                    onChange={(e) => setFilters(f => ({ ...f, city: e.target.value }))}
                    placeholder="Ville"
                    className="px-2 py-2 rounded-lg text-xs outline-none"
                    style={{ backgroundColor: C.bg, color: C.text, border: `1px solid ${C.border}` }} />
                </div>
              </div>

              {/* Reset */}
              {activeFilterCount > 0 && (
                <button onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'transparent', color: C.gold, border: `1px solid ${C.borderGold}` }}>
                  <RotateCcw size={12} /> Réinitialiser
                </button>
              )}
            </div>
          )}

          {/* Onglets Tout / Vidéos / Utilisateurs */}
          <div className="flex gap-1.5 mb-4 sticky top-0 z-10 fade-in">
            {[
              { id: 'all',    label: 'Tout',         icon: '✨' },
              { id: 'videos', label: `Vidéos (${filteredVideos.length})`,    icon: '🎬' },
              { id: 'users',  label: `Utilisateurs (${filteredProfiles.length})`, icon: '👤' },
            ].map(tab => {
              const active = searchTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setSearchTab(tab.id)}
                  className="flex-1 py-2 rounded-full text-[11px] font-bold flex items-center justify-center gap-1"
                  style={{
                    backgroundColor: active ? C.gold : C.surface,
                    color: active ? C.bg : C.text,
                    border: `1px solid ${active ? C.gold : C.border}`,
                  }}>
                  <span>{tab.icon}</span> {tab.label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin" style={{ color: C.gold }} />
            </div>
          ) : (
            <>
              {/* Section Vidéos (cachée en mode users) */}
              {searchTab !== 'users' && (
              <>
              <div className="text-[10px] font-semibold mb-3" style={{ color: C.gold }}>
                🎬 VIDÉOS · {filteredVideos.length}
              </div>
              {filteredVideos.length === 0 ? (
                <div className="rounded-2xl py-6 px-4 text-center mb-5"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                  <p className="text-xs" style={{ color: C.textDim }}>Aucune vidéo correspondante.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {filteredVideos.map(v => {
                    const thumb = v.thumbnail_url || (() => {
                      const yId = getYouTubeId(v.youtube_url);
                      return yId ? `https://img.youtube.com/vi/${yId}/hqdefault.jpg` : null;
                    })();
                    return (
                      <button key={v.id} onClick={() => onPlayVideo?.(v)}
                        className="rounded-xl overflow-hidden text-left fade-in"
                        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                        <div className="relative" style={{ aspectRatio: '1', backgroundColor: '#000' }}>
                          {thumb
                            ? <img loading="lazy" decoding="async" src={thumb} alt={v.title} className="w-full h-full object-cover" />
                            : v.video_url
                              ? <video src={`${v.video_url}#t=0.1`} preload="metadata" muted playsInline
                                  className="w-full h-full object-cover" />
                              : null}
                          <div className="absolute inset-0 flex items-center justify-center"
                            style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.7) 100%)' }}>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: 'rgba(255,184,0,0.9)' }}>
                              <Play size={16} fill={C.bg} stroke={C.bg} />
                            </div>
                          </div>
                        </div>
                        <div className="p-2 space-y-0.5">
                          <div className="text-xs font-bold truncate" style={{ color: C.text }}>{v.title || 'Vidéo'}</div>
                          <div className="text-[10px] truncate" style={{ color: C.textDim }}>
                            par {v.profiles?.full_name || 'Athlète'}
                            {v.profiles?.age ? ` · ${v.profiles.age} ans` : ''}
                          </div>
                          {(v.video_type || v.profiles?.level || v.age_category) && (
                            <div className="text-[10px] truncate" style={{ color: C.textMute }}>
                              {v.video_type === 'match' ? '🏆 Match' : v.video_type === 'training' ? '🏋️ Entraînement' : ''}
                              {v.profiles?.level && ` · ${v.profiles.level.replace('_', ' ')}`}
                              {v.age_category && ` · ${v.age_category}`}
                            </div>
                          )}
                          {v.championship && (
                            <div className="text-[10px] truncate" style={{ color: C.gold }}>
                              🏆 {v.championship}
                            </div>
                          )}
                          {(v.city || v.country) && (
                            <div className="text-[10px] truncate" style={{ color: C.textMute }}>
                              📍 {[v.city, v.region, v.country].filter(Boolean).join(', ')}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              </>
              )}

              {/* Section Profils (cachée en mode videos) */}
              {searchTab !== 'videos' && (
              <>
              <div className="text-[10px] font-semibold mb-3" style={{ color: C.gold }}>
                👤 UTILISATEURS · {filteredProfiles.length}
              </div>
              {filteredProfiles.length === 0 ? (
                <div className="rounded-2xl py-6 px-4 text-center"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                  <p className="text-xs" style={{ color: C.textDim }}>Aucun profil correspondant.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredProfiles.map(p => {
                    const status = dbShortlist?.get(p.id)?.status;
                    const showShortlistButton = isRecruiter && onAddToShortlist && !p.is_recruiter;
                    return (
                      <ProfileCard key={p.id} profile={p}
                        onSelect={() => onSelectProfile?.(p)}
                        shortlistStatus={status}
                        onToggleShortlist={showShortlistButton
                          ? () => (status ? onRemoveFromShortlist?.(p.id) : onAddToShortlist?.(p.id))
                          : undefined} />
                    );
                  })}
                </div>
              )}
              </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ═══ PROFILE CARD (carte d'un utilisateur Supabase) ═══════════════
function ProfileCard({ profile, onSelect, onToggleShortlist, shortlistStatus }) {
  const sport = SPORTS.find(s => s.id === profile.sport);
  const isShortlisted = !!shortlistStatus;
  const STATUS_LABELS = {
    en_attente: 'En attente', essai_en_cours: 'Essai', essai_termine: 'Terminé', signe: 'Signé',
  };
  return (
    <div onClick={onSelect}
      className="rounded-xl overflow-hidden flex flex-col fade-in cursor-pointer"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
      <div className="relative flex items-center justify-center"
        style={{ aspectRatio: '1', backgroundColor: C.surface2 }}>
        <Avatar profile={profile} size={80} ringColor={C.gold} />

        {profile.is_recruiter && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1"
            style={{ backgroundColor: 'rgba(8,15,32,0.85)', color: C.gold, backdropFilter: 'blur(8px)' }}>
            <Briefcase size={10} strokeWidth={2.4} />
            Recruteur
          </div>
        )}

        {onToggleShortlist && (
          <button onClick={(e) => { e.stopPropagation(); onToggleShortlist(); }}
            aria-label={isShortlisted ? 'Retirer de la shortlist' : 'Ajouter à la shortlist'}
            className="absolute top-2 right-2 px-2 h-8 rounded-full flex items-center gap-1"
            style={{
              backgroundColor: isShortlisted ? C.gold : 'rgba(8,15,32,0.7)',
              border: `1px solid ${isShortlisted ? C.gold : 'rgba(255,255,255,0.2)'}`,
              backdropFilter: 'blur(10px)',
              color: isShortlisted ? C.bg : '#fff',
            }}>
            <Star size={12} fill={isShortlisted ? C.bg : 'transparent'} strokeWidth={2.4} />
            {isShortlisted && (
              <span className="text-[9px] font-bold">{STATUS_LABELS[shortlistStatus]}</span>
            )}
          </button>
        )}
      </div>

      <div className="p-2.5 flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold truncate" style={{ color: C.text }}>
            {profile.full_name || 'Utilisateur'}
          </span>
          {profile.verified && <BadgeCheck size={12} fill={C.gold} stroke={C.bg} strokeWidth={2.5} />}
        </div>
        <span className="text-[10px] truncate" style={{ color: C.textDim }}>
          {sport?.icon || '🏆'} {sport?.label || 'Sport'}
          {profile.position && ` · ${profile.position}`}
        </span>
        <span className="text-[10px] truncate" style={{ color: C.textDim }}>
          {profile.is_recruiter
            ? (profile.organization || '—')
            : (profile.club || ((computeAge(profile.birthdate) ?? profile.age) ? `${computeAge(profile.birthdate) ?? profile.age} ans` : '—'))}
        </span>
        {profile.level && (
          <div className="mt-1">
            <LevelChip level={profile.level} />
          </div>
        )}
        {(profile.city || profile.country) && (
          <span className="text-[9px] truncate" style={{ color: C.textMute }}>
            📍 {[profile.city, profile.country].filter(Boolean).join(', ')}
          </span>
        )}
      </div>
    </div>
  );
}


// ═══ CHATBOT — Recherche intelligente 100% locale ══════════════════
// Parse la question en mots-clés et score chaque profil en croisant :
// - filtres structurés (sport, âge, niveau, ville, pays)
// - texte libre dans bio, titres/descriptions vidéos, légendes signed_posts

const LEVEL_KW_LIST = [
  { id: 'amateur', terms: ['amateur', 'loisir'] },
  { id: 'young_pro', terms: ['young pro', 'espoir', 'jeune pro'] },
  { id: 'senior_amateur', terms: ['senior amateur'] },
  { id: 'senior_semi_pro', terms: ['semi pro', 'semipro', 'semi-pro'] },
  { id: 'senior_pro', terms: ['pro', 'professionnel', 'elite'] },
  { id: 'no_club', terms: ['sans club', 'libre', 'free agent'] },
];

// Plus de listes hardcodées : on extrait dynamiquement depuis les profils existants.
// Comme ça toute nouvelle ville/pays qu'un utilisateur renseigne devient automatiquement reconnu.

const STOP_WORDS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'au', 'aux',
  'et', 'ou', 'pour', 'avec', 'sans', 'qui', 'que', 'dans', 'sur',
  'cherche', 'trouve', 'aimerais', 'voudrais', 'mon', 'ton', 'son',
  'ans', 'an', 'sport', 'joueur', 'joueuse', 'athlete', 'recruteur',
]);

// Extrait les valeurs uniques d'un champ depuis une liste de profils
function uniqueValues(profiles, field) {
  const set = new Set();
  for (let i = 0; i < profiles.length; i++) {
    const v = profiles[i][field];
    if (v && typeof v === 'string' && v.trim()) {
      set.add(v.trim());
    }
  }
  return Array.from(set);
}

function parseSmartQuery(text, vocab) {
  // vocab = { countries, regions, cities, nationalities } extraits dynamiquement
  const raw = (text || '').trim();
  const q = stripAccents(raw.toLowerCase());
  const filters = {
    sport: null, country: '', region: '', city: '', nationality: '',
    ageMin: 14, ageMax: 35, levels: [],
  };
  const matched = [];
  let working = ' ' + q + ' ';

  const sportEntries = Object.entries(SPORT_KEYWORDS);
  for (let i = 0; i < sportEntries.length; i++) {
    const sportLabel = sportEntries[i][0];
    const kws = sportEntries[i][1];
    if (kws.some(k => q.indexOf(k) >= 0)) {
      const sportObj = SPORTS.find(s => s.label === sportLabel);
      if (sportObj) {
        filters.sport = sportObj.id;
        matched.push('Sport : ' + sportLabel);
        kws.forEach(k => { working = working.split(k).join(' '); });
      }
      break;
    }
  }
  for (let i = 0; i < LEVEL_KW_LIST.length; i++) {
    const lv = LEVEL_KW_LIST[i];
    if (lv.terms.some(t => q.indexOf(t) >= 0)) {
      filters.levels.push(lv.id);
      matched.push('Niveau : ' + lv.id);
      lv.terms.forEach(t => { working = working.split(t).join(' '); });
    }
  }
  // Catégorie U18, U21 — = "moins de N ans"
  const uMatch = q.match(/\bu\s*(\d{1,2})\b/);
  if (uMatch) {
    const cap = Number(uMatch[1]);
    filters.ageMin = 10;
    filters.ageMax = cap;
    matched.push('Moins de ' + cap + ' ans');
    working = working.split(uMatch[0]).join(' ');
  }
  // "moins de N ans"
  const lessMatch = q.match(/moins\s+de\s+(\d{1,2})\s*ans?/);
  if (!uMatch && lessMatch) {
    filters.ageMin = 10;
    filters.ageMax = Number(lessMatch[1]);
    matched.push('Moins de ' + lessMatch[1] + ' ans');
    working = working.split(lessMatch[0]).join(' ');
  }
  // "plus de N ans"
  const moreMatch = q.match(/plus\s+de\s+(\d{1,2})\s*ans?/);
  if (moreMatch) {
    filters.ageMin = Number(moreMatch[1]);
    filters.ageMax = 100;
    matched.push('Plus de ' + moreMatch[1] + ' ans');
    working = working.split(moreMatch[0]).join(' ');
  }
  // "N-M ans"
  const rangeMatch = q.match(/(\d{2})\s*[-a]\s*(\d{2})\s*ans?/);
  if (rangeMatch) {
    filters.ageMin = Number(rangeMatch[1]);
    filters.ageMax = Number(rangeMatch[2]);
    matched.push('Âge ' + filters.ageMin + '-' + filters.ageMax + ' ans');
    working = working.split(rangeMatch[0]).join(' ');
  }

  // Pays / régions / villes / nationalités : dictionnaires DYNAMIQUES depuis les profils en DB.
  // Plus la longue valeur en premier (pour éviter "Aix" qui match dans "Aix-en-Provence").
  const matchDynamic = (list, label, key) => {
    if (filters[key]) return; // déjà trouvé
    const sorted = [...list].sort((a, b) => b.length - a.length);
    for (let i = 0; i < sorted.length; i++) {
      const val = sorted[i];
      const valNorm = stripAccents(val.toLowerCase());
      if (valNorm.length >= 3 && q.indexOf(valNorm) >= 0) {
        filters[key] = val;
        matched.push(label + ' : ' + val);
        working = working.split(valNorm).join(' ');
        return;
      }
    }
  };
  matchDynamic(vocab.cities, 'Ville', 'city');
  matchDynamic(vocab.regions, 'Région', 'region');
  matchDynamic(vocab.countries, 'Pays', 'country');
  matchDynamic(vocab.nationalities, 'Nationalité', 'nationality');

  // Mots-clés résiduels pour text search
  const keywords = working
    .split(/[^a-z0-9]+/i)
    .map(w => w.trim())
    .filter(w => w.length >= 3 && !STOP_WORDS.has(w));

  return { filters, matched, keywords };
}

function scoreProfile(profile, profileVideos, profileSignedPosts, filters, keywords) {
  let score = 0;
  if (filters.sport && profile.sport === filters.sport) score += 5;
  if (filters.levels.length > 0 && filters.levels.indexOf(profile.level) >= 0) score += 4;
  if (profile.age != null && profile.age >= filters.ageMin && profile.age <= filters.ageMax) score += 2;
  if (filters.country) {
    const pc = stripAccents((profile.country || '').toLowerCase());
    if (pc.indexOf(stripAccents(filters.country.toLowerCase())) >= 0) score += 3;
  }
  if (filters.city) {
    const pc = stripAccents((profile.city || '').toLowerCase());
    if (pc.indexOf(stripAccents(filters.city.toLowerCase())) >= 0) score += 3;
  }
  const texts = [];
  texts.push(profile.full_name || '');
  texts.push(profile.bio || '');
  texts.push(profile.position || '');
  texts.push(profile.organization || '');
  texts.push(profile.club || '');
  for (let i = 0; i < profileVideos.length; i++) {
    texts.push((profileVideos[i].title || '') + ' ' + (profileVideos[i].description || ''));
  }
  for (let i = 0; i < profileSignedPosts.length; i++) {
    texts.push(profileSignedPosts[i].caption || '');
  }
  const haystack = stripAccents(texts.join(' ').toLowerCase());
  for (let i = 0; i < keywords.length; i++) {
    if (haystack.indexOf(keywords[i]) >= 0) score += 2;
  }
  return score;
}

// ─── Score une vidéo selon les filtres extraits du chatbot ──────────
function scoreVideo(video, author, filters, keywords) {
  let score = 0;
  if (filters.sport && video.sport === filters.sport) score += 5;
  if (filters.levels && filters.levels.length > 0 && author?.level && filters.levels.includes(author.level)) score += 3;
  if (filters.country) {
    const vc = stripAccents((video.country || '').toLowerCase());
    if (vc.includes(stripAccents(filters.country.toLowerCase()))) score += 3;
  }
  if (filters.city) {
    const vc = stripAccents((video.city || '').toLowerCase());
    if (vc.includes(stripAccents(filters.city.toLowerCase()))) score += 3;
  }
  if (filters.region) {
    const vr = stripAccents((video.region || '').toLowerCase());
    if (vr.includes(stripAccents(filters.region.toLowerCase()))) score += 2;
  }
  // Championship & age_category : match flou
  const haystack = stripAccents([
    video.title || '', video.description || '',
    video.championship || '', video.age_category || '',
    video.sport || '', video.position || '',
    author?.full_name || '', author?.club || '',
  ].join(' ').toLowerCase());
  for (let i = 0; i < keywords.length; i++) {
    if (haystack.includes(keywords[i])) score += 2;
  }
  // Bonus si le mot-clé matche exactement le championnat ou la catégorie d'âge
  for (let i = 0; i < keywords.length; i++) {
    const ch = stripAccents((video.championship || '').toLowerCase());
    const ac = stripAccents((video.age_category || '').toLowerCase());
    if (ch.includes(keywords[i]) || ac.includes(keywords[i])) score += 3;
  }
  return score;
}

// ─── Base de connaissances Yatsai (le chatbot peut expliquer l'app) ──
const KB_ENTRIES = [
  {
    triggers: ['but', 'sert', 'concept', 'cest quoi', 'c est quoi', 'definition', 'app fait quoi', 'application fait', 'principe'],
    answer:
      "Yatsai est le réseau social qui connecte les athlètes et les recruteurs sportifs.\n\n" +
      "👤 Les athlètes publient leurs vidéos pour se faire remarquer, postulent auprès des recruteurs, et se connectent entre eux.\n\n" +
      "💼 Les recruteurs (clubs, scouts, coachs) cherchent de nouveaux talents, gèrent une shortlist avec différents statuts (en attente, essai, signé), et peuvent confirmer une signature de façon sécurisée.\n\n" +
      "L'objectif : démocratiser le recrutement sportif pour que le talent compte plus que les réseaux personnels.",
  },
  {
    triggers: ['publier video', 'publier une video', 'comment publier', 'mettre une video', 'poster une video', 'ajouter une video', 'partager video'],
    answer: ({ isAthlete } = {}) => isAthlete
      ? ("Pour publier une vidéo :\n\n" +
         "1. Tape sur le bouton ➕ doré au centre de la barre du bas\n" +
         "2. Colle l'URL YouTube de ta vidéo ou filme/upload une vidéo directement\n" +
         "3. Donne un titre, choisis ton sport, ton poste, le type (match ou entraînement) et une description\n" +
         "4. Tape « Publier ma vidéo »\n\n" +
         "Ta vidéo apparaîtra immédiatement dans le feed des autres utilisateurs et sur ton profil. Tu peux la supprimer à tout moment depuis ton profil (bouton ⋮ sur la miniature).")
      : ("La publication de vidéos est réservée aux athlètes. Voici comment ils alimentent le feed que tu peux explorer :\n\n" +
         "1. Ils tapent sur le bouton ➕ doré au centre de la barre du bas\n" +
         "2. Ils collent une URL YouTube ou uploadent une vidéo directement\n" +
         "3. Ils renseignent titre, sport, poste, type (match ou entraînement) et description — autant d'infos qui te permettent de les retrouver depuis Recherche."),
  },
  {
    triggers: ['shortlist', 'short-list', 'short list', 'gerer joueurs', 'statut joueurs', 'recruter'],
    answer: ({ isAthlete } = {}) => isAthlete
      // Vu côté athlète : on parle des recruteurs à la 3e personne
      ? ("La shortlist est une fonctionnalité réservée aux recruteurs. Elle leur permet de suivre les athlètes qui les intéressent en 4 catégories :\n\n" +
         "⏳ En attente d'un essai\n" +
         "🏃 Essai en cours\n" +
         "✅ Essai terminé\n" +
         "🏆 Signés\n\n" +
         "Les recruteurs t'ajoutent à leur shortlist depuis ton profil (étoile ⭐) ou directement depuis le feed. Tu n'as rien à faire de ton côté — sauf quand un recruteur te passe en « Signé », auquel cas tu reçois une demande de confirmation par message.\n\n" +
         "⚠️ Tant que tu n'as pas confirmé, l'athlète apparaît côté recruteur avec un badge « En attente ». C'est ce qui protège contre les fausses déclarations.")
      // Vu côté recruteur : on s'adresse au recruteur directement
      : ("La shortlist te permet de suivre tes prospects en 4 catégories :\n\n" +
         "⏳ En attente d'un essai\n" +
         "🏃 Essai en cours\n" +
         "✅ Essai terminé\n" +
         "🏆 Signés\n\n" +
         "Tu ajoutes un athlète depuis son profil (étoile ⭐) ou directement depuis le feed. Tu changes le statut via le menu ▾ de chaque ligne.\n\n" +
         "⚠️ Spécial « Signés » : quand tu passes un athlète en signé, il reçoit une demande de confirmation par message. Tant qu'il n'a pas confirmé, il apparaît avec un badge « En attente ». Cela protège des fausses déclarations."),
  },
  {
    triggers: ['candidature', 'postuler', 'envoyer ma candidature', 'contacter recruteur', 'envoyer cv'],
    answer: ({ isAthlete } = {}) => isAthlete
      // Athlète : on s'adresse à lui directement
      ? ("Pour envoyer une candidature :\n\n" +
         "1. Va dans l'onglet 📨 Messages\n" +
         "2. Tape sur le gros bouton doré « 📨 Envoyer ma candidature »\n" +
         "3. Filtre les recruteurs par localisation (pays/région/ville) ou niveau recruté\n" +
         "4. Sélectionne ceux à contacter\n" +
         "5. Écris ton message et joins des vidéos avec le bouton « ➕ Ajouter une vidéo »\n" +
         "6. Tape « Envoyer à N recruteurs »\n\n" +
         "Chaque recruteur reçoit ta candidature dans sa boîte de messages avec les liens des vidéos jointes. Tu ne peux contacter qu'une seule fois chaque recruteur (anti-spam).")
      // Recruteur : la candidature est une fonctionnalité athlète, on en parle à la 3e personne
      : ("La candidature est une fonctionnalité réservée aux athlètes. Concrètement, voici comment ils te contactent :\n\n" +
         "1. Depuis leur onglet 📨 Messages, ils tapent sur « 📨 Envoyer ma candidature »\n" +
         "2. Ils filtrent les recruteurs par localisation et niveau recruté (donc tes critères de recrutement comptent)\n" +
         "3. Ils sélectionnent ceux à contacter, écrivent un message et joignent leurs vidéos\n" +
         "4. Tu reçois leur candidature dans ta boîte de messages avec les liens des vidéos\n\n" +
         "Un athlète ne peut te contacter qu'une seule fois (anti-spam)."),
  },
  {
    triggers: ['parametres', 'paramètres', 'reglages', 'compte', 'mot de passe', 'changer mdp', 'supprimer compte'],
    answer:
      "Les paramètres (⚙️ en haut à droite de ton profil) :\n\n" +
      "• Compte — modifier ton email/mot de passe\n" +
      "• Confidentialité — compte privé, qui peut te contacter, masquer ton âge/localisation\n" +
      "• Notifications — gérer les alertes (likes, commentaires, messages, abonnés)\n" +
      "• Données — télécharger tes données (RGPD)\n" +
      "• Zone sensible — se déconnecter ou supprimer définitivement son compte (irréversible)\n\n" +
      "Tous tes choix sont sauvegardés automatiquement.",
  },
  {
    triggers: ['signaler', 'signalement', 'reporter', 'bloquer', 'abus'],
    answer:
      "Pour signaler un contenu :\n\n" +
      "• Une vidéo : bouton ⋮ en haut à droite de la vidéo dans le feed → \"Signaler\"\n" +
      "• Un compte : sur le profil de la personne, bouton rouge \"Signaler ce compte\" en bas\n\n" +
      "Choisis un motif (spam, harcèlement, contenu inapproprié, fake, violence) et ajoute des détails si besoin. Notre équipe examine chaque signalement. Un signalement abusif peut entraîner des restrictions sur ton compte.",
  },
  {
    triggers: ['abonnement', 'abonner', 'follow', 'suivre', 'abonne'],
    answer:
      "Pour t'abonner à quelqu'un :\n\n" +
      "1. Ouvre son profil (clic sur son avatar ou son nom)\n" +
      "2. Tape \"+ Suivre\" (devient \"✓ Suivi\")\n\n" +
      "Sur n'importe quel profil, tape sur les compteurs \"Abonnés\" ou \"Abonnements\" pour voir la liste complète. Tu peux aussi suivre/désuivre depuis cette liste.",
  },
  {
    triggers: ['championnat', 'niveau de jeu', 'division', 'ligue', 'r1', 'r2', 'r3', 'national 2', 'national 3'],
    answer:
      "🏆 **À propos des championnats** :\n\n" +
      "L'app n'a pas de champ structuré pour le championnat (varie trop selon sport/pays). À toi de l'indiquer toi-même dans :\n" +
      "• Le **titre** de tes vidéos (ex : « Mes meilleurs buts en R2 — Saison 2026 »)\n" +
      "• La **description** des vidéos\n" +
      "• Ta **bio** sur ton profil\n\n" +
      "💡 **À chaque début de saison (août/septembre)**, pense à mettre à jour ces infos !\n\n" +
      "Les recruteurs pourront alors te trouver via la recherche (filtre mot-clé) ou via le chatbot en posant des questions comme « Joueurs en N2 » ou « Régional 1 Île-de-France ».",
  },
  {
    triggers: ['notes', 'note', 'observations', 'editeur', 'ecrire sur un joueur'],
    answer:
      "📓 **Les Notes** (recruteurs uniquement) sont des documents Word-like pour chaque joueur de ta shortlist :\n\n" +
      "• **Toolbar complète** : gras, italique, souligné, couleurs, surligneur\n" +
      "• **Titres** H1/H2/H3, listes à puces et numérotées, citations, tableaux\n" +
      "• **Insérer** images, sauts de page, encadrés\n" +
      "• **Menu Fichier** : exporter en HTML, texte, ou PDF (via Imprimer)\n" +
      "• **Compteur de mots** en bas\n" +
      "• 🔍 **Recherche** dans le document\n" +
      "• 🔒 **Privées par défaut** — personne d'autre que toi ne les voit\n" +
      "• 📤 **Partage** : possibilité de collaborer entre recruteurs (édition à plusieurs sur le même joueur)\n\n" +
      "Pour y accéder : Shortlist → bouton 📓 sur la ligne d'un athlète.",
  },
  {
    triggers: ['certification', 'certifier', 'certifie', 'badge bleu', 'verifie', 'vérifié'],
    answer:
      "✅ **Demande de certification** (recruteurs uniquement) :\n\n" +
      "Va dans Paramètres ⚙️ → section \"Demander une certification\".\n" +
      "Une fois certifié, ton profil affichera un badge officiel qui rassure les athlètes (anti-fake recruteur).\n" +
      "Notre équipe vérifie ton identité et ton organisation avant validation.",
  },
];

function findKBAnswer(query, context = {}) {
  const q = stripAccents((query || '').toLowerCase());
  for (let i = 0; i < KB_ENTRIES.length; i++) {
    const entry = KB_ENTRIES[i];
    for (let j = 0; j < entry.triggers.length; j++) {
      if (q.indexOf(entry.triggers[j]) >= 0) {
        // Si entry.answer est une fonction, on l'invoque avec le contexte (rôle)
        // pour adapter les pronoms selon le lecteur.
        return typeof entry.answer === 'function' ? entry.answer(context) : entry.answer;
      }
    }
  }
  return null;
}

// Garde-fous : refuse les questions sur des données sensibles
function checkSensitive(query) {
  const q = stripAccents((query || '').toLowerCase());
  if (/(message|messages)\s+(prive|priv)/.test(q) || /messages?\s+entre/.test(q) || /conversation\s+entre/.test(q)) {
    return "🔒 Je n'ai pas accès aux messages privés entre utilisateurs — ils sont protégés par les politiques de sécurité Supabase et ne sortent jamais de votre boîte de réception. Personne d'autre que les deux interlocuteurs ne peut les voir, pas même moi.";
  }
  if (/mot\s*de\s*passe|password|mdp/.test(q)) {
    return "🔒 Je n'ai pas accès aux mots de passe — ils sont stockés sous forme hachée et sécurisée, jamais en clair. Personne (ni l'équipe, ni moi) ne peut les voir. Si tu veux le changer, va dans Paramètres ⚙️ → Changer mon mot de passe.";
  }
  if (/code\s*source|source\s*code|comment.*(es|est).*code|ton\s+code/.test(q)) {
    return "🔒 Je ne dévoile pas le code source de l'application. Pour toute question technique, contacte l'équipe de développement directement.";
  }
  if (/(note|notes)\s+(prive|priv|recruteur|du recruteur|des recruteurs)/.test(q) || /lire\s+les?\s+notes/.test(q)) {
    return "🔒 Les notes des recruteurs sont **strictement privées**. Je n'y ai pas accès et ne les utilise jamais dans mes recherches. Seuls le recruteur propriétaire et les personnes avec qui il a explicitement partagé une note peuvent y accéder.";
  }
  if (/que\s+cherche|recherche\s+des?\s+autres|historique.*recherche|ce qu(e|')\s*on\s+cherche|ce\s+qu['e]\s+(ils?|elle)\s+cherche/.test(q)) {
    return "🔒 Je ne vois jamais ce que les autres utilisateurs recherchent. Chaque session est privée.";
  }
  return null;
}

// Détecte un genre recherché dans la requête ('M' | 'F' | null)
function detectGender(q) {
  const s = stripAccents((q || '').toLowerCase());
  if (/\b(feminin|feminine|femme|femmes|fille|filles|joueuse|joueuses)\b/.test(s)) return 'F';
  if (/\b(masculin|masculine|homme|hommes|garcon|garcons|joueur|joueurs)\b/.test(s)) return 'M';
  return null;
}

// Assistant de recrutement Yatsai — local (sans API), réservé aux recruteurs.
// Comprend une phrase ("attaquant gaucher U18 à Lyon, niveau national"), en
// extrait les critères, et renvoie de VRAIS athlètes cliquables + de l'aide.
function ScoutAIChatbot({ currentUserId, onClose, onSelectProfile, onApplyFilters,
                          dbShortlist, onAddToShortlist, onPlayVideo }) {
  const intro = "👋 Je suis ton assistant de recrutement Yatsai.\n\nJe peux :\n🔎 Trouver des **athlètes** (« attaquant U18 à Lyon »)\n🎬 Trouver des **vidéos** (« vidéos de match foot National »)\n❓ Répondre sur l'**app** (« comment marche la shortlist ? »)";
  const SUGGESTIONS = [
    'Attaquant U18 à Lyon',
    'Vidéos de match foot',
    'Gardien senior pro',
    'Comment marche la shortlist ?',
  ];

  const [messages, setMessages] = useState([{ role: 'assistant', content: intro }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current && endRef.current.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const push = (msg) => setMessages(prev => prev.concat([msg]));

  const send = async (text) => {
    const q = (text == null ? input : text).trim();
    if (!q || loading) return;
    setLoading(true);
    push({ role: 'user', content: q });
    setInput('');

    // 1) Garde-fou données sensibles
    const sensitiveAnswer = checkSensitive(q);
    if (sensitiveAnswer) { push({ role: 'assistant', content: sensitiveAnswer }); setLoading(false); return; }

    try {
      // Athlètes + vidéos (avec leur auteur) + signatures
      const [profilesRes, videosRes, signedRes] = await Promise.all([
        supabase.from('profiles')
          .select('id, full_name, is_recruiter, gender, age, nationality, sport, position, club, level, country, region, city, bio, verified, avatar_url, banner_url, level_proof_status, is_private, hide_location')
          .eq('is_recruiter', false).neq('id', currentUserId || '').or('is_private.is.null,is_private.eq.false'),
        supabase.from('videos')
          .select('id, user_id, title, description, sport, position, video_type, thumbnail_url, youtube_url, video_url, created_at, profiles!videos_user_id_fkey(id, full_name, avatar_url, sport, level, age, gender, city, region, country)'),
        supabase.from('signed_posts').select('id, athlete_id, caption'),
      ]);
      const athletes = profilesRes.data || [];
      const videos = videosRes.data || [];
      const signedPosts = signedRes.data || [];

      const vocab = {
        cities: uniqueValues(athletes, 'city'),
        regions: uniqueValues(athletes, 'region'),
        countries: uniqueValues(athletes, 'country'),
        nationalities: uniqueValues(athletes, 'nationality'),
      };
      const parsed = parseSmartQuery(q, vocab);
      const { filters, matched, keywords } = parsed;
      const gender = detectGender(q);
      if (gender) matched.push('Genre : ' + (gender === 'F' ? 'féminin' : 'masculin'));

      const lq = stripAccents(q.toLowerCase());
      // Intention vidéo ?
      const videoIntent = /\b(video|videos|clip|clips|extrait|extraits|sequence|sequences|replay|images|montre|highlight|highlights)\b/.test(lq);
      // Type de vidéo demandé
      const videoType = /\bmatchs?\b/.test(lq) ? 'match'
        : /\b(entrainement|entrainements|training|entraine)\b/.test(lq) ? 'training' : null;
      if (videoType) matched.push('Type : ' + (videoType === 'match' ? 'match' : 'entraînement'));

      // Critères STRUCTURÉS (sport, lieu, niveau, âge, genre)
      const hasStructured = !!filters.sport || !!filters.city || !!filters.region
        || !!filters.country || filters.levels.length > 0
        || filters.ageMin !== 14 || filters.ageMax !== 35 || !!gender;
      const athleteHint = /\b(athlete|joueur|joueuse|attaquant|buteur|defenseur|defenseuse|gardien|gardienne|milieu|ailier|meneur|pivot|arriere|avant|lateral|ailiere|passeur|libero|talent|profil)\b/.test(lq);

      // ─── BRANCHE VIDÉO ───
      if (videoIntent) {
        // Mots-clés sans les termes "vidéo" eux-mêmes
        const vkw = keywords.filter(k => !/^(video|videos|clip|clips|extrait|extraits|sequence|replay|images|montre|highlight|highlights|match|matchs|entrainement|entrainements|training)$/.test(k));
        const scoredV = [];
        for (const v of videos) {
          const author = v.profiles || null;
          let s = 1 + scoreVideo(v, author, filters, vkw); // base 1 → "vidéos" seul = vidéos récentes
          if (videoType && v.video_type === videoType) s += 4;
          if (gender && author?.gender === gender) s += 2;
          scoredV.push({ video: v, score: s, t: v.created_at || '' });
        }
        scoredV.sort((a, b) => (b.score - a.score) || (a.t < b.t ? 1 : -1));
        const topV = scoredV.slice(0, 8).map(s => s.video);
        const headV = matched.length > 0 ? '🎬 ' + matched.join(' · ') : '🎬 Vidéos';
        if (topV.length === 0) {
          push({ role: 'assistant', content: headV + '\n\nAucune vidéo ne correspond. Essaie d\'élargir tes critères.' });
        } else {
          push({
            role: 'assistant',
            content: headV + `\n\n${topV.length} vidéo${topV.length > 1 ? 's' : ''} :`,
            videoResults: topV,
          });
        }
        setLoading(false);
        return;
      }

      const isSearch = hasStructured || athleteHint;

      // ─── PAS DE RECHERCHE → AIDE (FAQ) ───
      if (!isSearch) {
        const kbAnswer = findKBAnswer(q, { isAthlete: false });
        push({ role: 'assistant', content: kbAnswer
          || "Je peux t'aider à 3 choses :\n\n🔎 **Athlètes** — « ailier U19 à Paris », « gardienne niveau national »\n🎬 **Vidéos** — « vidéos de match basket », « extraits U17 foot »\n❓ **L'app** — shortlist, signature, messages…" });
        setLoading(false);
        return;
      }

      // ─── BRANCHE ATHLÈTE ───
      let pool = athletes;
      if (gender) pool = pool.filter(p => p.gender === gender);

      const scored = [];
      for (const p of pool) {
        const pv = videos.filter(v => v.user_id === p.id);
        const ps = signedPosts.filter(s => s.athlete_id === p.id);
        const s = scoreProfile(p, pv, ps, filters, keywords);
        if (s > 0) scored.push({ profile: p, score: s });
      }
      scored.sort((a, b) => b.score - a.score);
      const top = scored.slice(0, 8).map(s => s.profile);

      const head = matched.length > 0 ? '🔎 ' + matched.join(' · ') : 'Voici les meilleurs résultats';
      if (top.length === 0) {
        push({ role: 'assistant', content: head + '\n\nAucun athlète ne correspond pour le moment. Essaie d\'élargir (retire la ville ou le niveau).' });
      } else {
        push({
          role: 'assistant',
          content: head + `\n\n${top.length} athlète${top.length > 1 ? 's' : ''} trouvé${top.length > 1 ? 's' : ''} :`,
          results: top,
          filters,
        });
      }
    } catch (err) {
      console.error('Chatbot error:', err);
      push({ role: 'assistant', content: 'Erreur : ' + (err.message || String(err)) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[88] flex items-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}>
      <div className="w-full rounded-t-2xl flex flex-col"
        style={{ backgroundColor: C.bg, height: '88dvh', border: '1px solid ' + C.border }}
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: C.border }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: C.goldSoft, border: '1px solid ' + C.borderGold }}>
              <Bot size={16} style={{ color: C.gold }} />
            </div>
            <div>
              <div className="text-sm font-extrabold" style={{ color: C.text }}>Assistant recrutement</div>
              <div className="text-[10px]" style={{ color: C.textDim }}>IA locale · 100% privée</div>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: C.surface }}>
            <X size={16} style={{ color: C.text }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
          {messages.map((m, i) => (
            <div key={i} className="fade-in">
              <div className={'flex ' + (m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className="max-w-[88%]">
                  <div className="px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                    style={{
                      backgroundColor: m.role === 'user' ? C.gold : C.surface,
                      color: m.role === 'user' ? C.bg : C.text,
                      borderBottomRightRadius: m.role === 'user' ? 4 : undefined,
                      borderBottomLeftRadius: m.role === 'assistant' ? 4 : undefined,
                      border: m.role === 'assistant' ? '1px solid ' + C.border : 'none',
                    }}>
                    {m.content}
                  </div>
                </div>
              </div>

              {/* Cartes d'athlètes (résultats cliquables) */}
              {m.results && m.results.length > 0 && (
                <div className="mt-2 flex flex-col gap-2">
                  {m.results.map(a => {
                    const sport = SPORTS.find(s => s.id === a.sport);
                    const inShortlist = !!dbShortlist?.get?.(a.id);
                    return (
                      <div key={a.id} className="rounded-xl p-2.5 flex items-center gap-3"
                        style={{ backgroundColor: C.surface, border: '1px solid ' + C.border }}>
                        <button onClick={() => onSelectProfile?.(a)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                          <Avatar profile={a} size={42} ringColor={C.gold} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="text-sm font-bold truncate" style={{ color: C.text }}>
                                {a.full_name || 'Athlète'}
                              </span>
                              {a.verified && <BadgeCheck size={12} fill={C.gold} stroke={C.bg} strokeWidth={2.5} />}
                            </div>
                            <div className="text-[11px] truncate" style={{ color: C.textDim }}>
                              {sport ? `${sport.icon} ${sport.label}` : ''}{a.position ? ` · ${a.position}` : ''}
                              {(!a.hide_location && a.city) ? ` · 📍 ${a.city}` : ''}
                            </div>
                            {isLevelDisplayable(a) && (
                              <div className="mt-1"><LevelChip level={a.level} /></div>
                            )}
                          </div>
                        </button>
                        {onAddToShortlist && (
                          <button onClick={() => onAddToShortlist(a.id)} disabled={inShortlist}
                            aria-label="Ajouter à la shortlist"
                            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: inShortlist ? C.gold : C.goldSoft,
                              border: '1px solid ' + C.borderGold,
                              color: inShortlist ? C.bg : C.gold,
                            }}>
                            <Star size={15} fill={inShortlist ? C.bg : 'transparent'} strokeWidth={2.2} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {onApplyFilters && m.filters && (
                    <button onClick={() => onApplyFilters(m.filters)}
                      className="mt-1 w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                      style={{ backgroundColor: 'transparent', color: C.gold, border: '1px solid ' + C.borderGold }}>
                      <SlidersHorizontal size={13} /> Voir tous les résultats dans la recherche
                    </button>
                  )}
                </div>
              )}

              {/* Vignettes vidéo (résultats cliquables → lecture) */}
              {m.videoResults && m.videoResults.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {m.videoResults.map(v => {
                    const thumb = getVideoThumb(v);
                    const vsport = SPORTS.find(s => s.id === v.sport);
                    return (
                      <button key={v.id} onClick={() => onPlayVideo?.(v)}
                        className="rounded-xl overflow-hidden text-left"
                        style={{ backgroundColor: C.surface, border: '1px solid ' + C.border }}>
                        <div className="relative" style={{ aspectRatio: '16/10', backgroundColor: '#000' }}>
                          {thumb
                            ? <img loading="lazy" decoding="async" src={thumb} alt={v.title} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Video size={20} style={{ color: C.textMute }} /></div>}
                          <div className="absolute inset-0 flex items-center justify-center"
                            style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.55) 100%)' }}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: 'rgba(255,184,0,0.92)' }}>
                              <Play size={13} fill={C.bg} stroke={C.bg} />
                            </div>
                          </div>
                          {v.video_type && (
                            <div className="absolute top-1.5 left-1.5">
                              <VideoTypeBadge type={v.video_type} />
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <div className="text-[11px] font-bold truncate" style={{ color: C.text }}>{v.title || 'Vidéo'}</div>
                          <div className="text-[10px] truncate" style={{ color: C.textDim }}>
                            {vsport ? `${vsport.icon} ${vsport.label}` : ''}{v.profiles?.full_name ? ` · ${v.profiles.full_name}` : ''}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {/* Suggestions cliquables (uniquement au début) */}
          {messages.length === 1 && !loading && (
            <div className="flex flex-wrap gap-2 mt-1">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: C.surface, color: C.gold, border: '1px solid ' + C.borderGold }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex justify-start fade-in">
              <div className="px-3.5 py-2.5 rounded-2xl flex items-center gap-2"
                style={{ backgroundColor: C.surface, border: '1px solid ' + C.border }}>
                <Loader2 size={14} className="animate-spin" style={{ color: C.gold }} />
                <span className="text-xs" style={{ color: C.textDim }}>Analyse…</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="px-3 py-3 flex gap-2" style={{ borderTop: '1px solid ' + C.border }}>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            placeholder="Ex : attaquant gaucher U18 à Lyon…" disabled={loading}
            className="flex-1 px-3.5 py-2.5 rounded-xl text-sm outline-none"
            style={{ backgroundColor: C.surface, color: C.text, border: '1px solid ' + C.border }} />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: input.trim() && !loading ? C.gold : 'rgba(255,184,0,0.25)',
              color: input.trim() && !loading ? C.bg : 'rgba(8,15,32,0.4)',
            }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} strokeWidth={2.4} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══ SEARCH (Supabase — tous profils ou athlètes uniquement) ═══════
function SearchView({ currentUserId, onSelectProfile, athletesOnly,
                      dbShortlist, onAddToShortlist, onRemoveFromShortlist, headerBadge,
                      onClose, onPlayVideo }) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('profiles'); // 'profiles' | 'videos'
  const DEFAULT_FILTERS = {
    sport: null, ageMin: 14, ageMax: 35,
    country: '', region: '', city: '', nationality: '',
    levels: [], position: '',
    championship: '',
    ageCategory: '',
  };
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    (async () => {
      let q = supabase.from('profiles').select('*');
      if (currentUserId) q = q.neq('id', currentUserId);
      if (athletesOnly) q = q.eq('is_recruiter', false);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (cancel) return;
      if (error) console.error('Erreur chargement profils:', error);
      setProfiles(data || []);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [currentUserId, athletesOnly]);

  // Charge les vidéos pour l'onglet vidéos
  useEffect(() => {
    let cancel = false;
    setVideosLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from('videos')
        .select(`*, profiles!videos_user_id_fkey(id, full_name, avatar_url, sport, level, age, is_recruiter, city, region, country)`)
        .order('created_at', { ascending: false })
        .limit(200);
      if (cancel) return;
      if (error) console.error('Erreur chargement vidéos:', error);
      setVideos(data || []);
      setVideosLoading(false);
    })();
    return () => { cancel = true; };
  }, []);

  // (filtre période supprimé de l'onglet Profils)

  // Realtime : patcher les profils listés dans la recherche
  useEffect(() => {
    const channel = supabase
      .channel(`search-profiles-${currentUserId || 'anon'}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          const updated = payload.new;
          if (!updated?.id) return;
          setProfiles(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
        })
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        (payload) => {
          const inserted = payload.new;
          if (!inserted?.id) return;
          if (currentUserId && inserted.id === currentUserId) return;
          if (athletesOnly && inserted.is_recruiter) return;
          setProfiles(prev => prev.some(p => p.id === inserted.id) ? prev : [inserted, ...prev]);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, athletesOnly]);

  const norm = (s) => (s || '').toLowerCase().trim();

  const filtered = useMemo(() => profiles.filter(p => {
    // Compte privé : exclu de la recherche pour les autres (le propriétaire se voit toujours)
    if (p.is_private && p.id !== currentUserId) return false;
    if (filters.sport && p.sport !== filters.sport) return false;
    // Filtre âge (s'applique dès qu'un profil a un âge renseigné, athlète OU recruteur)
    if (p.age != null && (filters.ageMin !== 14 || filters.ageMax !== 35)) {
      if (p.age < filters.ageMin || p.age > filters.ageMax) return false;
    }
    // Filtres localisation (match flou, insensible à la casse)
    if (filters.country && !norm(p.country).includes(norm(filters.country))) return false;
    if (filters.region && !norm(p.region).includes(norm(filters.region))) return false;
    if (filters.city && !norm(p.city).includes(norm(filters.city))) return false;
    if (filters.nationality && !norm(p.nationality).includes(norm(filters.nationality))) return false;
    // Niveau (multi-select)
    if (filters.levels.length > 0 && !filters.levels.includes(p.level)) return false;
    // Poste — match flou (contient) sur p.position, insensible à la casse
    if (filters.position && !norm(p.position).includes(norm(filters.position))) return false;
    // Recherche texte
    if (query) {
      const needle = query.toLowerCase();
      const hay = `${p.full_name || ''} ${p.club || ''} ${p.organization || ''} ${p.position || ''} ${p.city || ''} ${p.region || ''} ${p.country || ''} ${p.nationality || ''}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  }), [profiles, query, filters, athletesOnly, currentUserId]);

  // Vidéos filtrées (onglet vidéos)
  const filteredVideos = useMemo(() => {
    const needle = (query || '').toLowerCase().trim();
    return videos.filter(v => {
      if (needle) {
        const hay = `${v.title || ''} ${v.description || ''} ${v.sport || ''} ${v.position || ''} ${v.championship || ''} ${v.age_category || ''} ${v.city || ''} ${v.region || ''} ${v.country || ''} ${v.profiles?.full_name || ''}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (filters.sport && v.sport !== filters.sport) return false;
      if (filters.championship && !norm(v.championship).includes(norm(filters.championship))) return false;
      if (filters.ageCategory && !norm(v.age_category).includes(norm(filters.ageCategory))) return false;
      if (filters.country && !norm(v.country).includes(norm(filters.country))) return false;
      if (filters.region && !norm(v.region).includes(norm(filters.region))) return false;
      if (filters.city && !norm(v.city).includes(norm(filters.city))) return false;
      if (filters.levels.length > 0) {
        const lvl = v.profiles?.level;
        if (!lvl || !filters.levels.includes(lvl)) return false;
      }
      return true;
    });
  }, [videos, query, filters]);

  const activeFilters = (filters.sport ? 1 : 0)
    + ((filters.ageMin !== 14 || filters.ageMax !== 35) ? 1 : 0)
    + (filters.country.trim() ? 1 : 0)
    + (filters.region.trim() ? 1 : 0)
    + (filters.city.trim() ? 1 : 0)
    + (filters.nationality.trim() ? 1 : 0)
    + (filters.position.trim() ? 1 : 0)
    + (filters.levels.length > 0 ? 1 : 0)
    + (filters.championship.trim() ? 1 : 0)
    + (filters.ageCategory.trim() ? 1 : 0);

  const resetFilters = () => setFilters(DEFAULT_FILTERS);
  const toggleLevel = (id) => setFilters(f => ({
    ...f,
    levels: f.levels.includes(id) ? f.levels.filter(l => l !== id) : [...f.levels, id],
  }));

  // Chatbot IA (recruteurs uniquement)
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const applyAIFilters = (aiFilters) => {
    if (!aiFilters) return;
    setFilters(prev => ({
      ...prev,
      sport: aiFilters.sport ?? prev.sport,
      country: aiFilters.country ?? prev.country,
      region: aiFilters.region ?? prev.region,
      city: aiFilters.city ?? prev.city,
      nationality: aiFilters.nationality ?? prev.nationality,
      ageMin: aiFilters.ageMin ?? prev.ageMin,
      ageMax: aiFilters.ageMax ?? prev.ageMax,
      levels: Array.isArray(aiFilters.levels) ? aiFilters.levels : prev.levels,
    }));
    setFiltersOpen(true);
    setChatbotOpen(false);
  };

  const labelKind = athletesOnly ? 'athlète' : 'utilisateur';

  return (
    <div className="pt-12 pb-32 overflow-y-auto" style={{ height: '100dvh', backgroundColor: C.bg }}>
      <div className="px-4 mb-4">
        {headerBadge && !onClose && (
          <div className="flex items-center justify-between mb-3">
            <Logo />
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: C.goldSoft }}>
              <Briefcase size={12} style={{ color: C.gold }} />
              <span className="text-xs font-semibold" style={{ color: C.gold }}>Recruteur</span>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-3xl font-extrabold" style={{ color: C.text }}>Recherche</h1>
          {onClose && (
            <button onClick={onClose} aria-label="Fermer"
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              <X size={18} style={{ color: C.text }} />
            </button>
          )}
        </div>
        <p className="text-sm" style={{ color: C.textDim }}>
          {activeTab === 'profiles'
            ? (loading ? 'Chargement…' : `${filtered.length} ${labelKind}${filtered.length > 1 ? 's' : ''} trouvé${filtered.length > 1 ? 's' : ''}`)
            : (videosLoading ? 'Chargement…' : `${filteredVideos.length} vidéo${filteredVideos.length > 1 ? 's' : ''} trouvée${filteredVideos.length > 1 ? 's' : ''}`)}
        </p>
      </div>

      {/* Onglets Profils / Vidéos */}
      <div className="px-4 mb-3">
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          {[
            { id: 'profiles', label: '👤 Profils' },
            { id: 'videos', label: '🎬 Vidéos' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="py-2.5 rounded-lg text-xs font-bold transition-colors"
              style={{
                backgroundColor: activeTab === tab.id ? C.gold : 'transparent',
                color: activeTab === tab.id ? C.bg : C.textDim,
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.textMute }} />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder={activeTab === 'videos'
              ? "Titre, championnat, catégorie, ville…"
              : (athletesOnly ? "Rechercher un athlète, un club, un poste…" : "Rechercher un utilisateur, un club, une organisation…")}
            className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none"
            style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
          {query && (
            <button onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: C.surface2 }} aria-label="Effacer">
              <X size={11} style={{ color: C.textDim }} />
            </button>
          )}
        </div>
        <MicButton onTranscript={(text) => setQuery(text)} size={46} title="Recherche vocale" />
      </div>

      <div className="px-4 mb-3 flex gap-2">
        <button onClick={() => setFiltersOpen(o => !o)}
          className="flex-1 flex items-center justify-between px-4 py-3 rounded-xl"
          style={{
            backgroundColor: filtersOpen ? C.gold : C.surface,
            color: filtersOpen ? C.bg : C.text,
            border: `1px solid ${filtersOpen ? C.gold : C.border}`,
          }}>
          <span className="flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal size={15} strokeWidth={2.4} />
            Filtres
            {activeFilters > 0 && (
              <span className="ml-1 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1"
                style={{
                  backgroundColor: filtersOpen ? C.bg : C.gold,
                  color: filtersOpen ? C.gold : C.bg,
                }}>
                {activeFilters}
              </span>
            )}
          </span>
          {filtersOpen ? <ChevronUp size={16} strokeWidth={2.4} /> : <ChevronDown size={16} strokeWidth={2.4} />}
        </button>

        {/* Assistant IA — recruteurs uniquement (athletesOnly = vue recruteur) */}
        {athletesOnly && (
          <button onClick={() => setChatbotOpen(true)}
            className="flex items-center gap-1.5 px-3 py-3 rounded-xl"
            style={{ backgroundColor: C.surface, color: C.gold, border: `1px solid ${C.borderGold}` }}
            aria-label="Assistant IA">
            <Bot size={16} strokeWidth={2.4} />
            <span className="text-sm font-semibold">IA</span>
          </button>
        )}
      </div>

      {chatbotOpen && athletesOnly && (
        <ScoutAIChatbot
          currentUserId={currentUserId}
          onApplyFilters={applyAIFilters}
          onClose={() => setChatbotOpen(false)}
          onSelectProfile={(p) => { setChatbotOpen(false); onSelectProfile?.(p); }}
          dbShortlist={dbShortlist}
          onAddToShortlist={onAddToShortlist}
          onPlayVideo={(v) => { setChatbotOpen(false); onPlayVideo?.(v); }}
        />
      )}

      {filtersOpen && (
        <div className="px-4 mb-4 fade-in">
          <div className="rounded-xl p-4 flex flex-col gap-4"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: C.text }}>Sport</label>
              <div className="flex flex-wrap gap-2">
                {SPORTS.map(s => {
                  const active = filters.sport === s.id;
                  return (
                    <button key={s.id} onClick={() => setFilters(f => ({ ...f, sport: active ? null : s.id }))}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: active ? C.goldSoft : C.bg,
                        color: active ? C.gold : C.text,
                        border: `1px solid ${active ? C.gold : C.border}`,
                      }}>
                      <span>{s.icon}</span> {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold" style={{ color: C.text }}>Âge</label>
                <span className="font-mono text-[11px]" style={{ color: C.gold }}>
                  {filters.ageMin} – {filters.ageMax} ans
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px]" style={{ color: C.textDim }}>Min</label>
                  <input type="number" min={10} max={100} value={filters.ageMin}
                    onChange={(e) => setFilters(f => ({ ...f, ageMin: Number(e.target.value) || 10 }))}
                    className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
                    style={{ backgroundColor: C.bg, color: C.text, border: `1px solid ${C.border}` }} />
                </div>
                <div>
                  <label className="text-[10px]" style={{ color: C.textDim }}>Max</label>
                  <input type="number" min={10} max={100} value={filters.ageMax}
                    onChange={(e) => setFilters(f => ({ ...f, ageMax: Number(e.target.value) || 100 }))}
                    className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
                    style={{ backgroundColor: C.bg, color: C.text, border: `1px solid ${C.border}` }} />
                </div>
              </div>
            </div>

            {/* Localisation */}
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: C.text }}>📍 Localisation</label>
              <div className="grid grid-cols-3 gap-2">
                <input type="text" value={filters.country}
                  onChange={(e) => setFilters(f => ({ ...f, country: e.target.value }))}
                  placeholder="Pays"
                  className="px-2.5 py-2 rounded-lg text-xs outline-none"
                  style={{ backgroundColor: C.bg, color: C.text, border: `1px solid ${C.border}` }} />
                <input type="text" value={filters.region}
                  onChange={(e) => setFilters(f => ({ ...f, region: e.target.value }))}
                  placeholder="Région"
                  className="px-2.5 py-2 rounded-lg text-xs outline-none"
                  style={{ backgroundColor: C.bg, color: C.text, border: `1px solid ${C.border}` }} />
                <input type="text" value={filters.city}
                  onChange={(e) => setFilters(f => ({ ...f, city: e.target.value }))}
                  placeholder="Ville"
                  className="px-2.5 py-2 rounded-lg text-xs outline-none"
                  style={{ backgroundColor: C.bg, color: C.text, border: `1px solid ${C.border}` }} />
              </div>
            </div>

            {/* Nationalité */}
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: C.text }}>🌐 Nationalité</label>
              <input type="text" value={filters.nationality}
                onChange={(e) => setFilters(f => ({ ...f, nationality: e.target.value }))}
                placeholder="Ex : Française, Sénégalaise…"
                className="w-full px-2.5 py-2 rounded-lg text-xs outline-none"
                style={{ backgroundColor: C.bg, color: C.text, border: `1px solid ${C.border}` }} />
            </div>

            {/* Niveau (multi-select) — disponible pour tous, ne filtre que les profils ayant un level */}
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: C.text }}>🏅 Niveau</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'amateur',         label: '🌱 Amateur' },
                  { id: 'young_pro',       label: '🚀 Young Pro' },
                  { id: 'senior_amateur',  label: '⭐ Senior Am.' },
                  { id: 'senior_semi_pro', label: '⭐⭐ Semi-Pro' },
                  { id: 'senior_pro',      label: '⭐⭐⭐ Pro' },
                  { id: 'no_club',         label: '🆓 Sans club' },
                ].map(lv => {
                  const active = filters.levels.includes(lv.id);
                  return (
                    <button key={lv.id} type="button" onClick={() => toggleLevel(lv.id)}
                      className="px-2.5 py-1.5 rounded-full text-[11px] font-medium"
                      style={{
                        backgroundColor: active ? C.goldSoft : C.bg,
                        color: active ? C.gold : C.text,
                        border: `1px solid ${active ? C.gold : C.border}`,
                      }}>
                      {lv.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Poste / spécialité — champ de texte libre (match flou sur la BDD) */}
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: C.text }}>🎯 Poste</label>
              <input type="text" value={filters.position}
                onChange={(e) => setFilters(f => ({ ...f, position: e.target.value }))}
                placeholder="Ex : Milieu, Gardien, Ailier…"
                className="w-full px-2.5 py-2 rounded-lg text-xs outline-none"
                style={{ backgroundColor: C.bg, color: C.text, border: `1px solid ${C.border}` }} />
              <p className="text-[10px] mt-1" style={{ color: C.textMute }}>
                Tape une partie du poste pour filtrer (lecture directe dans la base).
              </p>
            </div>

            {/* Championnat (onglet vidéos) */}
            {activeTab === 'videos' && (
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: C.text }}>🏆 Championnat</label>
                <input type="text" value={filters.championship}
                  onChange={(e) => setFilters(f => ({ ...f, championship: e.target.value }))}
                  placeholder="Ex : National 2, Ligue 1, Régional 1…"
                  className="w-full px-2.5 py-2 rounded-lg text-xs outline-none"
                  style={{ backgroundColor: C.bg, color: C.text, border: `1px solid ${C.border}` }} />
              </div>
            )}

            {/* Catégorie d'âge (onglet vidéos) */}
            {activeTab === 'videos' && (
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: C.text }}>🎂 Catégorie d'âge</label>
                <input type="text" value={filters.ageCategory}
                  onChange={(e) => setFilters(f => ({ ...f, ageCategory: e.target.value }))}
                  placeholder="Ex : U17, U19, Senior, Vétérans…"
                  className="w-full px-2.5 py-2 rounded-lg text-xs outline-none"
                  style={{ backgroundColor: C.bg, color: C.text, border: `1px solid ${C.border}` }} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <GoldButton variant="outline" icon={RotateCcw} onClick={resetFilters}>Réinitialiser</GoldButton>
              <GoldButton variant="solid" onClick={() => setFiltersOpen(false)}>Voir résultats</GoldButton>
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'profiles' ? loading : videosLoading) ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="animate-spin" style={{ color: C.gold }} />
        </div>
      ) : activeTab === 'profiles' ? (
        filtered.length === 0 ? (
          <div className="px-4 mt-8 text-center">
            <Search size={32} style={{ color: C.textMute }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: C.textDim }}>Aucun {labelKind} trouvé.</p>
            {(query || activeFilters > 0) && (
              <button onClick={() => { setQuery(''); resetFilters(); }} className="text-xs mt-2" style={{ color: C.gold }}>
                Réinitialiser
              </button>
            )}
          </div>
        ) : (
          <div className="px-4 grid grid-cols-2 gap-3">
            {filtered.map(p => {
              const status = dbShortlist?.get(p.id)?.status;
              const showShortlistButton = !!onAddToShortlist && !p.is_recruiter;
              return (
                <ProfileCard key={p.id} profile={p}
                  onSelect={() => onSelectProfile?.(p)}
                  shortlistStatus={status}
                  onToggleShortlist={showShortlistButton
                    ? () => (status ? onRemoveFromShortlist?.(p.id) : onAddToShortlist?.(p.id))
                    : undefined} />
              );
            })}
          </div>
        )
      ) : (
        /* ─── Onglet Vidéos ─── */
        filteredVideos.length === 0 ? (
          <div className="px-4 mt-8 text-center">
            <Search size={32} style={{ color: C.textMute }} className="mx-auto mb-3" />
            <p className="text-sm" style={{ color: C.textDim }}>Aucune vidéo trouvée.</p>
            {(query || activeFilters > 0) && (
              <button onClick={() => { setQuery(''); resetFilters(); }} className="text-xs mt-2" style={{ color: C.gold }}>
                Réinitialiser
              </button>
            )}
          </div>
        ) : (
          <div className="px-4 grid grid-cols-2 gap-2">
            {filteredVideos.map(v => {
              const getYouTubeId = (url) => {
                const m = url?.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
                return m ? m[1] : null;
              };
              const thumb = v.thumbnail_url || (() => {
                const yId = getYouTubeId(v.youtube_url);
                return yId ? `https://img.youtube.com/vi/${yId}/hqdefault.jpg` : null;
              })();
              return (
                <button key={v.id} onClick={() => onPlayVideo?.(v)}
                  className="rounded-xl overflow-hidden text-left fade-in"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                  <div className="relative" style={{ aspectRatio: '1', backgroundColor: '#000' }}>
                    {thumb
                      ? <img loading="lazy" decoding="async" src={thumb} alt={v.title} className="w-full h-full object-cover" />
                      : v.video_url
                        ? <video src={`${v.video_url}#t=0.1`} preload="metadata" muted playsInline
                            className="w-full h-full object-cover" />
                        : null}
                    <div className="absolute inset-0 flex items-center justify-center"
                      style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.7) 100%)' }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(255,184,0,0.9)' }}>
                        <Play size={16} fill={C.bg} stroke={C.bg} />
                      </div>
                    </div>
                  </div>
                  <div className="p-2 space-y-0.5">
                    <div className="text-xs font-bold truncate" style={{ color: C.text }}>{v.title || 'Vidéo'}</div>
                    <div className="text-[10px] truncate" style={{ color: C.textDim }}>
                      par {v.profiles?.full_name || 'Athlète'}
                      {v.profiles?.age ? ` · ${v.profiles.age} ans` : ''}
                    </div>
                    {(v.video_type || v.profiles?.level || v.age_category) && (
                      <div className="text-[10px] truncate" style={{ color: C.textMute }}>
                        {v.video_type === 'match' ? '🏆 Match' : v.video_type === 'training' ? '🏋️ Entraînement' : ''}
                        {v.profiles?.level && ` · ${v.profiles.level.replace('_', ' ')}`}
                        {v.age_category && ` · ${v.age_category}`}
                      </div>
                    )}
                    {v.championship && (
                      <div className="text-[10px] truncate" style={{ color: C.gold }}>
                        🏆 {v.championship}
                      </div>
                    )}
                    {(v.city || v.country) && (
                      <div className="text-[10px] truncate" style={{ color: C.textMute }}>
                        📍 {[v.city, v.region, v.country].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

// DiscoveryView (recruteur) = SearchView avec athletesOnly + bouton shortlist
function DiscoveryView(props) {
  return <SearchView {...props} athletesOnly headerBadge />;
}

// — Le ScoutChatbot (mock NLP) a été retiré : il ciblait des données fictives —
// ═══ MESSAGES ══════════════════════════════════════════════════════
// ─── Helper formatage temps relatif ──────────────────────────
function timeAgo(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'maintenant';
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// ─── NEW CONVERSATION MODAL ─────────────────────────────────────
function NewConversationModal({ currentUserId, onClose, onSelect, onSelectProfile }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, is_recruiter, organization, sport, avatar_url, banner_url')
        .neq('id', currentUserId)
        .order('full_name');
      if (cancel) return;
      if (error) console.error('Erreur chargement contacts:', error);
      setUsers(data || []);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [currentUserId]);

  const filtered = users.filter(u =>
    !search || (u.full_name || '').toLowerCase().includes(search.toLowerCase())
      || (u.organization || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}>
      <div className="w-full rounded-t-2xl flex flex-col"
        style={{ backgroundColor: C.bg, height: '80dvh', border: `1px solid ${C.border}` }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: C.border }}>
          <div className="text-base font-extrabold" style={{ color: C.text }}>Nouvelle conversation</div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: C.surface }}>
            <X size={16} style={{ color: C.text }} />
          </button>
        </div>

        <div className="px-4 py-3 border-b" style={{ borderColor: C.border }}>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMute }} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un utilisateur…"
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
              style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin" style={{ color: C.gold }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-sm" style={{ color: C.textDim }}>
              Aucun utilisateur trouvé
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {filtered.map(u => (
                <div key={u.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                  {/* Tap sur l'utilisateur → voir son profil complet (avec bannière) */}
                  <button onClick={() => onSelectProfile?.(u)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    <Avatar profile={u} size={44} ringColor={C.gold} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: C.text }}>
                        {u.full_name || 'Utilisateur'}
                      </div>
                      <div className="text-[11px] truncate" style={{ color: C.textDim }}>
                        {u.is_recruiter ? `💼 ${u.organization || 'Recruteur'}` : '⚽ Athlète'}
                      </div>
                    </div>
                  </button>
                  {/* Bouton message direct */}
                  <button onClick={() => onSelect(u)}
                    aria-label="Envoyer un message"
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: C.goldSoft, border: `1px solid ${C.borderGold}`, color: C.gold }}>
                    <Send size={16} strokeWidth={2.2} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CANDIDATURE MODAL (athlète) ────────────────────────────────
function CandidatureModal({ currentUser, onClose, onLoadAlreadyApplied, onSend }) {
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  // Nouveaux filtres : critères du recruteur
  const [filterRecruitingLevels, setFilterRecruitingLevels] = useState([]); // niveaux recrutés (multi)
  const [filterMatchMyGender, setFilterMatchMyGender] = useState(true);    // recruteurs qui acceptent mon genre
  const [filterMatchMyAge, setFilterMatchMyAge] = useState(true);          // recruteurs dont la tranche inclut mon âge
  const [message, setMessage] = useState('');
  const [recruiters, setRecruiters] = useState([]);
  const [alreadyApplied, setAlreadyApplied] = useState(new Set());
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  // Vidéos jointes à la candidature
  const [myVideos, setMyVideos] = useState([]);
  const [attachedVideoIds, setAttachedVideoIds] = useState(new Set());
  const [videoPickerOpen, setVideoPickerOpen] = useState(false);

  // Charger MES vidéos (athlète)
  useEffect(() => {
    if (!currentUser?.id) return;
    let cancel = false;
    (async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('id, title, youtube_url, video_url, thumbnail_url, sport, video_type, created_at')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
      if (cancel) return;
      if (error) console.error('Erreur chargement mes vidéos:', error);
      setMyVideos(data || []);
    })();
    return () => { cancel = true; };
  }, [currentUser?.id]);

  const toggleVideo = (id) => setAttachedVideoIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const removeVideo = (id) => setAttachedVideoIds(prev => {
    const next = new Set(prev); next.delete(id); return next;
  });

  // Charger les recruteurs filtrés par sport de l'athlète + ceux déjà contactés
  useEffect(() => {
    if (!currentUser?.id) return;
    let cancel = false;
    setLoading(true);
    (async () => {
      const sport = currentUser.sport;
      let q = supabase.from('profiles')
        .select('id, full_name, organization, sport, country, region, city, avatar_url, verified, is_recruiter, recruiting_gender, recruiting_levels, recruiting_age_min, recruiting_age_max')
        .eq('is_recruiter', true);
      if (sport) q = q.eq('sport', sport);
      const [recRes, applied] = await Promise.all([
        q.order('created_at', { ascending: false }),
        onLoadAlreadyApplied(currentUser.id),
      ]);
      if (cancel) return;
      if (recRes.error) console.error('Erreur recruteurs:', recRes.error);
      setRecruiters(recRes.data || []);
      setAlreadyApplied(applied);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [currentUser?.id]);

  // Filtre par localisation (match flou, insensitive) + nouveaux critères
  const norm = (s) => (s || '').toLowerCase().trim();
  const filtered = recruiters.filter(r => {
    if (country && !norm(r.country).includes(norm(country))) return false;
    if (region && !norm(r.region).includes(norm(region))) return false;
    if (city && !norm(r.city).includes(norm(city))) return false;
    // Niveaux recrutés : si filtre actif, le recruteur doit recruter au moins un des niveaux choisis
    if (filterRecruitingLevels.length > 0) {
      const rLevels = r.recruiting_levels || [];
      if (!filterRecruitingLevels.some(lv => rLevels.includes(lv))) return false;
    }
    // Match mon genre : recruteur 'all' ou égal à mon genre
    if (filterMatchMyGender && currentUser?.gender && r.recruiting_gender
        && r.recruiting_gender !== 'all' && r.recruiting_gender !== currentUser.gender) return false;
    // Match mon âge : ma valeur doit être dans la tranche du recruteur (si tranche renseignée)
    if (filterMatchMyAge && currentUser?.age != null
        && r.recruiting_age_min != null && r.recruiting_age_max != null) {
      if (currentUser.age < r.recruiting_age_min || currentUser.age > r.recruiting_age_max) return false;
    }
    return true;
  });

  const eligible = filtered.filter(r => !alreadyApplied.has(r.id));

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleAll = () => {
    if (selected.size === eligible.length) setSelected(new Set());
    else setSelected(new Set(eligible.map(r => r.id)));
  };

  const handleSend = async () => {
    if (selected.size === 0) { setError('Sélectionne au moins un recruteur'); return; }
    setError(''); setSubmitting(true);
    const res = await onSend(Array.from(selected), message, Array.from(attachedVideoIds));
    setSubmitting(false);
    if (res.error) { setError(res.error); return; }
    setResult(res);
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}>
      <div className="w-full rounded-t-2xl flex flex-col"
        style={{ backgroundColor: C.bg, height: '92dvh', border: `1px solid ${C.border}` }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: C.border }}>
          <div className="flex items-center gap-2">
            <span className="text-base">📨</span>
            <div className="text-base font-extrabold" style={{ color: C.text }}>Envoyer ma candidature</div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: C.surface }}>
            <X size={16} style={{ color: C.text }} />
          </button>
        </div>

        {result ? (
          <div className="flex-1 px-6 py-12 text-center flex flex-col items-center justify-center">
            <CheckCircle2 size={56} style={{ color: C.green }} className="mb-3" />
            <h3 className="text-xl font-extrabold mb-1" style={{ color: C.text }}>
              {result.sent} candidature{result.sent > 1 ? 's' : ''} envoyée{result.sent > 1 ? 's' : ''}
            </h3>
            {result.skipped > 0 && (
              <p className="text-xs mt-2" style={{ color: C.textDim }}>
                {result.skipped} recruteur{result.skipped > 1 ? 's' : ''} déjà contacté{result.skipped > 1 ? 's' : ''} précédemment.
              </p>
            )}
            <button onClick={onClose}
              className="mt-6 px-6 py-2.5 rounded-xl text-sm font-bold"
              style={{ backgroundColor: C.gold, color: C.bg }}>
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {/* Bandeau sport */}
              <div className="rounded-xl p-3 mb-3 flex items-start gap-2"
                style={{ backgroundColor: 'rgba(255,184,0,0.08)', border: `1px solid ${C.borderGold}` }}>
                <AlertTriangle size={14} style={{ color: C.gold }} className="mt-0.5 flex-shrink-0" />
                <p className="text-[11px] leading-relaxed" style={{ color: C.textDim }}>
                  Les candidatures sont automatiquement filtrées par <strong style={{ color: C.text }}>
                  ton sport</strong>{currentUser?.sport
                    ? ` (${SPORTS.find(s => s.id === currentUser.sport)?.label || currentUser.sport})`
                    : ' — défini ton sport dans ton profil pour mieux cibler'}.
                  Tu ne peux contacter qu'<strong style={{ color: C.text }}>une fois</strong> chaque recruteur.
                </p>
              </div>

              {/* Match auto avec mon profil */}
              <div className="text-[10px] font-semibold mb-2" style={{ color: C.gold }}>
                Matching automatique
              </div>
              <div className="flex flex-col gap-1.5 mb-4">
                <button onClick={() => setFilterMatchMyGender(v => !v)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
                  style={{
                    backgroundColor: filterMatchMyGender ? C.goldSoft : C.surface,
                    color: filterMatchMyGender ? C.gold : C.text,
                    border: `1px solid ${filterMatchMyGender ? C.gold : C.border}`,
                  }}>
                  <span>Recruteurs qui recrutent mon genre</span>
                  <span className="font-mono text-[10px]">{filterMatchMyGender ? '✓ ON' : '✗ OFF'}</span>
                </button>
                <button onClick={() => setFilterMatchMyAge(v => !v)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
                  style={{
                    backgroundColor: filterMatchMyAge ? C.goldSoft : C.surface,
                    color: filterMatchMyAge ? C.gold : C.text,
                    border: `1px solid ${filterMatchMyAge ? C.gold : C.border}`,
                  }}>
                  <span>Recruteurs dont la tranche d'âge m'inclut</span>
                  <span className="font-mono text-[10px]">{filterMatchMyAge ? '✓ ON' : '✗ OFF'}</span>
                </button>
              </div>

              {/* Filtre niveaux recrutés */}
              <div className="text-[10px] font-semibold mb-2" style={{ color: C.gold }}>
                Niveaux recrutés par le recruteur
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {[
                  { id: 'amateur',         label: '🌱 Amateur' },
                  { id: 'young_pro',       label: '🚀 Young Pro' },
                  { id: 'senior_amateur',  label: '⭐ Senior Am.' },
                  { id: 'senior_semi_pro', label: '⭐⭐ Semi-Pro' },
                  { id: 'senior_pro',      label: '⭐⭐⭐ Pro' },
                  { id: 'no_club',         label: '🆓 Sans club' },
                ].map(lv => {
                  const active = filterRecruitingLevels.includes(lv.id);
                  return (
                    <button key={lv.id}
                      onClick={() => setFilterRecruitingLevels(prev =>
                        active ? prev.filter(x => x !== lv.id) : [...prev, lv.id]
                      )}
                      className="px-2.5 py-1.5 rounded-full text-[11px] font-medium"
                      style={{
                        backgroundColor: active ? C.goldSoft : C.surface,
                        color: active ? C.gold : C.text,
                        border: `1px solid ${active ? C.gold : C.border}`,
                      }}>
                      {lv.label}
                    </button>
                  );
                })}
              </div>

              {/* Filtres localisation */}
              <div className="text-[10px] font-semibold mb-2" style={{ color: C.gold }}>
                Filtrer par localisation
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <input type="text" value={country} onChange={(e) => setCountry(e.target.value)}
                  placeholder="Pays" className="px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
                <input type="text" value={region} onChange={(e) => setRegion(e.target.value)}
                  placeholder="Région" className="px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                  placeholder="Ville" className="px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
              </div>

              {/* Liste des recruteurs */}
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-semibold" style={{ color: C.gold }}>
                  Recruteurs trouvés ({filtered.length})
                </div>
                {eligible.length > 0 && (
                  <button onClick={toggleAll} className="text-[11px] font-bold" style={{ color: C.gold }}>
                    {selected.size === eligible.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={20} className="animate-spin" style={{ color: C.gold }} />
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-xl py-10 px-6 text-center"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                  <Briefcase size={28} style={{ color: C.textMute }} className="mx-auto mb-2" />
                  <p className="text-xs" style={{ color: C.textDim }}>
                    Aucun recruteur ne correspond à ces critères
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 mb-4">
                  {filtered.map(r => {
                    const isApplied = alreadyApplied.has(r.id);
                    const isSel = selected.has(r.id);
                    const loc = [r.city, r.region, r.country].filter(Boolean).join(', ');
                    return (
                      <button key={r.id} onClick={() => !isApplied && toggle(r.id)}
                        disabled={isApplied}
                        className="flex items-center gap-3 p-2.5 rounded-xl text-left"
                        style={{
                          backgroundColor: isSel ? C.goldSoft : C.surface,
                          border: `1px solid ${isSel ? C.gold : C.border}`,
                          opacity: isApplied ? 0.5 : 1,
                        }}>
                        <Avatar profile={r} size={40} ringColor={C.gold} ringWidth={1.5} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate flex items-center gap-1" style={{ color: C.text }}>
                            {r.full_name || 'Recruteur'}
                            {r.verified && <BadgeCheck size={11} fill={C.gold} stroke={C.bg} strokeWidth={2.5} />}
                          </div>
                          <div className="text-[11px] truncate" style={{ color: C.gold }}>
                            {r.organization || 'Organisation —'}
                          </div>
                          {loc && (
                            <div className="text-[10px] truncate" style={{ color: C.textMute }}>📍 {loc}</div>
                          )}
                        </div>
                        {isApplied ? (
                          <span className="text-[10px] font-bold flex-shrink-0" style={{ color: C.textMute }}>Déjà contacté</span>
                        ) : (
                          <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: isSel ? C.gold : 'transparent',
                              border: `1.5px solid ${isSel ? C.gold : C.textMute}`,
                            }}>
                            {isSel && <CheckCircle2 size={12} fill={C.bg} stroke={C.bg} strokeWidth={3} />}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Message */}
              <div className="text-[10px] font-semibold mb-2" style={{ color: C.gold }}>
                Message de candidature
              </div>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                rows={4} maxLength={1500}
                placeholder="Présente-toi, parle de tes objectifs, tes disponibilités…"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
              <div className="text-[10px] mt-1 text-right" style={{ color: C.textMute }}>
                {message.length}/1500
              </div>

              {/* Vidéos jointes à la candidature */}
              <div className="text-[10px] font-semibold mt-4 mb-2" style={{ color: C.gold }}>
                Vidéos jointes ({attachedVideoIds.size})
              </div>

              {/* Affichage des vidéos déjà sélectionnées */}
              {attachedVideoIds.size > 0 && (
                <div className="flex flex-col gap-1.5 mb-2">
                  {Array.from(attachedVideoIds).map(id => {
                    const v = myVideos.find(x => x.id === id);
                    if (!v) return null;
                    const thumb = getVideoThumb(v);
                    return (
                      <div key={id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                        style={{ backgroundColor: C.surface, border: `1px solid ${C.borderGold}` }}>
                        <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0"
                          style={{ backgroundColor: '#000' }}>
                          {thumb ? <img loading="lazy" decoding="async" src={thumb} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Play size={12} style={{ color: C.gold }} /></div>}
                        </div>
                        <div className="flex-1 min-w-0 text-xs font-semibold truncate" style={{ color: C.text }}>
                          {v.title || 'Vidéo'}
                        </div>
                        <button onClick={() => removeVideo(id)}
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: C.surface2 }}>
                          <X size={11} style={{ color: C.textDim }} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bouton + Ajouter une vidéo */}
              <button onClick={() => setVideoPickerOpen(o => !o)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold"
                style={{
                  backgroundColor: videoPickerOpen ? C.goldSoft : C.surface,
                  color: C.gold,
                  border: `1px dashed ${C.borderGold}`,
                }}>
                <Plus size={14} strokeWidth={2.6} />
                {videoPickerOpen ? 'Fermer la sélection' : 'Ajouter une vidéo'}
              </button>

              {/* Sélecteur de vidéos (déroulé) */}
              {videoPickerOpen && (
                <div className="mt-2 rounded-xl p-2 fade-in"
                  style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
                  {myVideos.length === 0 ? (
                    <div className="py-6 text-center">
                      <Camera size={24} style={{ color: C.textMute }} className="mx-auto mb-1.5" />
                      <p className="text-[11px]" style={{ color: C.textDim }}>
                        Tu n'as encore publié aucune vidéo.<br />
                        Publie une vidéo depuis l'onglet ➕ pour pouvoir la joindre.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {myVideos.map(v => {
                        const checked = attachedVideoIds.has(v.id);
                        const thumb = getVideoThumb(v);
                        const vsport = SPORTS.find(s => s.id === v.sport);
                        return (
                          <button key={v.id} onClick={() => toggleVideo(v.id)}
                            className="flex items-center gap-2.5 p-2 rounded-lg text-left"
                            style={{
                              backgroundColor: checked ? C.goldSoft : 'transparent',
                              border: `1px solid ${checked ? C.gold : 'transparent'}`,
                            }}>
                            <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0"
                              style={{ backgroundColor: '#000' }}>
                              {thumb ? <img loading="lazy" decoding="async" src={thumb} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center"><Play size={14} style={{ color: C.gold }} /></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold truncate" style={{ color: C.text }}>
                                {v.title || 'Vidéo'}
                              </div>
                              {vsport && (
                                <div className="text-[10px] truncate" style={{ color: C.textDim }}>
                                  {vsport.icon} {vsport.label}
                                </div>
                              )}
                            </div>
                            <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: checked ? C.gold : 'transparent',
                                border: `1.5px solid ${checked ? C.gold : C.textMute}`,
                              }}>
                              {checked && <CheckCircle2 size={12} fill={C.bg} stroke={C.bg} strokeWidth={3} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="mt-3 px-3 py-2 rounded-lg text-xs"
                  style={{ backgroundColor: 'rgba(255,71,87,0.12)', color: C.red, border: `1px solid ${C.red}` }}>
                  {error}
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t" style={{ borderColor: C.border }}>
              <button onClick={handleSend} disabled={submitting || selected.size === 0}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                style={{
                  backgroundColor: submitting || selected.size === 0 ? 'rgba(255,184,0,0.4)' : C.gold,
                  color: C.bg,
                }}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />}
                {submitting
                  ? 'Envoi…'
                  : `Envoyer à ${selected.size} recruteur${selected.size > 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MessagesView({ conversations, currentUserId, onOpenChat, onNewConversation, onSelectProfile,
                        isRecruiter, isAthlete, onOpenCandidature }) {
  return (
    <div className="pt-12 pb-32 px-4 overflow-y-auto" style={{ height: '100dvh', backgroundColor: C.bg }}>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-extrabold" style={{ color: C.text }}>Messages</h1>
        <button onClick={onNewConversation}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: C.gold, color: C.bg }} aria-label="Nouvelle conversation">
          <Plus size={18} strokeWidth={2.6} />
        </button>
      </div>
      <p className="text-sm mb-4" style={{ color: C.textDim }}>
        {conversations.length === 0 ? 'Aucune conversation' : `${conversations.length} conversation${conversations.length > 1 ? 's' : ''}`}
      </p>

      {/* Bouton candidature : athlètes uniquement (pas les recruteurs ni les observateurs) */}
      {isAthlete && (
        <button onClick={onOpenCandidature}
          className="w-full mb-4 rounded-xl px-4 py-3 flex items-center gap-3 fade-in"
          style={{
            background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldDeep} 100%)`,
            color: C.bg,
          }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-base"
            style={{ backgroundColor: 'rgba(8,15,32,0.18)' }}>
            📨
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-sm font-extrabold">Envoyer ma candidature</div>
            <div className="text-[11px] opacity-80">
              Postule auprès des recruteurs de ton sport
            </div>
          </div>
          <ChevronDown size={16} strokeWidth={2.6} style={{ transform: 'rotate(-90deg)' }} />
        </button>
      )}

      {conversations.length === 0 ? (
        <div className="rounded-2xl py-16 px-6 text-center"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <Inbox size={36} style={{ color: C.textMute }} className="mx-auto mb-3" />
          <h3 className="text-base font-bold mb-1" style={{ color: C.text }}>Boîte vide</h3>
          <p className="text-xs mb-4" style={{ color: C.textDim }}>
            Démarre une nouvelle conversation pour commencer.
          </p>
          <button onClick={onNewConversation}
            className="px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
            style={{ backgroundColor: C.gold, color: C.bg }}>
            <Plus size={14} strokeWidth={2.6} />
            Nouvelle conversation
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {conversations.map(c => {
            const lastFromMe = c.lastMessage.sender_id === currentUserId;
            const preview = (lastFromMe ? 'Vous : ' : '') + (c.lastMessage.content || '');
            return (
              <div key={c.otherId}
                className="flex items-center gap-3 p-3 rounded-xl fade-in"
                style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                <button onClick={(e) => { e.stopPropagation(); onSelectProfile?.(c.otherProfile); }}
                  className="flex-shrink-0">
                  <Avatar profile={c.otherProfile} size={48} ringColor={C.gold} />
                </button>

                <button onClick={() => onOpenChat(c)} className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm truncate flex items-center gap-1.5" style={{ color: C.text }}>
                      {c.otherProfile.full_name || 'Utilisateur'}
                      {c.otherProfile.is_recruiter && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold"
                          style={{ backgroundColor: C.goldSoft, color: C.gold }}>Recruteur</span>
                      )}
                    </span>
                    <span className="text-[10px] flex-shrink-0" style={{ color: C.textDim }}>
                      {timeAgo(c.lastMessage.created_at)}
                    </span>
                  </div>
                  <div className="text-xs truncate mt-0.5" style={{ color: c.unreadCount > 0 ? C.text : C.textDim }}>
                    {preview}
                  </div>
                </button>

                {c.unreadCount > 0 && (
                  <button onClick={() => onOpenChat(c)}
                    className="min-w-[20px] h-5 rounded-full flex items-center justify-center text-[10px] font-bold px-1.5 flex-shrink-0"
                    style={{ backgroundColor: C.gold, color: C.bg }}>
                    {c.unreadCount}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ChatView({ otherProfile: otherProfileProp, currentUserId, onBack, onSendMessage, onMarkRead, onSelectProfile,
                    onLoadPendingSigning, onRespondToSigning, onDeleteMessage }) {
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [pendingSign, setPendingSign] = useState(null);
  const [signResponseOpen, setSignResponseOpen] = useState(null); // 'confirm' | 'refuse' | null
  const [signReply, setSignReply] = useState('');
  const [signSubmitting, setSignSubmitting] = useState(false);
  const [selectedMsgId, setSelectedMsgId] = useState(null); // message sélectionné pour menu actions
  const [deletingMsgId, setDeletingMsgId] = useState(null);
  // Copie locale du profil de l'interlocuteur, patchée en Realtime si modifié.
  // On expose `otherProfile` (live) sous le même nom pour ne pas avoir à
  // réécrire le reste du composant.
  const [liveOther, setLiveOther] = useState(otherProfileProp);
  useEffect(() => { setLiveOther(otherProfileProp); }, [otherProfileProp?.id]);
  useEffect(() => {
    if (!otherProfileProp?.id) return;
    const channel = supabase
      .channel(`chat-other-profile-${otherProfileProp.id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles',
          filter: `id=eq.${otherProfileProp.id}` },
        (payload) => {
          if (payload.new) setLiveOther(prev => ({ ...prev, ...payload.new }));
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [otherProfileProp?.id]);
  const otherProfile = liveOther || otherProfileProp;
  const scrollRef = useRef(null);

  const handleDeleteMessage = async (msgId) => {
    setDeletingMsgId(msgId);
    const { error } = await onDeleteMessage(msgId);
    setDeletingMsgId(null);
    if (!error) {
      setMessages(prev => prev.filter(m => m.id !== msgId));
      setSelectedMsgId(null);
    }
  };

  // Charger la demande de signature pending (si l'autre est recruteur qui m'a déclaré signé)
  useEffect(() => {
    if (!otherProfile?.id || !currentUserId || !onLoadPendingSigning) return;
    let cancel = false;
    (async () => {
      const c = await onLoadPendingSigning(otherProfile.id);
      if (!cancel) setPendingSign(c);
    })();
    return () => { cancel = true; };
  }, [otherProfile?.id, currentUserId]);

  // Realtime sur signing_confirmations pour rafraîchir l'encart
  useEffect(() => {
    if (!otherProfile?.id || !currentUserId) return;
    const channel = supabase
      .channel(`signing-${currentUserId}-${otherProfile.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'signing_confirmations' },
        async () => {
          if (onLoadPendingSigning) {
            const c = await onLoadPendingSigning(otherProfile.id);
            setPendingSign(c);
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [otherProfile?.id, currentUserId]);

  // L'athlète peut répondre uniquement si la demande lui est destinée (= pending et il est l'athlete_id)
  const canRespond = pendingSign && pendingSign.status === 'pending'
                     && pendingSign.athlete_id === currentUserId;

  const handleRespond = async (accepted) => {
    if (!pendingSign) return;
    setSignSubmitting(true);
    const { error } = await onRespondToSigning(pendingSign.id, accepted, signReply);
    setSignSubmitting(false);
    if (!error) {
      setPendingSign(null);
      setSignResponseOpen(null);
      setSignReply('');
    }
  };

  // Charger l'historique
  useEffect(() => {
    if (!otherProfile?.id || !currentUserId) return;
    let cancel = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('id, sender_id, receiver_id, content, read, created_at, video_id')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherProfile.id}),and(sender_id.eq.${otherProfile.id},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });
      if (cancel) return;
      if (error) console.error('Erreur chargement messages:', error);
      setMessages(data || []);
      setLoading(false);
      // Marquer comme lu
      onMarkRead?.(otherProfile.id);
    })();
    return () => { cancel = true; };
  }, [otherProfile?.id, currentUserId]);

  // Realtime : nouveaux messages dans cette conversation
  useEffect(() => {
    if (!otherProfile?.id || !currentUserId) return;
    const channel = supabase
      .channel(`chat-${currentUserId}-${otherProfile.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const m = payload.new;
          const isThisChat =
            (m.sender_id === currentUserId && m.receiver_id === otherProfile.id) ||
            (m.sender_id === otherProfile.id && m.receiver_id === currentUserId);
          if (!isThisChat) return;
          setMessages(prev => prev.find(x => x.id === m.id) ? prev : [...prev, m]);
          if (m.receiver_id === currentUserId) onMarkRead?.(otherProfile.id);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [otherProfile?.id, currentUserId]);

  // Scroll en bas à chaque nouveau message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  if (!otherProfile) return null;

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft('');
    const sent = await onSendMessage(otherProfile.id, text);
    setSending(false);
    if (sent) {
      setMessages(prev => prev.find(x => x.id === sent.id) ? prev : [...prev, sent]);
    } else {
      setDraft(text); // restore on failure
    }
  };

  const subtitle = otherProfile.is_recruiter
    ? (otherProfile.organization || 'Recruteur')
    : (() => {
        const sp = SPORTS.find(s => s.id === otherProfile.sport);
        return sp ? `${sp.icon} ${sp.label}` : 'Athlète';
      })();

  return (
    <div className="flex flex-col fade-in" style={{ height: '100dvh', backgroundColor: C.bg }}>
      <div className="px-4 pt-3 pb-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
        <button onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}>
          <ArrowLeft size={17} strokeWidth={2.2} />
        </button>
        <button onClick={() => onSelectProfile?.(otherProfile)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <Avatar profile={otherProfile} size={40} ringColor={C.gold} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate flex items-center gap-1.5" style={{ color: C.text }}>
              {otherProfile.full_name || 'Utilisateur'}
              {otherProfile.is_recruiter && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold"
                  style={{ backgroundColor: C.goldSoft, color: C.gold }}>Recruteur</span>
              )}
            </div>
            <div className="text-[11px]" style={{ color: C.textDim }}>{subtitle}</div>
          </div>
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin" style={{ color: C.gold }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center mt-12">
            <MessageCircle size={32} style={{ color: C.textMute }} className="mx-auto mb-2" />
            <p className="text-xs" style={{ color: C.textDim }}>Démarrez la conversation.</p>
          </div>
        ) : messages.map((m) => {
          const me = m.sender_id === currentUserId;
          const time = new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          const selected = selectedMsgId === m.id;
          const deleting = deletingMsgId === m.id;
          return (
            <div key={m.id} className={`flex ${me ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[80%] flex flex-col" style={{ alignItems: me ? 'flex-end' : 'flex-start' }}>
                <button onClick={() => me && setSelectedMsgId(prev => prev === m.id ? null : m.id)}
                  disabled={!me}
                  className="px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words text-left"
                  style={{
                    backgroundColor: me ? C.gold : C.surface,
                    color: me ? C.bg : C.text,
                    borderBottomRightRadius: me ? 4 : undefined,
                    borderBottomLeftRadius: !me ? 4 : undefined,
                    border: me ? 'none' : `1px solid ${C.border}`,
                    opacity: deleting ? 0.5 : 1,
                    cursor: me ? 'pointer' : 'default',
                  }}>
                  {m.content}
                </button>
                <span className="text-[10px] mt-0.5 px-1"
                  style={{ color: C.textMute }}>
                  {time}
                </span>

                {/* Menu actions sur message (mes messages uniquement) */}
                {me && selected && (
                  <div className="mt-1.5 fade-in rounded-xl overflow-hidden flex"
                    style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                    <button onClick={() => handleDeleteMessage(m.id)} disabled={deleting}
                      className="px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1.5"
                      style={{ color: C.red }}>
                      {deleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                      {deleting ? 'Suppression…' : 'Supprimer'}
                    </button>
                    <button onClick={() => setSelectedMsgId(null)}
                      className="px-3 py-1.5 text-[11px] font-semibold"
                      style={{ color: C.textDim, borderLeft: `1px solid ${C.border}` }}>
                      Annuler
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Encart confirmation de signature */}
      {canRespond && (
        <div className="px-3 pt-3 fade-in">
          <div className="rounded-xl p-3"
            style={{ backgroundColor: 'rgba(255,184,0,0.1)', border: `1px solid ${C.borderGold}` }}>
            <div className="flex items-start gap-2">
              <span className="text-base">🏆</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-extrabold mb-1" style={{ color: C.text }}>
                  Demande de confirmation de signature
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: C.textDim }}>
                  Ce recruteur déclare t'avoir signé. <strong style={{ color: C.text }}>Confirme</strong> ou{' '}
                  <strong style={{ color: C.text }}>refuse</strong> pour éviter les fausses déclarations.
                </p>
                {pendingSign?.recruiter_message && (
                  <div className="mt-2 px-2 py-1.5 rounded text-[11px] italic"
                    style={{ backgroundColor: C.surface, color: C.text }}>
                    « {pendingSign.recruiter_message} »
                  </div>
                )}
              </div>
            </div>

            {signResponseOpen ? (
              <div className="mt-3 fade-in">
                <textarea value={signReply} onChange={(e) => setSignReply(e.target.value)}
                  rows={2} maxLength={500}
                  placeholder={signResponseOpen === 'confirm'
                    ? 'Ajoute un message (facultatif)…'
                    : 'Précise la raison du refus (facultatif)…'}
                  className="w-full px-2.5 py-2 rounded-lg text-[12px] outline-none resize-none"
                  style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
                <div className="flex gap-2 mt-2">
                  <button onClick={() => { setSignResponseOpen(null); setSignReply(''); }}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold"
                    style={{ color: C.textDim, border: `1px solid ${C.border}` }}>
                    Annuler
                  </button>
                  <button onClick={() => handleRespond(signResponseOpen === 'confirm')}
                    disabled={signSubmitting}
                    className="flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                    style={{
                      backgroundColor: signResponseOpen === 'confirm' ? C.green : C.red,
                      color: C.text,
                    }}>
                    {signSubmitting ? <Loader2 size={12} className="animate-spin" />
                      : signResponseOpen === 'confirm' ? <><CheckCircle2 size={12} /> Confirmer</>
                      : <><X size={12} /> Refuser</>}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 mt-3">
                <button onClick={() => setSignResponseOpen('refuse')}
                  className="flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                  style={{ backgroundColor: 'transparent', color: C.red, border: `1px solid ${C.red}` }}>
                  <X size={12} /> Refuser
                </button>
                <button onClick={() => setSignResponseOpen('confirm')}
                  className="flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                  style={{ backgroundColor: C.green, color: C.text }}>
                  <CheckCircle2 size={12} /> Confirmer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="px-3 py-3 flex gap-2 items-center" style={{ borderTop: `1px solid ${C.border}` }}>
        <input type="text" value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder="Écrire un message…" disabled={sending}
          className="flex-1 px-3.5 py-2.5 rounded-xl text-sm outline-none"
          style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
        <MicButton size={44} title="Dictée vocale"
          onTranscript={(text) => setDraft(prev => prev ? `${prev} ${text}` : text)} />
        <button onClick={send} disabled={!draft.trim() || sending}
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: draft.trim() && !sending ? C.gold : 'rgba(255,184,0,0.25)',
            color: draft.trim() && !sending ? C.bg : 'rgba(8,15,32,0.4)',
          }}>
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} strokeWidth={2.4} />}
        </button>
      </div>
    </div>
  );
}

// ═══ SHORTLIST + NOTES INLINE (recruteur) ══════════════════════════
function ShortlistRow({ athlete, notes, onSelectAthlete, onOpenChat, onRemove, onAddNote, onUpdateNote, onDeleteNote }) {
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingDraft, setEditingDraft] = useState('');

  const startEdit = (n) => { setEditingId(n.id); setEditingDraft(n.body); };
  const saveEdit = () => {
    if (editingDraft.trim() && editingId) onUpdateNote?.(athlete.id, editingId, editingDraft.trim());
    setEditingId(null); setEditingDraft('');
  };
  const handleAdd = () => {
    if (draft.trim()) { onAddNote?.(athlete.id, draft.trim()); setDraft(''); }
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-3 p-3">
        <button onClick={() => onSelectAthlete?.(athlete)} className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold"
            style={{ backgroundColor: C.surface2, color: C.gold, border: `2px solid ${C.gold}` }}>
            {athlete.name.charAt(0)}
          </div>
          {athlete.verified && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: C.gold, border: `2px solid ${C.surface}` }}>
              <BadgeCheck size={9} style={{ color: C.bg }} fill={C.bg} strokeWidth={0} />
            </div>
          )}
        </button>

        <button onClick={() => onSelectAthlete?.(athlete)} className="flex-1 min-w-0 text-left">
          <div className="font-semibold text-sm truncate" style={{ color: C.text }}>{athlete.name}</div>
          <div className="text-xs" style={{ color: C.textDim }}>
            {athlete.icon} {athlete.sport} · {athlete.club}
          </div>
        </button>

        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold"
            style={{ backgroundColor: C.gold, color: C.bg }}>
            {athlete.rating}
          </span>
          <button onClick={() => onOpenChat?.(athlete)}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: C.goldSoft, border: `1px solid ${C.borderGold}`, color: C.gold }}>
            <MessageCircle size={14} strokeWidth={2.4} />
          </button>
          <button onClick={onRemove} className="text-[10px]" style={{ color: C.textMute }}>
            Retirer
          </button>
        </div>
      </div>

      {/* Inline notes editor */}
      <div className="px-3 pb-3">
        <div className="rounded-lg p-2.5" style={{ backgroundColor: C.bg, border: `1px solid ${C.borderGold}` }}>
          <div className="flex items-center gap-1.5 mb-2">
            <NotebookPen size={11} style={{ color: C.gold }} />
            <span className="text-[9px] font-semibold" style={{ color: C.gold }}>
              Notes privées ({notes.length})
            </span>
          </div>

          {notes.length > 0 && (
            <div className="flex flex-col gap-1.5 mb-2">
              {notes.map(n => (
                <div key={n.id} className="rounded-md p-2"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                  {editingId === n.id ? (
                    <>
                      <textarea value={editingDraft} onChange={(e) => setEditingDraft(e.target.value)}
                        autoFocus rows={3} maxLength={500}
                        className="w-full px-2 py-1.5 rounded text-[11px] outline-none resize-none"
                        style={{ backgroundColor: C.bg, color: C.text, border: `1px solid ${C.gold}` }} />
                      <div className="flex gap-1.5 mt-1.5">
                        <button onClick={saveEdit} disabled={!editingDraft.trim()}
                          className="flex-1 py-1 rounded text-[10px] font-bold flex items-center justify-center gap-1"
                          style={{
                            backgroundColor: editingDraft.trim() ? C.gold : 'rgba(255,184,0,0.25)',
                            color: editingDraft.trim() ? C.bg : 'rgba(8,15,32,0.4)',
                          }}>
                          <Save size={10} /> Enregistrer
                        </button>
                        <button onClick={() => { setEditingId(null); setEditingDraft(''); }}
                          className="px-2 py-1 rounded text-[10px]"
                          style={{ color: C.textDim, border: `1px solid ${C.border}` }}>
                          Annuler
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px]" style={{ color: C.textMute }}>
                          {new Date(n.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          {n.updatedAt && <span style={{ color: C.gold }}> · modifié</span>}
                        </span>
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(n)}
                            className="text-[9px] flex items-center gap-0.5" style={{ color: C.gold }}>
                            <Edit3 size={9} /> Modifier
                          </button>
                          <button onClick={() => onDeleteNote?.(athlete.id, n.id)}
                            className="text-[9px]" style={{ color: C.textMute }}>
                            Supprimer
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ color: C.text }}>
                        {n.body}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-1.5">
            <input type="text" value={draft} onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              placeholder="Ajouter une note…" maxLength={500}
              className="flex-1 px-2 py-1.5 rounded text-[11px] outline-none"
              style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
            <button onClick={handleAdd} disabled={!draft.trim()}
              className="px-3 rounded text-[10px] font-bold"
              style={{
                backgroundColor: draft.trim() ? C.gold : 'rgba(255,184,0,0.25)',
                color: draft.trim() ? C.bg : 'rgba(8,15,32,0.4)',
              }}>
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SHORTLIST SUPABASE (recruteur) ─────────────────────────────
const SHORTLIST_TABS = [
  { id: 'en_attente', label: 'En attente', icon: '⏳', color: 'rgba(255,255,255,0.6)' },
  { id: 'essai_en_cours', label: 'Essai en cours', icon: '🏃', color: '#FFB800' },
  { id: 'essai_termine', label: 'Essai terminé', icon: '✅', color: '#3B82F6' },
  { id: 'signe', label: 'Signés', icon: '🏆', color: '#22C55E' },
];

// ─── SIGN REQUEST MODAL (recruteur déclare une signature) ────────
function SignRequestModal({ athlete, onClose, onConfirm }) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError(''); setSubmitting(true);
    const { error: err } = await onConfirm(athlete.id, message);
    setSubmitting(false);
    if (err) setError(err); else onClose();
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}>
      <div className="w-full rounded-t-2xl flex flex-col"
        style={{ backgroundColor: C.bg, maxHeight: '80dvh', border: `1px solid ${C.border}` }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: C.border }}>
          <div className="flex items-center gap-2">
            <span className="text-base">🏆</span>
            <div className="text-base font-extrabold" style={{ color: C.text }}>Déclarer la signature</div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: C.surface }}>
            <X size={16} style={{ color: C.text }} />
          </button>
        </div>

        <div className="px-4 py-4 flex-1 overflow-y-auto">
          <div className="rounded-xl p-3 mb-4 flex items-start gap-2"
            style={{ backgroundColor: 'rgba(255,184,0,0.08)', border: `1px solid ${C.borderGold}` }}>
            <AlertTriangle size={14} style={{ color: C.gold }} className="mt-0.5 flex-shrink-0" />
            <p className="text-[11px] leading-relaxed" style={{ color: C.textDim }}>
              <strong style={{ color: C.text }}>{athlete?.full_name || 'Ce joueur'}</strong> recevra une demande de
              confirmation. Le statut <strong style={{ color: C.gold }}>« Signé »</strong> ne sera officiel
              qu'après sa validation.
            </p>
          </div>

          <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>
            Message (conditions, club, durée…) — facultatif
          </label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)}
            rows={4} maxLength={1000}
            placeholder="Ex : Contrat 2 ans avec ton club, à compter de juillet 2026…"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
          <div className="text-[10px] mt-1 text-right" style={{ color: C.textMute }}>
            {message.length}/1000
          </div>

          {error && (
            <div className="mt-3 px-3 py-2 rounded-lg text-xs"
              style={{ backgroundColor: 'rgba(255,71,87,0.12)', color: C.red, border: `1px solid ${C.red}` }}>
              {error}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t" style={{ borderColor: C.border }}>
          <button onClick={handleSubmit} disabled={submitting}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            style={{
              backgroundColor: submitting ? 'rgba(34,197,94,0.4)' : C.green,
              color: C.text,
            }}>
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />}
            {submitting ? 'Envoi…' : 'Envoyer la demande'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ShortlistView({ dbShortlist, onUpdateStatus, onRemove, onSelectProfile, onRequestSign, onOpenNotes }) {
  const [activeTab, setActiveTab] = useState('en_attente');
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(false);

  const athleteIds = useMemo(() => Array.from(dbShortlist.keys()), [dbShortlist]);

  // Charger les profils des athlètes shortlistés
  useEffect(() => {
    if (athleteIds.length === 0) { setProfiles({}); return; }
    let cancel = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, sport, position, club, age, avatar_url, verified')
        .in('id', athleteIds);
      if (cancel) return;
      if (error) console.error('Erreur chargement profils shortlist:', error);
      const map = {};
      for (const p of data || []) map[p.id] = p;
      setProfiles(map);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [athleteIds.join(',')]);

  // Compteurs par statut (l'onglet "signe" englobe signe + signe_pending)
  const counts = useMemo(() => {
    const c = { en_attente: 0, essai_en_cours: 0, essai_termine: 0, signe: 0 };
    for (const { status } of dbShortlist.values()) {
      if (status === 'signe_pending') c.signe++;
      else if (c[status] !== undefined) c[status]++;
    }
    return c;
  }, [dbShortlist]);

  // Athlètes filtrés par onglet actif
  // L'onglet "signe" affiche signe + signe_pending
  const filteredAthletes = useMemo(() => {
    return athleteIds
      .filter(id => {
        const s = dbShortlist.get(id)?.status;
        if (activeTab === 'signe') return s === 'signe' || s === 'signe_pending';
        return s === activeTab;
      })
      .map(id => profiles[id])
      .filter(Boolean);
  }, [activeTab, athleteIds, profiles, dbShortlist]);

  if (athleteIds.length === 0) {
    return (
      <div className="pt-12 pb-32 px-4" style={{ height: '100dvh', backgroundColor: C.bg }}>
        <h1 className="text-3xl font-extrabold mb-1" style={{ color: C.text }}>Short-list</h1>
        <p className="text-sm mb-6" style={{ color: C.textDim }}>Vos athlètes favoris</p>
        <div className="rounded-2xl py-16 px-6 text-center"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <Star size={36} style={{ color: C.textMute }} className="mx-auto mb-3" />
          <h3 className="text-base font-bold mb-1" style={{ color: C.text }}>Short-list vide</h3>
          <p className="text-xs" style={{ color: C.textDim }}>
            Tape sur ⭐ depuis le feed pour ajouter un athlète.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-12 pb-32 overflow-y-auto" style={{ height: '100dvh', backgroundColor: C.bg }}>
      <div className="px-4 mb-4">
        <div className="flex items-baseline justify-between mb-1">
          <h1 className="text-3xl font-extrabold" style={{ color: C.text }}>Short-list</h1>
          <span className="font-mono text-[12px]" style={{ color: C.gold }}>{athleteIds.length} athlète{athleteIds.length > 1 ? 's' : ''}</span>
        </div>
        <p className="text-sm" style={{ color: C.textDim }}>Suivi de vos prospects</p>
      </div>

      {/* Onglets de statut */}
      <div className="px-4 mb-4 overflow-x-auto scrollbar-none">
        <div className="flex gap-2 min-w-max">
          {SHORTLIST_TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap"
                style={{
                  backgroundColor: active ? tab.color : C.surface,
                  color: active ? C.bg : C.text,
                  border: `1px solid ${active ? tab.color : C.border}`,
                }}>
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {/* Trois points qui sautent pour "Essai en cours" (visuel d'activité) */}
                {tab.id === 'essai_en_cours' && counts[tab.id] > 0 && (
                  <span className="dot-jump" aria-hidden="true">
                    <span /><span /><span />
                  </span>
                )}
                <span className="font-mono text-[11px] px-1.5 rounded"
                  style={{
                    backgroundColor: active ? 'rgba(8,15,32,0.2)' : C.bg,
                    color: active ? C.bg : tab.color,
                  }}>
                  {counts[tab.id]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Liste des athlètes */}
      <div className="px-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin" style={{ color: C.gold }} />
          </div>
        ) : filteredAthletes.length === 0 ? (
          <div className="rounded-2xl py-12 px-6 text-center"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            <p className="text-sm" style={{ color: C.textDim }}>
              Aucun athlète dans cette catégorie
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredAthletes.map(athlete => {
              const actualStatus = dbShortlist.get(athlete.id)?.status;
              return (
                <ShortlistDbRow key={athlete.id} athlete={athlete}
                  currentStatus={activeTab}
                  actualStatus={actualStatus}
                  onUpdateStatus={onUpdateStatus}
                  onRemove={onRemove}
                  onSelectProfile={onSelectProfile}
                  onRequestSign={onRequestSign}
                  onOpenNotes={onOpenNotes} />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══ ÉDITEUR DE NOTES (Word/Pages-like, basé sur TipTap) ══════════
const FONT_FAMILIES = [
  { label: 'Outfit (défaut)', value: '' },
  { label: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
  { label: 'Georgia (serif)', value: 'Georgia, serif' },
  { label: 'Times', value: '"Times New Roman", Times, serif' },
  { label: 'Courier (mono)', value: '"Courier New", Courier, monospace' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
];
const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 30, 36];
const TEXT_COLORS = ['#FFFFFF', '#FFB800', '#FF4757', '#22C55E', '#3B82F6', '#A78BFA', '#000000'];
const HIGHLIGHT_COLORS = ['#FFB800', '#FF4757', '#22C55E', '#3B82F6', '#A78BFA'];

function RichTextEditor({ initialContent, onChange, placeholder }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Placeholder.configure({ placeholder: placeholder || 'Tape ici…' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      FontSize,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      FontFamily,
      Table.configure({ resizable: true }),
      TableRow, TableCell, TableHeader,
      Image.configure({ inline: false, allowBase64: true }),
      CharacterCount,
    ],
    content: initialContent || '',
    editorProps: {
      attributes: { class: 'tiptap-editor' },
    },
    onUpdate: ({ editor }) => { onChange?.(editor.getHTML()); },
  });

  // États locaux : menu fichier, barre de recherche, fichier image, prompt de lien
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [linkPromptOpen, setLinkPromptOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const imageInputRef = useRef(null);

  if (!editor) return null;

  // Compteurs (Character Count)
  const wordsCount = editor.storage.characterCount?.words?.() || 0;
  const charsCount = editor.storage.characterCount?.characters?.() || 0;

  // Bouton toolbar simple
  const ToolBtn = ({ active, onClick, title, children, disabled, wide }) => (
    <button type="button" onClick={onClick} disabled={disabled} title={title}
      className={`${wide ? 'px-2' : 'w-8'} h-8 rounded-md flex items-center justify-center text-sm font-bold transition-colors`}
      style={{
        backgroundColor: active ? C.goldSoft : 'transparent',
        color: active ? C.gold : (disabled ? C.textMute : C.text),
        border: `1px solid ${active ? C.gold : 'transparent'}`,
      }}>
      {children}
    </button>
  );

  const Sep = () => <div className="w-px h-6 mx-1" style={{ backgroundColor: C.border }} />;

  // Ouvre la mini-modal de saisie de lien (avec valeur courante)
  const handleLink = () => {
    const prev = editor.getAttributes('link').href || '';
    setLinkUrl(prev);
    setLinkPromptOpen(true);
  };

  const applyLink = () => {
    const url = linkUrl.trim();
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      // Préfixer https:// si pas de protocole
      const finalUrl = /^https?:\/\//i.test(url) ? url : 'https://' + url;
      editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run();
    }
    setLinkPromptOpen(false);
    setLinkUrl('');
  };

  // Insertion image : upload local converti en base64
  const handlePickImage = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      editor.chain().focus().setImage({ src: reader.result, alt: file.name }).run();
    };
    reader.readAsDataURL(file);
  };

  // Insertion d'une boîte de texte (encadré) — utilise blockquote avec marqueur
  const insertCallout = () => {
    editor.chain().focus().setNode('paragraph')
      .insertContent('<div data-callout="true" style="border: 2px solid #FFB800; background: #FFF8E6; padding: 12px 16px; border-radius: 8px; margin: 0.6em 0;"><strong>📌 Encadré</strong><br>Tape ici…</div>')
      .run();
  };

  // Saut de page (hr stylé + class spéciale)
  const insertPageBreak = () => {
    editor.chain().focus()
      .insertContent('<hr data-page-break="true" />')
      .run();
  };

  // Export HTML : télécharge un .html
  const exportHtml = () => {
    const html = editor.getHTML();
    const fullDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Notes Yatsai</title>
<style>body{font-family:system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;line-height:1.6;}
h1{font-size:1.8em;}h2{font-size:1.4em;}h3{font-size:1.15em;}
blockquote{border-left:3px solid #FFB800;padding-left:1em;color:#555;font-style:italic;}
mark{background:#FFEB3B;}
table{border-collapse:collapse;width:100%;}
th,td{border:1px solid #D0D0D0;padding:6px 10px;}
th{background:#F5F5F5;font-weight:700;}
hr[data-page-break]{page-break-after:always;border:0;}
img{max-width:100%;height:auto;}
</style></head><body>${html}</body></html>`;
    const blob = new Blob([fullDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'notes-yatsai.html';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    setFileMenuOpen(false);
  };

  // Export texte brut
  const exportText = () => {
    const text = editor.getText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'notes-yatsai.txt';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    setFileMenuOpen(false);
  };

  // Imprimer / sauvegarder en PDF (via navigateur)
  const handlePrint = () => {
    const html = editor.getHTML();
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Notes Yatsai</title>
<style>body{font-family:system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;line-height:1.6;}
h1{font-size:1.8em;}h2{font-size:1.4em;}h3{font-size:1.15em;}
blockquote{border-left:3px solid #FFB800;padding-left:1em;color:#555;font-style:italic;}
mark{background:#FFEB3B;}
table{border-collapse:collapse;width:100%;}
th,td{border:1px solid #D0D0D0;padding:6px 10px;}
th{background:#F5F5F5;font-weight:700;}
hr[data-page-break]{page-break-after:always;border:0;}
img{max-width:100%;height:auto;}
@media print{body{margin:0;}}
</style></head><body>${html}<script>window.onload=()=>window.print();</script></body></html>`);
    w.document.close();
    setFileMenuOpen(false);
  };

  // Recherche dans le document : surligne et scrolle
  const performSearch = (term) => {
    if (!term || !term.trim()) {
      // Effacer le surlignage
      document.querySelectorAll('.tiptap-search-highlight').forEach(el => {
        const parent = el.parentNode;
        parent.replaceChild(document.createTextNode(el.textContent), el);
        parent.normalize();
      });
      return;
    }
    const container = document.querySelector('.tiptap-editor');
    if (!container) return;
    // Highlight via la sélection du navigateur (simplifié — fait un find puis scroll)
    const text = container.textContent.toLowerCase();
    const idx = text.indexOf(term.toLowerCase());
    if (idx === -1) {
      alert('Aucune occurrence trouvée pour : ' + term);
      return;
    }
    // Utilise window.find natif (pas idéal mais sans plugin)
    if (window.find) window.find(term, false, false, true, false, false, false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar (style ruban Pages/Word) */}
      <div className="sticky top-0 z-10 flex flex-col"
        style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}` }}>

        {/* Barre menu (Fichier, Affichage, Recherche…) */}
        <div className="flex items-center gap-1 px-3 py-1.5"
          style={{ borderBottom: `1px solid ${C.border}` }}>
          {/* Menu Fichier */}
          <div className="relative">
            <button onClick={() => setFileMenuOpen(o => !o)}
              className="px-2.5 py-1 rounded text-xs font-semibold"
              style={{
                backgroundColor: fileMenuOpen ? C.goldSoft : 'transparent',
                color: fileMenuOpen ? C.gold : C.text,
              }}>
              📄 Fichier ▾
            </button>
            {fileMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setFileMenuOpen(false)} />
                <div className="absolute left-0 top-9 z-20 rounded-lg overflow-hidden fade-in"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, minWidth: 220, boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }}>
                  <button onClick={exportHtml}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs"
                    style={{ color: C.text }}>
                    <ArrowDown size={12} />
                    Enregistrer en HTML
                  </button>
                  <button onClick={exportText}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs"
                    style={{ color: C.text }}>
                    <ArrowDown size={12} />
                    Enregistrer en texte brut
                  </button>
                  <div className="h-px mx-3" style={{ backgroundColor: C.border }} />
                  <button onClick={handlePrint}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs"
                    style={{ color: C.text }}>
                    🖨 Imprimer / Enregistrer en PDF
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Insérer image */}
          <button onClick={() => imageInputRef.current?.click()}
            className="px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1"
            style={{ color: C.text }}>
            🖼 Image
          </button>
          <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={handlePickImage} />

          {/* Saut de page */}
          <button onClick={insertPageBreak}
            className="px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1"
            style={{ color: C.text }} title="Insérer un saut de page">
            📑 Nouvelle page
          </button>

          {/* Boîte de texte (encadré) */}
          <button onClick={insertCallout}
            className="px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1"
            style={{ color: C.text }} title="Insérer une boîte de texte">
            🔲 Encadré
          </button>

          <div className="flex-1" />

          {/* Recherche */}
          <button onClick={() => setSearchOpen(o => !o)}
            className="px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1"
            style={{
              backgroundColor: searchOpen ? C.goldSoft : 'transparent',
              color: searchOpen ? C.gold : C.text,
            }}>
            🔍 Rechercher
          </button>
        </div>

        {/* Barre de recherche déroulable */}
        {searchOpen && (
          <div className="px-3 py-2 flex gap-2 fade-in"
            style={{ borderBottom: `1px solid ${C.border}` }}>
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') performSearch(searchTerm); }}
              placeholder="Mot-clé à rechercher dans le document…"
              autoFocus
              className="flex-1 px-3 py-1.5 rounded text-xs outline-none"
              style={{ backgroundColor: C.bg, color: C.text, border: `1px solid ${C.border}` }} />
            <button onClick={() => performSearch(searchTerm)}
              className="px-3 py-1.5 rounded text-xs font-bold"
              style={{ backgroundColor: C.gold, color: C.bg }}>
              Rechercher
            </button>
          </div>
        )}

        {/* Ligne 1 : police, taille, style */}
        <div className="flex flex-wrap items-center gap-1 px-3 py-2">
          {/* Police */}
          <select
            onChange={(e) => {
              if (e.target.value) editor.chain().focus().setFontFamily(e.target.value).run();
              else editor.chain().focus().unsetFontFamily().run();
            }}
            className="h-8 px-2 rounded-md text-xs outline-none"
            style={{ backgroundColor: C.bg, color: C.text, border: `1px solid ${C.border}`, minWidth: 110 }}>
            {FONT_FAMILIES.map(f => <option key={f.label} value={f.value}>{f.label}</option>)}
          </select>

          {/* Taille */}
          <select
            onChange={(e) => {
              if (e.target.value) editor.chain().focus().setFontSize(e.target.value + 'px').run();
              else editor.chain().focus().unsetFontSize().run();
            }}
            defaultValue=""
            className="h-8 px-2 rounded-md text-xs outline-none"
            style={{ backgroundColor: C.bg, color: C.text, border: `1px solid ${C.border}`, width: 70 }}
            title="Taille du texte">
            <option value="">Taille</option>
            {FONT_SIZES.map(s => <option key={s} value={s}>{s} px</option>)}
          </select>

          <Sep />

          {/* Style basique */}
          <ToolBtn active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()} title="Gras (Cmd+B)">
            <strong>B</strong>
          </ToolBtn>
          <ToolBtn active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()} title="Italique (Cmd+I)">
            <em>I</em>
          </ToolBtn>
          <ToolBtn active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()} title="Souligné (Cmd+U)">
            <u>U</u>
          </ToolBtn>
          <ToolBtn active={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()} title="Barré">
            <s>S</s>
          </ToolBtn>

          <Sep />

          {/* Couleur du texte */}
          <div className="flex items-center gap-0.5">
            <span className="text-[10px] mr-1" style={{ color: C.textDim }}>A</span>
            {TEXT_COLORS.map(c => (
              <button key={c} type="button" title={`Couleur ${c}`}
                onClick={() => editor.chain().focus().setColor(c).run()}
                className="w-5 h-5 rounded-full"
                style={{ backgroundColor: c, border: `1px solid ${C.border}` }} />
            ))}
            <button type="button" title="Effacer la couleur"
              onClick={() => editor.chain().focus().unsetColor().run()}
              className="w-5 h-5 rounded-full text-[9px] flex items-center justify-center"
              style={{ backgroundColor: 'transparent', color: C.textDim, border: `1px solid ${C.border}` }}>
              ✕
            </button>
          </div>

          <Sep />

          {/* Surligneur */}
          <div className="flex items-center gap-0.5">
            <span className="text-[10px] mr-1" style={{ color: C.textDim }}>🖍</span>
            {HIGHLIGHT_COLORS.map(c => (
              <button key={c} type="button" title={`Surligner ${c}`}
                onClick={() => editor.chain().focus().toggleHighlight({ color: c }).run()}
                className="w-5 h-5 rounded-sm"
                style={{ backgroundColor: c, opacity: 0.6, border: `1px solid ${C.border}` }} />
            ))}
            <button type="button" title="Effacer surlignage"
              onClick={() => editor.chain().focus().unsetHighlight().run()}
              className="w-5 h-5 rounded-sm text-[9px] flex items-center justify-center"
              style={{ backgroundColor: 'transparent', color: C.textDim, border: `1px solid ${C.border}` }}>
              ✕
            </button>
          </div>
        </div>

        {/* Ligne 2 : titres, listes, alignement, lien, tableau, undo */}
        <div className="flex flex-wrap items-center gap-1 px-3 py-1.5"
          style={{ borderTop: `1px solid ${C.border}` }}>
          <ToolBtn active={editor.isActive('heading', { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Titre 1">
            <span className="text-[11px]">H1</span>
          </ToolBtn>
          <ToolBtn active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Titre 2">
            <span className="text-[11px]">H2</span>
          </ToolBtn>
          <ToolBtn active={editor.isActive('heading', { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Titre 3">
            <span className="text-[11px]">H3</span>
          </ToolBtn>

          <Sep />

          <ToolBtn active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()} title="Liste à puces">
            •
          </ToolBtn>
          <ToolBtn active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Liste numérotée">
            <span className="text-[10px]">1.</span>
          </ToolBtn>
          <ToolBtn active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Citation">
            "
          </ToolBtn>
          <ToolBtn active={editor.isActive('codeBlock')}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Bloc de code">
            <span className="text-[9px] font-mono">{'</>'}</span>
          </ToolBtn>

          <Sep />

          <ToolBtn active={editor.isActive({ textAlign: 'left' })}
            onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Aligner à gauche">
            <span className="text-[11px]">⬅</span>
          </ToolBtn>
          <ToolBtn active={editor.isActive({ textAlign: 'center' })}
            onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Centrer">
            <span className="text-[11px]">↔</span>
          </ToolBtn>
          <ToolBtn active={editor.isActive({ textAlign: 'right' })}
            onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Aligner à droite">
            <span className="text-[11px]">➡</span>
          </ToolBtn>
          <ToolBtn active={editor.isActive({ textAlign: 'justify' })}
            onClick={() => editor.chain().focus().setTextAlign('justify').run()} title="Justifier">
            <span className="text-[11px]">≡</span>
          </ToolBtn>

          <Sep />

          <ToolBtn active={editor.isActive('link')} onClick={handleLink} title="Lien" wide>
            <span className="text-[11px]">🔗</span>
          </ToolBtn>

          <Sep />

          <ToolBtn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            title="Insérer un tableau" wide>
            <span className="text-[10px]">⊞ Tableau</span>
          </ToolBtn>
          {editor.isActive('table') && (
            <>
              <ToolBtn onClick={() => editor.chain().focus().addColumnAfter().run()} title="+ colonne">
                <span className="text-[10px]">+col</span>
              </ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().addRowAfter().run()} title="+ ligne">
                <span className="text-[10px]">+lig</span>
              </ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().deleteTable().run()} title="Supprimer le tableau">
                <span className="text-[10px]" style={{ color: C.red }}>🗑</span>
              </ToolBtn>
            </>
          )}

          <div className="flex-1" />

          <ToolBtn onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()} title="Annuler (Cmd+Z)">↶</ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()} title="Refaire (Cmd+Shift+Z)">↷</ToolBtn>
        </div>
      </div>

      {/* Zone d'édition style "page Word" : fond sombre, page blanche centrée */}
      <div className="flex-1 overflow-y-auto px-4 py-6"
        style={{ backgroundColor: '#2A2D35' }}>
        <div className="mx-auto rounded-sm"
          style={{
            maxWidth: 760,
            minHeight: '70vh',
            backgroundColor: '#FFFFFF',
            color: '#1A1A1A',
            padding: '60px 80px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}>
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Footer : statistiques document */}
      <div className="flex items-center justify-between px-4 py-2 text-[11px]"
        style={{ backgroundColor: C.surface, color: C.textDim, borderTop: `1px solid ${C.border}` }}>
        <span>📝 {wordsCount} mot{wordsCount > 1 ? 's' : ''} · {charsCount} caractère{charsCount > 1 ? 's' : ''}</span>
        <span>🟢 Sauvegarde manuelle</span>
      </div>

      {/* Mini-modal pour saisir une URL de lien */}
      {linkPromptOpen && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setLinkPromptOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl p-4 fade-in"
            style={{ backgroundColor: C.bg, border: `1px solid ${C.borderGold}` }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🔗</span>
              <div className="text-sm font-extrabold" style={{ color: C.text }}>
                {linkUrl ? 'Modifier le lien' : 'Ajouter un lien'}
              </div>
            </div>
            <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applyLink(); if (e.key === 'Escape') setLinkPromptOpen(false); }}
              placeholder="https://exemple.com"
              autoFocus
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
            <p className="text-[11px] mt-2" style={{ color: C.textMute }}>
              Laisse vide et clique "OK" pour retirer le lien.
            </p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setLinkPromptOpen(false)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold"
                style={{ color: C.textDim, border: `1px solid ${C.border}` }}>
                Annuler
              </button>
              <button onClick={applyLink}
                className="flex-1 py-2 rounded-lg text-xs font-bold"
                style={{ backgroundColor: C.gold, color: C.bg }}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Modal de partage de note avec d'autres users
function NoteShareModal({ noteId, currentSharedWith, currentUserId, onClose, onUpdate }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set(currentSharedWith || []));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, is_recruiter, organization, sport, avatar_url')
        .neq('id', currentUserId)
        .order('full_name');
      if (cancel) return;
      if (error) console.error('Erreur chargement users:', error);
      setUsers(data || []);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [currentUserId]);

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleSave = async () => {
    setSaving(true);
    const { error } = await onUpdate(noteId, Array.from(selected));
    setSaving(false);
    if (!error) onClose();
  };

  const filtered = users.filter(u =>
    !search || (u.full_name || '').toLowerCase().includes(search.toLowerCase())
      || (u.organization || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] flex items-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}>
      <div className="w-full rounded-t-2xl flex flex-col"
        style={{ backgroundColor: C.bg, height: '85dvh', border: `1px solid ${C.border}` }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: C.border }}>
          <div className="flex items-center gap-2">
            <Share2 size={16} style={{ color: C.gold }} />
            <div className="text-base font-extrabold" style={{ color: C.text }}>Partager cette note</div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: C.surface }}>
            <X size={16} style={{ color: C.text }} />
          </button>
        </div>

        <div className="px-4 py-3 border-b" style={{ borderColor: C.border }}>
          <div className="rounded-lg p-2.5 flex items-start gap-2 mb-3"
            style={{ backgroundColor: C.goldSoft, border: `1px solid ${C.borderGold}` }}>
            <AlertTriangle size={12} style={{ color: C.gold }} className="mt-0.5 flex-shrink-0" />
            <p className="text-[11px] leading-relaxed" style={{ color: C.textDim }}>
              Les utilisateurs sélectionnés pourront <strong style={{ color: C.text }}>lire ET modifier</strong> cette note.
              Idéal pour collaborer entre recruteurs sur un même joueur.
            </p>
          </div>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un utilisateur…"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin" style={{ color: C.gold }} />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: C.textDim }}>Aucun utilisateur trouvé</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {filtered.map(u => {
                const isSel = selected.has(u.id);
                return (
                  <button key={u.id} onClick={() => toggle(u.id)}
                    className="flex items-center gap-3 p-2.5 rounded-xl text-left"
                    style={{
                      backgroundColor: isSel ? C.goldSoft : C.surface,
                      border: `1px solid ${isSel ? C.gold : C.border}`,
                    }}>
                    <Avatar profile={u} size={40} ringColor={C.gold} ringWidth={1.5} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: C.text }}>
                        {u.full_name || 'Utilisateur'}
                      </div>
                      <div className="text-[11px] truncate" style={{ color: C.textDim }}>
                        {u.is_recruiter ? `💼 ${u.organization || 'Recruteur'}` : '⚽ Athlète'}
                      </div>
                    </div>
                    <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: isSel ? C.gold : 'transparent',
                        border: `1.5px solid ${isSel ? C.gold : C.textMute}`,
                      }}>
                      {isSel && <CheckCircle2 size={12} fill={C.bg} stroke={C.bg} strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t" style={{ borderColor: C.border }}>
          <button onClick={handleSave} disabled={saving}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            style={{ backgroundColor: saving ? 'rgba(255,184,0,0.4)' : C.gold, color: C.bg }}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={14} />}
            {saving ? 'Sauvegarde…' : `Partager avec ${selected.size} utilisateur${selected.size > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// Overlay plein écran pour éditer la note d'un athlète
function AthleteNotesEditor({ athlete, currentUserId, onClose, onLoad, onSave, onUpdateShare }) {
  const [note, setNote] = useState(null); // { id, body } existant ou null
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'dirty' | 'saved'
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (!athlete?.id || !currentUserId) return;
    let cancel = false;
    (async () => {
      const n = await onLoad(athlete.id);
      if (cancel) return;
      setNote(n);
      setBody(n?.body || '');
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [athlete?.id, currentUserId]);

  const handleChange = (html) => {
    setBody(html);
    setStatus('dirty');
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await onSave(athlete.id, body, note?.id);
    setSaving(false);
    if (res?.data) {
      setNote(res.data);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex flex-col" style={{ backgroundColor: C.bg }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3"
        style={{ borderBottom: `1px solid ${C.border}` }}>
        <button onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <ArrowLeft size={18} style={{ color: C.text }} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[10px]" style={{ color: C.textDim }}>Notes privées sur</div>
          <div className="text-base font-extrabold truncate" style={{ color: C.text }}>
            {athlete?.full_name || 'Athlète'}
          </div>
        </div>
        {status === 'dirty' && (
          <span className="text-[11px]" style={{ color: C.gold }}>Modifications…</span>
        )}
        {status === 'saved' && (
          <span className="text-[11px]" style={{ color: C.green }}>✓ Enregistré</span>
        )}
        {/* Bouton Partager (visible uniquement si owner et note existe) */}
        {note?.id && note.recruiter_id === currentUserId && (
          <button onClick={() => setShareOpen(true)}
            className="px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5"
            style={{ backgroundColor: C.surface, color: C.gold, border: `1px solid ${C.borderGold}` }}>
            <Share2 size={12} />
            {note.shared_with?.length > 0 ? `Partagée (${note.shared_with.length})` : 'Partager'}
          </button>
        )}
        <button onClick={handleSave} disabled={saving || status === 'idle'}
          className="px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5"
          style={{
            backgroundColor: saving || status === 'idle' ? 'rgba(255,184,0,0.4)' : C.gold,
            color: C.bg,
          }}>
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          {saving ? 'Sauve…' : 'Enregistrer'}
        </button>
      </div>

      {/* Modal partage */}
      {shareOpen && note?.id && (
        <NoteShareModal
          noteId={note.id}
          currentSharedWith={note.shared_with || []}
          currentUserId={currentUserId}
          onClose={() => setShareOpen(false)}
          onUpdate={async (noteId, sharedWith) => {
            const res = await onUpdateShare(noteId, sharedWith);
            if (!res.error) {
              setNote(prev => prev ? { ...prev, shared_with: sharedWith } : prev);
            }
            return res;
          }}
        />
      )}

      {/* Éditeur */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={20} className="animate-spin" style={{ color: C.gold }} />
        </div>
      ) : (
        <RichTextEditor
          initialContent={note?.body || ''}
          onChange={handleChange}
          placeholder="Note sur le joueur : forces, points à travailler, observations terrain, conditions…" />
      )}
    </div>
  );
}

function ShortlistDbRow({ athlete, currentStatus, actualStatus, onUpdateStatus, onRemove,
                          onSelectProfile, onRequestSign, onOpenNotes }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const sport = SPORTS.find(s => s.id === athlete.sport);
  const isPendingSign = actualStatus === 'signe_pending';
  // Empêche de revenir à un onglet identique. Le statut "signé" est spécial : on propose
  // "Demander la signature" plutôt que UPDATE direct.
  const otherStatuses = SHORTLIST_TABS.filter(t => t.id !== currentStatus);

  return (
    <div className="rounded-xl overflow-hidden relative"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-3 p-3">
        <button onClick={() => onSelectProfile?.(athlete)} className="flex-shrink-0">
          <Avatar profile={athlete} size={48} ringColor={C.gold} />
        </button>

        <button onClick={() => onSelectProfile?.(athlete)} className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1 flex-wrap">
            <div className="font-semibold text-sm truncate" style={{ color: C.text }}>
              {athlete.full_name || 'Athlète'}
            </div>
            {athlete.verified && <BadgeCheck size={12} fill={C.gold} stroke={C.bg} strokeWidth={2.5} />}
            {isPendingSign && (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold font-mono"
                style={{ backgroundColor: 'rgba(255,184,0,0.18)', color: C.gold, border: `1px solid ${C.borderGold}` }}>
                ⏳ EN ATTENTE
              </span>
            )}
          </div>
          <div className="text-xs truncate" style={{ color: C.textDim }}>
            {sport?.icon || '🏆'} {sport?.label || athlete.sport || 'Sport'}
            {athlete.position && ` · ${athlete.position}`}
            {athlete.club && ` · ${athlete.club}`}
          </div>
        </button>

        {onOpenNotes && (
          <button onClick={() => onOpenNotes(athlete)} aria-label="Notes"
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.gold }}>
            <NotebookPen size={14} strokeWidth={2.2} />
          </button>
        )}

        <button onClick={() => setMenuOpen(o => !o)}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: C.goldSoft, border: `1px solid ${C.borderGold}`, color: C.gold }}>
          <ChevronDown size={16} strokeWidth={2.4}
            style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
      </div>

      {menuOpen && (
        <div className="px-3 pb-3 fade-in">
          <div className="rounded-lg p-2 flex flex-col gap-1"
            style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
            <div className="text-[9px] font-semibold mb-1 px-1"
              style={{ color: C.gold }}>
              Changer le statut
            </div>
            {otherStatuses.map(t => {
              // Statut "signe" : on passe par le workflow de confirmation
              const isSign = t.id === 'signe';
              const disabled = isSign && isPendingSign;
              return (
                <button key={t.id} disabled={disabled}
                  onClick={() => {
                    setMenuOpen(false);
                    if (isSign) onRequestSign?.(athlete);
                    else onUpdateStatus(athlete.id, t.id);
                  }}
                  className="flex items-center gap-2 px-2 py-2 rounded text-left text-sm"
                  style={{ color: C.text, backgroundColor: 'transparent', opacity: disabled ? 0.5 : 1 }}>
                  <span>{t.icon}</span>
                  <span style={{ color: t.color }} className="font-semibold">{t.label}</span>
                  {isSign && (
                    <span className="ml-auto text-[9px] font-mono" style={{ color: C.textMute }}>
                      {disabled ? 'demande déjà envoyée' : 'demande la confirmation'}
                    </span>
                  )}
                </button>
              );
            })}
            <div className="h-px my-1" style={{ backgroundColor: C.border }} />
            {confirmRemove ? (
              <div className="flex gap-1.5 px-1 py-1">
                <button onClick={() => { onRemove(athlete.id); setMenuOpen(false); }}
                  className="flex-1 py-2 rounded text-xs font-bold"
                  style={{ backgroundColor: C.red, color: C.text }}>
                  Confirmer suppression
                </button>
                <button onClick={() => setConfirmRemove(false)}
                  className="px-3 py-2 rounded text-xs"
                  style={{ color: C.textDim, border: `1px solid ${C.border}` }}>
                  Annuler
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmRemove(true)}
                className="flex items-center gap-2 px-2 py-2 rounded text-left text-sm"
                style={{ color: C.red }}>
                <Trash2 size={14} />
                <span className="font-semibold">Retirer de la shortlist</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══ SIGNED POSTS — Modal upload + Galerie ══════════════════════════
function SignedPostModal({ currentUserId, onClose, onCreate, onLoadSignedAthletes }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState('');
  const [taggedAthleteId, setTaggedAthleteId] = useState('');
  const [athletes, setAthletes] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const list = await onLoadSignedAthletes(currentUserId);
      if (!cancel) setAthletes(list);
    })();
    return () => { cancel = true; };
  }, [currentUserId]);

  const handlePick = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!file) { setError('Choisis une photo'); return; }
    setError(''); setSubmitting(true);
    const { error: err } = await onCreate(file, caption, taggedAthleteId || null);
    setSubmitting(false);
    if (err) setError(err); else onClose();
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}>
      <div className="w-full rounded-t-2xl flex flex-col"
        style={{ backgroundColor: C.bg, maxHeight: '90dvh', border: `1px solid ${C.border}` }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: C.border }}>
          <div className="flex items-center gap-2">
            <span className="text-base">🏆</span>
            <div className="text-base font-extrabold" style={{ color: C.text }}>Publier une photo</div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: C.surface }}>
            <X size={16} style={{ color: C.text }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Preview / Upload */}
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-xl overflow-hidden relative"
            style={{ aspectRatio: '4/3', backgroundColor: C.surface, border: `1px dashed ${C.border}` }}>
            {previewUrl ? (
              <>
                <img loading="lazy" decoding="async" src={previewUrl} alt="Aperçu" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1"
                  style={{ backgroundColor: 'rgba(8,15,32,0.85)', color: C.gold, backdropFilter: 'blur(10px)' }}>
                  <Camera size={11} /> Changer
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <Camera size={28} style={{ color: C.gold }} />
                <span className="text-sm font-semibold" style={{ color: C.text }}>Ajouter une photo</span>
                <span className="text-[11px]" style={{ color: C.textDim }}>JPG, PNG, WebP — max 10 Mo</span>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handlePick} />
          </button>

          {/* Tag athlète signé */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>
              🏷 Tag un joueur signé (facultatif)
            </label>
            {athletes.length === 0 ? (
              <p className="text-[11px]" style={{ color: C.textMute }}>
                Aucun joueur signé pour le moment. Tu pourras tagger après une signature confirmée.
              </p>
            ) : (
              <select value={taggedAthleteId} onChange={(e) => setTaggedAthleteId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }}>
                <option value="">— Aucun tag —</option>
                {athletes.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.full_name || 'Athlète'}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Caption */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>
              Légende (facultatif)
            </label>
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)}
              rows={3} maxLength={500}
              placeholder="Ex : Signature officielle avec [Nom], saison 2026/27 !"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
            <div className="text-[10px] mt-1 text-right" style={{ color: C.textMute }}>{caption.length}/500</div>
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg text-xs"
              style={{ backgroundColor: 'rgba(255,71,87,0.12)', color: C.red, border: `1px solid ${C.red}` }}>
              {error}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t" style={{ borderColor: C.border }}>
          <button onClick={handleSubmit} disabled={submitting || !file}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            style={{
              backgroundColor: submitting || !file ? 'rgba(255,184,0,0.4)' : C.gold,
              color: C.bg,
            }}>
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />}
            {submitting ? 'Publication…' : 'Publier'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Galerie des publications signed_posts d'un recruteur
function SignedPostsGallery({ recruiterId, currentUserId, onLoad, onDelete, onAdd, onSelectAthlete }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [previewPost, setPreviewPost] = useState(null); // photo affichée en fullscreen
  const isOwn = recruiterId === currentUserId;

  useEffect(() => {
    if (!recruiterId) return;
    let cancel = false;
    setLoading(true);
    (async () => {
      const list = await onLoad(recruiterId);
      if (!cancel) { setPosts(list); setLoading(false); }
    })();
    return () => { cancel = true; };
  }, [recruiterId, reloadKey]);

  const handleDelete = async (postId) => {
    const { error } = await onDelete(postId);
    if (!error) {
      setPosts(prev => prev.filter(p => p.id !== postId));
      setConfirmDeleteId(null);
    }
  };

  if (!recruiterId) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold" style={{ color: C.gold }}>
          🏆 Signatures ({posts.length})
        </h3>
        {isOwn && onAdd && (
          <button onClick={() => onAdd(() => setReloadKey(k => k + 1))}
            className="px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1"
            style={{ backgroundColor: C.gold, color: C.bg }}>
            <Plus size={11} strokeWidth={2.6} /> Publier
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={18} className="animate-spin" style={{ color: C.gold }} />
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl py-8 px-6 text-center"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <Camera size={24} style={{ color: C.textMute }} className="mx-auto mb-2" />
          <p className="text-xs" style={{ color: C.textDim }}>
            {isOwn ? 'Publie ta première photo de signature !' : 'Aucune publication pour le moment'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {posts.map(p => (
            <div key={p.id} className="rounded-xl overflow-hidden relative fade-in"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              <button onClick={() => setPreviewPost(p)}
                aria-label="Afficher la photo en grand"
                className="relative block w-full"
                style={{ aspectRatio: '1', backgroundColor: '#000' }}>
                <img loading="lazy" decoding="async" src={p.image_url} alt={p.caption || ''} className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                {isOwn && (
                  <span role="button" tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(p.id); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setConfirmDeleteId(p.id); } }}
                    aria-label="Supprimer"
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
                    style={{ backgroundColor: 'rgba(8,15,32,0.7)', backdropFilter: 'blur(10px)' }}>
                    <Trash2 size={12} style={{ color: C.red }} />
                  </span>
                )}
              </button>
              <div className="p-2">
                {p.athlete && (
                  <button onClick={() => onSelectAthlete?.(p.athlete)}
                    className="flex items-center gap-1.5 text-[10px] font-semibold mb-1 text-left"
                    style={{ color: C.gold }}>
                    🏷 {p.athlete.full_name || 'Athlète'}
                  </button>
                )}
                {p.caption && (
                  <p className="text-[11px] line-clamp-2" style={{ color: C.text }}>{p.caption}</p>
                )}
                <div className="text-[10px] mt-1 flex items-center gap-1" style={{ color: C.gold }}>
                  <span>📅</span>
                  <span>Signé le {new Date(p.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              {confirmDeleteId === p.id && (
                <div className="absolute inset-0 z-10 flex items-center justify-center p-3"
                  style={{ backgroundColor: 'rgba(8,15,32,0.92)', backdropFilter: 'blur(4px)' }}>
                  <div className="text-center">
                    <p className="text-xs font-semibold mb-2" style={{ color: C.text }}>Supprimer cette publication ?</p>
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => setConfirmDeleteId(null)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold"
                        style={{ color: C.textDim, border: `1px solid ${C.border}` }}>
                        Annuler
                      </button>
                      <button onClick={() => handleDelete(p.id)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold"
                        style={{ backgroundColor: C.red, color: C.text }}>
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen preview de la photo cliquée */}
      {previewPost && (
        <div className="fixed inset-0 z-[95] flex flex-col fade-in"
          style={{ backgroundColor: 'rgba(0,0,0,0.95)' }}
          onClick={() => setPreviewPost(null)}>
          <div className="flex items-center justify-between px-4 py-3">
            <div className="text-sm font-semibold truncate" style={{ color: C.text }}>
              {previewPost.athlete?.full_name ? `🏷 ${previewPost.athlete.full_name}` : 'Signature'}
            </div>
            <button onClick={() => setPreviewPost(null)} aria-label="Fermer"
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <X size={18} style={{ color: C.text }} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            <img loading="lazy" decoding="async" src={previewPost.image_url} alt={previewPost.caption || ''}
              className="max-w-full max-h-full object-contain rounded-lg"
              style={{ boxShadow: '0 12px 48px rgba(0,0,0,0.5)' }} />
          </div>
          {previewPost.caption && (
            <div className="px-6 py-4 text-center text-sm" style={{ color: C.text }}
              onClick={(e) => e.stopPropagation()}>
              {previewPost.caption}
            </div>
          )}
          <div className="px-6 pb-6 text-center text-[11px]" style={{ color: C.textDim }}>
            📅 Signé le {new Date(previewPost.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Labels niveau ────────────────────────────────────────────────
// Couleurs travaillées pour un rendu chaleureux (palette pastel + accents),
// pas le look "console / code" que donnait l'ancienne version mono.
const LEVEL_LABELS = {
  amateur:         { label: 'Amateur',         icon: '🌱', color: '#86EFAC' }, // vert tendre
  young_pro:       { label: 'Young Pro',       icon: '🚀', color: '#60A5FA' }, // bleu lumineux
  senior_amateur:  { label: 'Senior Amateur',  icon: '✨', color: '#FCD34D' }, // ambre doux
  senior_semi_pro: { label: 'Senior Semi-Pro', icon: '⭐', color: '#FB923C' }, // orange
  senior_pro:      { label: 'Senior Pro',      icon: '🏆', color: '#F472B6' }, // rose élite
  no_club:         { label: 'Sans club',       icon: '🆓', color: '#CBD5E1' }, // gris perle
};

// Convertit un hex en RGBA avec opacité donnée
function hexToRgba(hex, alpha) {
  const m = hex?.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return `rgba(255,255,255,${alpha})`;
  return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${alpha})`;
}

function LevelChip({ level, size = 'sm' }) {
  const info = LEVEL_LABELS[level];
  if (!info) return null;
  const pad = size === 'lg' ? 'px-3 py-1.5 text-xs' : 'px-2.5 py-1 text-[11px]';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${pad}`}
      style={{
        backgroundColor: hexToRgba(info.color, 0.18),
        color: info.color,
        border: `1px solid ${hexToRgba(info.color, 0.4)}`,
        backdropFilter: 'blur(6px)',
        letterSpacing: '0.01em',
        textShadow: '0 1px 2px rgba(0,0,0,0.4)',
      }}>
      <span style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))' }}>{info.icon}</span>
      <span>{info.label}</span>
    </span>
  );
}

// ─── Labels type vidéo ────────────────────────────────────────────
const VIDEO_TYPE_LABELS = {
  match:    { label: 'Match',         icon: '🏆', color: '#FCD34D' },
  training: { label: 'Entraînement', icon: '🏋️', color: '#60A5FA' },
};
function VideoTypeBadge({ type, size = 'sm' }) {
  const info = VIDEO_TYPE_LABELS[type];
  if (!info) return null;
  const pad = size === 'lg' ? 'px-3 py-1.5 text-xs' : 'px-2.5 py-1 text-[11px]';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${pad}`}
      style={{
        backgroundColor: hexToRgba(info.color, 0.18),
        color: info.color,
        border: `1px solid ${hexToRgba(info.color, 0.4)}`,
        backdropFilter: 'blur(6px)',
        letterSpacing: '0.01em',
        textShadow: '0 1px 2px rgba(0,0,0,0.4)',
      }}>
      <span style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))' }}>{info.icon}</span>
      <span>{info.label}</span>
    </span>
  );
}

// ═══ RAPPEL ÂGE (banner) ════════════════════════════════════════════
// Affiché quand >1 an depuis l'inscription ET (jamais rappelé OU >1 an depuis le dernier rappel)
function shouldShowAgeReminder(userProfile) {
  if (!userProfile?.created_at) return false;
  if (userProfile.age == null) return false; // pas d'âge à mettre à jour
  const YEAR_MS = 365 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const createdAt = new Date(userProfile.created_at).getTime();
  if (now - createdAt < YEAR_MS) return false;
  if (userProfile.age_last_reminded_at) {
    const last = new Date(userProfile.age_last_reminded_at).getTime();
    if (now - last < YEAR_MS) return false;
  }
  return true;
}

// Banner : rappel saisonnier en août/septembre pour mettre à jour le championnat
function shouldShowSeasonReminder(userProfile) {
  if (!userProfile) return false;
  if (userProfile.is_recruiter) return false; // athlètes uniquement
  const now = new Date();
  const month = now.getMonth(); // 0=Janvier, 7=Août, 8=Septembre
  if (month !== 7 && month !== 8) return false;
  // Pas déjà dismissé cette année ?
  if (userProfile.season_reminder_dismissed_at) {
    const lastDismiss = new Date(userProfile.season_reminder_dismissed_at);
    if (lastDismiss.getFullYear() === now.getFullYear()) return false;
  }
  return true;
}

function SeasonReminderBanner({ onEdit, onDismiss }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-[76] px-3 pt-3 fade-in pointer-events-none">
      <div className="rounded-xl p-3 flex items-start gap-2.5 pointer-events-auto"
        style={{
          backgroundColor: C.surface,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${C.borderGold}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: C.goldSoft }}>
          <span className="text-base">🏆</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-extrabold mb-0.5" style={{ color: C.text }}>
            Nouvelle saison !
          </div>
          <p className="text-[11px] leading-relaxed mb-2" style={{ color: C.textDim }}>
            Pense à <strong style={{ color: C.text }}>mettre à jour ton championnat</strong> dans
            ta bio + dans les titres et descriptions de tes vidéos pour que les recruteurs te trouvent.
          </p>
          <div className="flex gap-2">
            <button onClick={onDismiss}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold"
              style={{ color: C.textDim, border: `1px solid ${C.border}` }}>
              Plus tard
            </button>
            <button onClick={onEdit}
              className="flex-1 px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1"
              style={{ backgroundColor: C.gold, color: C.bg }}>
              <Edit3 size={11} strokeWidth={2.6} />
              Modifier mon profil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgeReminderBanner({ userProfile, onEdit, onDismiss }) {
  const yearsSinceSignup = Math.floor(
    (Date.now() - new Date(userProfile.created_at).getTime()) / (365 * 24 * 60 * 60 * 1000)
  );
  return (
    <div className="fixed top-0 left-0 right-0 z-[75] px-3 pt-3 fade-in pointer-events-none">
      <div className="rounded-xl p-3 flex items-start gap-2.5 pointer-events-auto"
        style={{
          backgroundColor: C.surface,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${C.borderGold}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: C.goldSoft }}>
          <span className="text-base">🎂</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-extrabold mb-0.5" style={{ color: C.text }}>
            Ton âge est-il toujours à jour ?
          </div>
          <p className="text-[11px] leading-relaxed mb-2" style={{ color: C.textDim }}>
            Tu es inscrit depuis {yearsSinceSignup} an{yearsSinceSignup > 1 ? 's' : ''}. Tu indiques{' '}
            <strong style={{ color: C.text }}>{userProfile.age} ans</strong> — confirme ou modifie ton âge.
          </p>
          <div className="flex gap-2">
            <button onClick={onDismiss}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold"
              style={{ color: C.textDim, border: `1px solid ${C.border}` }}>
              Plus tard
            </button>
            <button onClick={onEdit}
              className="flex-1 px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1"
              style={{ backgroundColor: C.gold, color: C.bg }}>
              <Edit3 size={11} strokeWidth={2.6} />
              Mettre à jour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══ PERMISSIONS ONBOARDING MODAL ═══════════════════════════════════
// ═══ SETTINGS VIEW (modale plein écran) ═════════════════════════════
// ─── Section CERTIFICATION (recruteurs) ──────────────────────────
function CertificationSection({ userProfile }) {
  const [request, setRequest] = useState(null); // { id, status, created_at } ou null
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [motivation, setMotivation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type, text }

  useEffect(() => {
    if (!userProfile?.id) return;
    let cancel = false;
    (async () => {
      const { data, error } = await supabase
        .from('certification_requests')
        .select('id, status, created_at, decided_at')
        .eq('recruiter_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(1).maybeSingle();
      if (cancel) return;
      if (error) console.error('Erreur cert:', error);
      setRequest(data);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [userProfile?.id]);

  const submit = async () => {
    setFeedback(null); setSubmitting(true);
    const { data, error } = await supabase.from('certification_requests')
      .insert({ recruiter_id: userProfile.id, motivation: motivation.trim() || null })
      .select().single();
    setSubmitting(false);
    if (error) {
      if (error.code === '23505') {
        setFeedback({ type: 'err', text: 'Tu as déjà une demande en cours.' });
      } else {
        setFeedback({ type: 'err', text: error.message });
      }
      return;
    }
    setRequest(data);
    setFeedback({ type: 'ok', text: 'Demande envoyée ✓ Notre équipe va te recontacter sous 7 jours.' });
    setOpen(false);
    setMotivation('');
  };

  if (loading) return null;

  const isVerified = !!userProfile.verified;
  const hasPending = request && request.status === 'pending';

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.borderGold}` }}>
      <div className="px-4 pt-3 pb-2 text-xs font-semibold" style={{ color: C.gold }}>
        ✅ Certification recruteur
      </div>

      {isVerified ? (
        <div className="px-4 pb-4 flex items-center gap-2.5">
          <BadgeCheck size={20} fill={C.gold} stroke={C.bg} strokeWidth={2.5} />
          <div className="text-sm" style={{ color: C.text }}>
            Ton compte est <strong style={{ color: C.gold }}>certifié</strong>. Un badge officiel apparaît sur ton profil.
          </div>
        </div>
      ) : hasPending ? (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Loader2 size={14} style={{ color: C.gold }} />
            <span className="text-sm font-semibold" style={{ color: C.text }}>Demande en cours d'examen</span>
          </div>
          <p className="text-[11px]" style={{ color: C.textDim }}>
            Envoyée le {new Date(request.created_at).toLocaleDateString('fr-FR')}. Notre équipe te recontactera sous 7 jours.
          </p>
        </div>
      ) : open ? (
        <div className="px-4 pb-4 space-y-3">
          <div className="rounded-lg p-2.5 flex items-start gap-2"
            style={{ backgroundColor: C.goldSoft, border: `1px solid ${C.borderGold}` }}>
            <AlertTriangle size={12} style={{ color: C.gold }} className="mt-0.5 flex-shrink-0" />
            <p className="text-[11px] leading-relaxed" style={{ color: C.textDim }}>
              La certification confirme ton identité de recruteur officiel et rassure les athlètes. Notre équipe vérifie ton profil, ton organisation et tes références.
            </p>
          </div>
          <textarea value={motivation} onChange={(e) => setMotivation(e.target.value)}
            rows={4} maxLength={1000}
            placeholder="Présente ton organisation, ton poste, et pourquoi tu demandes la certification (facultatif mais recommandé)…"
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
            style={{ backgroundColor: C.bg, color: C.text, border: `1px solid ${C.border}` }} />
          {feedback && (
            <div className="text-xs px-3 py-2 rounded-lg"
              style={{
                backgroundColor: feedback.type === 'ok' ? 'rgba(34,197,94,0.12)' : 'rgba(255,71,87,0.12)',
                color: feedback.type === 'ok' ? C.green : C.red,
              }}>
              {feedback.text}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => { setOpen(false); setMotivation(''); setFeedback(null); }}
              className="flex-1 py-2 rounded-lg text-xs font-semibold"
              style={{ color: C.textDim, border: `1px solid ${C.border}` }}>
              Annuler
            </button>
            <button onClick={submit} disabled={submitting}
              className="flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
              style={{ backgroundColor: submitting ? 'rgba(255,184,0,0.4)' : C.gold, color: C.bg }}>
              {submitting && <Loader2 size={12} className="animate-spin" />}
              Envoyer la demande
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 pb-4">
          <p className="text-[11px] mb-3" style={{ color: C.textDim }}>
            {request && request.status === 'rejected'
              ? 'Ta dernière demande a été refusée. Tu peux en refaire une.'
              : 'Demande un badge officiel pour rassurer les athlètes sur ton identité.'}
          </p>
          <button onClick={() => setOpen(true)}
            className="w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
            style={{ backgroundColor: C.gold, color: C.bg }}>
            <BadgeCheck size={13} />
            Demander la certification
          </button>
          {feedback && (
            <div className="mt-2 text-xs px-3 py-2 rounded-lg"
              style={{
                backgroundColor: feedback.type === 'ok' ? 'rgba(34,197,94,0.12)' : 'rgba(255,71,87,0.12)',
                color: feedback.type === 'ok' ? C.green : C.red,
              }}>
              {feedback.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SettingsView({ userProfile, userEmail, onClose, onLogout }) {
  // Sections togglables
  const [section, setSection] = useState(null); // 'password' | 'delete' | null

  // Changement de mot de passe
  const [newPwd, setNewPwd] = useState('');
  const [newPwdConfirm, setNewPwdConfirm] = useState('');
  const [pwdBusy, setPwdBusy] = useState(false);
  const [pwdMsg, setPwdMsg] = useState(null); // { type: 'ok'|'err', text }

  const handlePasswordChange = async () => {
    setPwdMsg(null);
    if (newPwd.length < 6) { setPwdMsg({ type: 'err', text: 'Au moins 6 caractères' }); return; }
    if (newPwd !== newPwdConfirm) { setPwdMsg({ type: 'err', text: 'Les mots de passe ne correspondent pas' }); return; }
    setPwdBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setPwdBusy(false);
    if (error) { setPwdMsg({ type: 'err', text: error.message }); return; }
    setPwdMsg({ type: 'ok', text: 'Mot de passe mis à jour ✓' });
    setNewPwd(''); setNewPwdConfirm('');
  };

  // Suppression compte
  const [confirmText, setConfirmText] = useState('');
  const [delBusy, setDelBusy] = useState(false);
  const [delError, setDelError] = useState('');
  const canDelete = confirmText.trim().toUpperCase() === 'SUPPRIMER';

  const handleAccountDelete = async () => {
    if (!canDelete) return;
    setDelError(''); setDelBusy(true);
    const { data, error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
    if (error || data?.error) {
      setDelBusy(false);
      setDelError(error?.message || data?.error || 'Erreur lors de la suppression');
      return;
    }
    await supabase.auth.signOut();
    setDelBusy(false);
  };

  // Toggles notifications (locaux, MVP — préférences UI)
  const readPref = (k, def) => {
    try { const v = localStorage.getItem('pref_' + k); return v === null ? def : v === '1'; }
    catch { return def; }
  };
  const writePref = (k, v) => { try { localStorage.setItem('pref_' + k, v ? '1' : '0'); } catch {} };
  const readPrefStr = (k, def) => {
    try { const v = localStorage.getItem('pref_' + k); return v === null ? def : v; }
    catch { return def; }
  };
  const writePrefStr = (k, v) => { try { localStorage.setItem('pref_' + k, v); } catch {} };

  const [notifLikes, setNotifLikes] = useState(() => readPref('notif_likes', true));
  const [notifComments, setNotifComments] = useState(() => readPref('notif_comments', true));
  const [notifMessages, setNotifMessages] = useState(() => readPref('notif_messages', true));
  const [notifFollows, setNotifFollows] = useState(() => readPref('notif_follows', true));
  // Notifications avancées (local)
  const [notifSounds, setNotifSounds] = useState(() => readPref('notif_sounds', true));
  const [notifVibrate, setNotifVibrate] = useState(() => readPref('notif_vibrate', true));
  const [quietStart, setQuietStart] = useState(() => readPrefStr('quiet_start', ''));
  const [quietEnd, setQuietEnd] = useState(() => readPrefStr('quiet_end', ''));
  useEffect(() => writePref('notif_likes', notifLikes), [notifLikes]);
  useEffect(() => writePref('notif_comments', notifComments), [notifComments]);
  useEffect(() => writePref('notif_messages', notifMessages), [notifMessages]);
  useEffect(() => writePref('notif_follows', notifFollows), [notifFollows]);
  useEffect(() => writePref('notif_sounds', notifSounds), [notifSounds]);
  useEffect(() => writePref('notif_vibrate', notifVibrate), [notifVibrate]);
  useEffect(() => writePrefStr('quiet_start', quietStart), [quietStart]);
  useEffect(() => writePrefStr('quiet_end', quietEnd), [quietEnd]);

  // ─── CONFIDENTIALITÉ (sauvegardée en DB) ─────────────────────
  const [isPrivate, setIsPrivate] = useState(!!userProfile?.is_private);
  const [hideAge, setHideAge] = useState(!!userProfile?.hide_age);
  const [hideLocation, setHideLocation] = useState(!!userProfile?.hide_location);
  const [messagingPref, setMessagingPref] = useState(userProfile?.messaging_pref || 'all');
  const [privacyBusy, setPrivacyBusy] = useState(false);
  const [privacyMsg, setPrivacyMsg] = useState(null);

  const updatePrivacy = async (updates) => {
    if (!userProfile?.id) return;
    setPrivacyBusy(true); setPrivacyMsg(null);
    const { error } = await supabase.from('profiles')
      .update(updates).eq('id', userProfile.id);
    setPrivacyBusy(false);
    if (error) {
      setPrivacyMsg({ type: 'err', text: error.message });
      // Rollback local
      if ('is_private' in updates) setIsPrivate(!updates.is_private);
      if ('hide_age' in updates) setHideAge(!updates.hide_age);
      if ('hide_location' in updates) setHideLocation(!updates.hide_location);
    } else {
      setPrivacyMsg({ type: 'ok', text: 'Enregistré ✓' });
      setTimeout(() => setPrivacyMsg(null), 2000);
    }
  };

  // ─── EXPORT DE MES DONNÉES (RGPD) ───────────────────────────
  const [exportBusy, setExportBusy] = useState(false);
  const handleExport = async () => {
    if (!userProfile?.id) return;
    setExportBusy(true);
    try {
      const [profile, videos, messages, applications, follows, shortlist] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userProfile.id).single(),
        supabase.from('videos').select('*').eq('user_id', userProfile.id),
        // Messages : seulement ceux dont je suis l'auteur (mes données)
        supabase.from('messages').select('id, receiver_id, content, created_at').eq('sender_id', userProfile.id),
        supabase.from('applications').select('*').eq('athlete_id', userProfile.id),
        supabase.from('follows').select('*').eq('follower_id', userProfile.id),
        supabase.from('shortlist').select('*').eq('recruiter_id', userProfile.id),
      ]);
      const payload = {
        exported_at: new Date().toISOString(),
        user_id: userProfile.id,
        email: userEmail,
        profile: profile.data,
        videos: videos.data || [],
        messages_sent: messages.data || [],
        applications_sent: applications.data || [],
        following: follows.data || [],
        my_shortlist: shortlist.data || [],
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yatsai-export-${userProfile.id.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export error:', e);
      alert('Erreur lors de l\'export : ' + (e.message || e));
    } finally {
      setExportBusy(false);
    }
  };

  const Toggle = ({ on, onChange }) => (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className="rounded-full relative flex-shrink-0"
      style={{
        width: 44, height: 26,
        backgroundColor: on ? C.gold : C.surface2,
        transition: 'background-color 0.25s ease',
      }}>
      <span className="absolute rounded-full"
        style={{
          top: 3, left: 3, width: 20, height: 20,
          backgroundColor: on ? C.bg : C.text,
          transform: on ? 'translateX(18px)' : 'translateX(0)',
          transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
    </button>
  );

  const Row = ({ icon: Icon, title, subtitle, right, onClick, danger }) => {
    // Si la row contient un Toggle (right cliquable), on utilise un <div>
    // pour éviter les boutons imbriqués (warnings React). Sinon, on garde un <button>.
    const Wrapper = onClick ? 'button' : 'div';
    return (
      <Wrapper
        {...(onClick ? { onClick, type: 'button' } : {})}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
        style={{
          backgroundColor: 'transparent',
          cursor: onClick ? 'pointer' : 'default',
          border: 'none',
        }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: danger ? 'rgba(255,71,87,0.12)' : C.surface2,
                   color: danger ? C.red : C.gold }}>
          <Icon size={16} strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold" style={{ color: danger ? C.red : C.text }}>{title}</div>
          {subtitle && <div className="text-[11px]" style={{ color: C.textDim }}>{subtitle}</div>}
        </div>
        {right}
      </Wrapper>
    );
  };

  return (
    <div className="fixed inset-0 z-[88] overflow-y-auto" style={{ backgroundColor: C.bg }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{ backgroundColor: C.bg, borderBottom: `1px solid ${C.border}` }}>
        <button onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <ArrowLeft size={18} style={{ color: C.text }} />
        </button>
        <h1 className="text-xl font-extrabold" style={{ color: C.text }}>Paramètres</h1>
      </div>

      <div className="px-4 py-4 space-y-5 pb-32">
        {/* Compte */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <div className="px-4 pt-3 pb-2 text-xs font-semibold" style={{ color: C.gold }}>Compte</div>
          <Row icon={Mail} title="Email" subtitle={userEmail} />
          <div className="h-px mx-4" style={{ backgroundColor: C.border }} />
          <Row icon={Lock} title="Changer le mot de passe"
            onClick={() => setSection(section === 'password' ? null : 'password')}
            right={<ChevronDown size={14} style={{
              color: C.textDim,
              transform: section === 'password' ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }} />} />

          {section === 'password' && (
            <div className="px-4 pb-4 pt-1 fade-in space-y-2">
              <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)}
                placeholder="Nouveau mot de passe (6 caractères min)" minLength={6}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ backgroundColor: C.bg, color: C.text, border: `1px solid ${C.border}` }} />
              <input type="password" value={newPwdConfirm} onChange={(e) => setNewPwdConfirm(e.target.value)}
                placeholder="Confirmer le mot de passe"
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ backgroundColor: C.bg, color: C.text, border: `1px solid ${C.border}` }} />
              <button onClick={handlePasswordChange} disabled={pwdBusy || !newPwd}
                className="w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                style={{ backgroundColor: C.gold, color: C.bg, opacity: pwdBusy || !newPwd ? 0.6 : 1 }}>
                {pwdBusy && <Loader2 size={14} className="animate-spin" />}
                Mettre à jour
              </button>
              {pwdMsg && (
                <div className="text-xs px-3 py-2 rounded-lg"
                  style={{
                    backgroundColor: pwdMsg.type === 'ok' ? 'rgba(34,197,94,0.12)' : 'rgba(255,71,87,0.12)',
                    color: pwdMsg.type === 'ok' ? C.green : C.red,
                  }}>
                  {pwdMsg.text}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Confidentialité */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <div className="px-4 pt-3 pb-2 flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: C.gold }}>Confidentialité</span>
            {privacyMsg && (
              <span className="text-[10px] font-semibold"
                style={{ color: privacyMsg.type === 'ok' ? C.green : C.red }}>
                {privacyMsg.text}
              </span>
            )}
          </div>
          <Row icon={Lock} title="Compte privé"
            subtitle="Tes vidéos et abonnés ne sont visibles que par tes abonnés"
            right={<Toggle on={isPrivate} onChange={(v) => { setIsPrivate(v); updatePrivacy({ is_private: v }); }} />} />
          <div className="h-px mx-4" style={{ backgroundColor: C.border }} />
          <Row icon={Eye} title="Masquer mon âge"
            right={<Toggle on={hideAge} onChange={(v) => { setHideAge(v); updatePrivacy({ hide_age: v }); }} />} />
          <div className="h-px mx-4" style={{ backgroundColor: C.border }} />
          <Row icon={Eye} title="Masquer ma localisation"
            right={<Toggle on={hideLocation} onChange={(v) => { setHideLocation(v); updatePrivacy({ hide_location: v }); }} />} />
          <div className="h-px mx-4" style={{ backgroundColor: C.border }} />
          <div className="px-4 py-3">
            <div className="text-sm font-semibold mb-2" style={{ color: C.text }}>Qui peut me contacter</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'all', label: 'Tout le monde' },
                { id: 'followers', label: 'Mes abonnés' },
                { id: 'recruiters', label: 'Recruteurs' },
                { id: 'none', label: 'Personne' },
              ].map(opt => {
                const active = messagingPref === opt.id;
                return (
                  <button key={opt.id}
                    onClick={() => { setMessagingPref(opt.id); updatePrivacy({ messaging_pref: opt.id }); }}
                    disabled={privacyBusy}
                    className="py-2 rounded-lg text-xs font-semibold"
                    style={{
                      backgroundColor: active ? C.goldSoft : C.bg,
                      color: active ? C.gold : C.text,
                      border: `1px solid ${active ? C.gold : C.border}`,
                    }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <div className="px-4 pt-3 pb-2 text-xs font-semibold" style={{ color: C.gold }}>Notifications</div>
          {/* Likes & commentaires : athlètes uniquement (eux seuls publient des vidéos) */}
          {isAthleteRole(userProfile) && (
            <>
              <Row icon={Heart} title="Likes sur mes vidéos"
                right={<Toggle on={notifLikes} onChange={setNotifLikes} />} />
              <div className="h-px mx-4" style={{ backgroundColor: C.border }} />
              <Row icon={MessageCircle} title="Nouveaux commentaires"
                right={<Toggle on={notifComments} onChange={setNotifComments} />} />
              <div className="h-px mx-4" style={{ backgroundColor: C.border }} />
            </>
          )}
          <Row icon={Send} title="Messages privés"
            right={<Toggle on={notifMessages} onChange={setNotifMessages} />} />
          <div className="h-px mx-4" style={{ backgroundColor: C.border }} />
          <Row icon={Users} title="Nouveaux abonnés"
            right={<Toggle on={notifFollows} onChange={setNotifFollows} />} />
          <div className="h-px mx-4" style={{ backgroundColor: C.border }} />
          <Row icon={Volume2} title="Sons" subtitle="Émettre un son à chaque notification"
            right={<Toggle on={notifSounds} onChange={setNotifSounds} />} />
          <div className="h-px mx-4" style={{ backgroundColor: C.border }} />
          <Row icon={Mic} title="Vibrations" subtitle="Vibrer à chaque notification (mobile)"
            right={<Toggle on={notifVibrate} onChange={setNotifVibrate} />} />
          <div className="h-px mx-4" style={{ backgroundColor: C.border }} />
          <div className="px-4 py-3">
            <div className="text-sm font-semibold mb-1" style={{ color: C.text }}>Mode silencieux</div>
            <div className="text-[11px] mb-2" style={{ color: C.textDim }}>
              Aucune notification entre ces deux horaires
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] block mb-1" style={{ color: C.textDim }}>Début</label>
                <input type="time" value={quietStart} onChange={(e) => setQuietStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: C.bg, color: C.text, border: `1px solid ${C.border}` }} />
              </div>
              <div>
                <label className="text-[10px] block mb-1" style={{ color: C.textDim }}>Fin</label>
                <input type="time" value={quietEnd} onChange={(e) => setQuietEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: C.bg, color: C.text, border: `1px solid ${C.border}` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Données RGPD */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <div className="px-4 pt-3 pb-2 text-xs font-semibold" style={{ color: C.gold }}>Mes données</div>
          <Row icon={ArrowDown} title="Télécharger mes données"
            subtitle="Export JSON conforme RGPD (profil, vidéos, messages envoyés…)"
            onClick={exportBusy ? null : handleExport}
            right={exportBusy ? <Loader2 size={14} className="animate-spin" style={{ color: C.gold }} />
              : <ChevronDown size={14} style={{ color: C.textDim, transform: 'rotate(-90deg)' }} />} />
        </div>

        {/* Certification (recruteurs uniquement) */}
        {userProfile?.is_recruiter && (
          <CertificationSection userProfile={userProfile} />
        )}

        {/* À propos */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <div className="px-4 pt-3 pb-2 text-xs font-semibold" style={{ color: C.gold }}>À propos</div>
          <Row icon={Sparkles} title="Version" subtitle="Yatsai v0.1 (beta)" />
        </div>

        {/* Zone danger */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid rgba(255,71,87,0.3)` }}>
          <div className="px-4 pt-3 pb-2 text-xs font-semibold" style={{ color: C.red }}>Zone sensible</div>
          <Row icon={ArrowLeft} title="Se déconnecter" subtitle="Tu pourras te reconnecter à tout moment"
            onClick={onLogout} danger
            right={<ChevronDown size={14} style={{ color: C.red, transform: 'rotate(-90deg)' }} />} />
          <div className="h-px mx-4" style={{ backgroundColor: C.border }} />
          <Row icon={Trash2} title="Supprimer mon compte"
            subtitle="Toutes tes données seront effacées définitivement"
            onClick={() => setSection(section === 'delete' ? null : 'delete')} danger
            right={<ChevronDown size={14} style={{
              color: C.red,
              transform: section === 'delete' ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }} />} />

          {section === 'delete' && (
            <div className="px-4 pb-4 pt-1 fade-in space-y-2">
              <div className="rounded-lg p-2.5 flex items-start gap-2"
                style={{ backgroundColor: 'rgba(255,71,87,0.08)', border: `1px solid ${C.red}` }}>
                <AlertTriangle size={12} style={{ color: C.red }} className="mt-0.5 flex-shrink-0" />
                <p className="text-[11px] leading-relaxed" style={{ color: C.textDim }}>
                  Cette action est <strong style={{ color: C.red }}>irréversible</strong>. Tes vidéos, messages,
                  commentaires, shortlists et candidatures seront définitivement supprimés.
                </p>
              </div>
              <p className="text-[11px]" style={{ color: C.textDim }}>
                Tape <strong style={{ color: C.text }}>SUPPRIMER</strong> pour confirmer :
              </p>
              <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
                placeholder="SUPPRIMER"
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ backgroundColor: C.bg, color: C.text, border: `1px solid ${C.border}` }} />
              <button onClick={handleAccountDelete} disabled={!canDelete || delBusy}
                className="w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                style={{
                  backgroundColor: canDelete && !delBusy ? C.red : 'rgba(255,71,87,0.3)',
                  color: C.text,
                }}>
                {delBusy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {delBusy ? 'Suppression…' : 'Supprimer définitivement mon compte'}
              </button>
              {delError && (
                <div className="text-xs px-3 py-2 rounded-lg"
                  style={{ backgroundColor: 'rgba(255,71,87,0.12)', color: C.red }}>
                  {delError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PermissionsModal({ onFinish }) {
  // 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'
  const [status, setStatus] = useState({
    notifications: 'idle',
    contacts: 'idle',
    microphone: 'idle',
    camera: 'idle',
    location: 'idle',
  });
  const [busy, setBusy] = useState(false);

  // Au montage, lire l'état actuel des permissions (si l'API existe)
  useEffect(() => {
    const initStatuses = async () => {
      const next = { ...status };

      // Notifications (API standard)
      if (typeof Notification !== 'undefined') {
        if (Notification.permission === 'granted') next.notifications = 'granted';
        else if (Notification.permission === 'denied') next.notifications = 'denied';
      } else {
        next.notifications = 'unsupported';
      }

      // Permissions API pour mic/camera/géoloc
      if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
        try {
          const mic = await navigator.permissions.query({ name: 'microphone' });
          if (mic.state === 'granted') next.microphone = 'granted';
          else if (mic.state === 'denied') next.microphone = 'denied';
        } catch {}
        try {
          const cam = await navigator.permissions.query({ name: 'camera' });
          if (cam.state === 'granted') next.camera = 'granted';
          else if (cam.state === 'denied') next.camera = 'denied';
        } catch {}
        try {
          const geo = await navigator.permissions.query({ name: 'geolocation' });
          if (geo.state === 'granted') next.location = 'granted';
          else if (geo.state === 'denied') next.location = 'denied';
        } catch {}
      }

      // Contacts : non supporté sur web standard
      if (typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window) {
        // Chrome Android uniquement
      } else {
        next.contacts = 'unsupported';
      }

      setStatus(next);
    };
    initStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateOne = (key, value) => setStatus(prev => ({ ...prev, [key]: value }));

  const requestNotifications = async () => {
    if (typeof Notification === 'undefined') return updateOne('notifications', 'unsupported');
    updateOne('notifications', 'requesting');
    try {
      const result = await Notification.requestPermission();
      updateOne('notifications', result === 'granted' ? 'granted' : 'denied');
    } catch {
      updateOne('notifications', 'denied');
    }
  };

  const requestMicrophone = async () => {
    updateOne('microphone', 'requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop()); // Stop immédiatement
      updateOne('microphone', 'granted');
    } catch {
      updateOne('microphone', 'denied');
    }
  };

  const requestCamera = async () => {
    updateOne('camera', 'requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      updateOne('camera', 'granted');
    } catch {
      updateOne('camera', 'denied');
    }
  };

  const requestLocation = async () => {
    if (!navigator.geolocation) return updateOne('location', 'unsupported');
    updateOne('location', 'requesting');
    try {
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject,
          { timeout: 10000, maximumAge: 60000 });
      });
      updateOne('location', 'granted');
    } catch {
      updateOne('location', 'denied');
    }
  };

  const requestContacts = async () => {
    updateOne('contacts', 'requesting');
    // API expérimentale Chrome Android
    if (typeof navigator !== 'undefined' && 'contacts' in navigator && navigator.contacts?.select) {
      try {
        await navigator.contacts.select(['name'], { multiple: false });
        updateOne('contacts', 'granted');
        return;
      } catch {
        updateOne('contacts', 'denied');
        return;
      }
    }
    // Pas supporté en web : on marque comme "préparé pour mobile"
    updateOne('contacts', 'unsupported');
  };

  const handleFinish = async () => {
    setBusy(true);
    await onFinish();
    setBusy(false);
  };

  const items = [
    {
      key: 'notifications', icon: Bell, title: 'Notifications',
      desc: 'Sois alerté des messages, likes et nouvelles offres de recruteurs.',
      onClick: requestNotifications,
    },
    {
      key: 'contacts', icon: Users, title: 'Accès aux contacts',
      desc: 'Retrouve plus facilement tes amis déjà sur Yatsai.',
      onClick: requestContacts,
    },
    {
      key: 'microphone', icon: Mic, title: 'Microphone',
      desc: 'Recherche vocale et messages audio.',
      onClick: requestMicrophone,
    },
    {
      key: 'camera', icon: Video, title: 'Caméra',
      desc: 'Pour filmer et publier tes performances directement depuis l\'app.',
      onClick: requestCamera,
    },
    {
      key: 'location', icon: PinIcon, title: 'Localisation',
      desc: 'Trouve les athlètes et recruteurs proches de toi.',
      onClick: requestLocation,
    },
  ];

  const StatusBadge = ({ s }) => {
    if (s === 'granted') return (
      <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-md"
        style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: C.green }}>
        ✓ AUTORISÉ
      </span>
    );
    if (s === 'denied') return (
      <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-md"
        style={{ backgroundColor: 'rgba(255,71,87,0.15)', color: C.red }}>
        ✗ REFUSÉ
      </span>
    );
    if (s === 'requesting') return (
      <Loader2 size={14} className="animate-spin" style={{ color: C.gold }} />
    );
    if (s === 'unsupported') return (
      <span className="text-[10px] font-mono px-2 py-1 rounded-md"
        style={{ backgroundColor: C.surface2, color: C.textMute }}>
        APP MOBILE
      </span>
    );
    return null;
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto"
      style={{ backgroundColor: C.bg }}>
      <div className="min-h-screen flex flex-col px-4 py-8 max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="text-3xl font-extrabold mb-2" style={{ color: C.text }}>
            Bienvenue sur <span style={{ color: C.gold }}>Yatsai</span> 🎉
          </div>
          <p className="text-sm" style={{ color: C.textDim }}>
            Quelques autorisations pour profiter pleinement de l'app.
          </p>
        </div>

        <div className="flex flex-col gap-2 mb-6">
          {items.map(it => {
            const s = status[it.key];
            const Icon = it.icon;
            const disabled = s === 'granted' || s === 'requesting' || s === 'unsupported';
            return (
              <button key={it.key} onClick={it.onClick} disabled={disabled}
                className="flex items-center gap-3 p-3.5 rounded-xl text-left fade-in"
                style={{
                  backgroundColor: C.surface,
                  border: `1px solid ${s === 'granted' ? C.green : s === 'denied' ? 'rgba(255,71,87,0.3)' : C.border}`,
                  opacity: disabled && s !== 'granted' ? 0.7 : 1,
                }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: C.goldSoft, color: C.gold }}>
                  <Icon size={18} strokeWidth={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold mb-0.5" style={{ color: C.text }}>{it.title}</div>
                  <div className="text-[11px] leading-relaxed" style={{ color: C.textDim }}>{it.desc}</div>
                </div>
                <div className="flex-shrink-0">
                  <StatusBadge s={s} />
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-xl p-3 mb-6 flex items-start gap-2"
          style={{ backgroundColor: C.goldSoft, border: `1px solid ${C.borderGold}` }}>
          <AlertTriangle size={13} style={{ color: C.gold }} className="mt-0.5 flex-shrink-0" />
          <p className="text-[11px] leading-relaxed" style={{ color: C.textDim }}>
            Tu peux modifier ces choix à tout moment dans les paramètres de ton navigateur.
            Si tu refuses, certaines fonctionnalités (vocal, photo, géolocalisation) ne marcheront pas.
          </p>
        </div>

        <button onClick={handleFinish} disabled={busy}
          className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 mt-auto"
          style={{ backgroundColor: C.gold, color: C.bg, opacity: busy ? 0.6 : 1 }}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : null}
          Continuer vers l'app
        </button>
        <button onClick={handleFinish} disabled={busy}
          className="text-xs mt-3 mb-4"
          style={{ color: C.textMute }}>
          Plus tard
        </button>
      </div>
    </div>
  );
}

// ═══ FOLLOWS LIST MODAL ═════════════════════════════════════════════
function FollowsListModal({ userId, kind, currentUserId, myFollowing,
                             onClose, onLoadList, onSelectProfile, onFollow, onUnfollow }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancel = false;
    setLoading(true);
    (async () => {
      const list = await onLoadList(userId, kind);
      if (cancel) return;
      setProfiles(list);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [userId, kind]);

  // Realtime : patcher la liste si un des profils affichés est modifié
  useEffect(() => {
    const channel = supabase
      .channel(`follows-list-${userId}-${kind}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          const updated = payload.new;
          if (!updated?.id) return;
          setProfiles(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, kind]);

  return (
    <div className="fixed inset-0 z-[95] flex items-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}>
      <div className="w-full rounded-t-2xl flex flex-col"
        style={{ backgroundColor: C.bg, height: '80dvh', border: `1px solid ${C.border}` }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: C.border }}>
          <div className="text-base font-extrabold" style={{ color: C.text }}>
            {kind === 'followers' ? 'Abonnés' : 'Abonnements'}
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: C.surface }}>
            <X size={16} style={{ color: C.text }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin" style={{ color: C.gold }} />
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-12">
              <User size={32} style={{ color: C.textMute }} className="mx-auto mb-2" />
              <p className="text-sm" style={{ color: C.textDim }}>
                {kind === 'followers' ? 'Aucun abonné' : 'Aucun abonnement'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {profiles.map(p => {
                const isMe = p.id === currentUserId;
                const isFollowed = myFollowing.has(p.id);
                return (
                  <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl"
                    style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                    <button onClick={() => { onSelectProfile(p); onClose(); }}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      <Avatar profile={p} size={44} ringColor={C.gold} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate flex items-center gap-1.5" style={{ color: C.text }}>
                          {p.full_name || 'Utilisateur'}
                          {p.verified && <BadgeCheck size={12} fill={C.gold} stroke={C.bg} strokeWidth={2.5} />}
                        </div>
                        <div className="text-[11px] truncate" style={{ color: C.textDim }}>
                          {p.is_recruiter ? `💼 ${p.organization || 'Recruteur'}` : '⚽ Athlète'}
                        </div>
                      </div>
                    </button>
                    {!isMe && (
                      <button onClick={() => isFollowed ? onUnfollow(p.id) : onFollow(p.id)}
                        className="px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0"
                        style={{
                          backgroundColor: isFollowed ? 'transparent' : C.gold,
                          color: isFollowed ? C.gold : C.bg,
                          border: `1.5px solid ${C.gold}`,
                        }}>
                        {isFollowed ? 'Suivi' : 'Suivre'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══ REPORT MODAL ═══════════════════════════════════════════════════
const REPORT_REASONS = [
  { id: 'spam',          label: 'Spam ou contenu commercial',    icon: '📢' },
  { id: 'harassment',    label: 'Harcèlement ou menaces',        icon: '😠' },
  { id: 'inappropriate', label: 'Contenu inapproprié',           icon: '🚫' },
  { id: 'violence',      label: 'Violence ou contenu choquant',  icon: '⚠️' },
  { id: 'fake',          label: 'Faux compte / usurpation',      icon: '🎭' },
  { id: 'other',         label: 'Autre',                         icon: '📝' },
];

function ReportModal({ targetType, targetId, targetLabel, onClose, onSubmit }) {
  const [reason, setReason] = useState(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason) { setError('Choisis un motif'); return; }
    setError(''); setSubmitting(true);
    const { error: err } = await onSubmit({ targetType, targetId, reason, description: description.trim() || null });
    setSubmitting(false);
    if (err) {
      // Si déjà signalé (UNIQUE constraint), message clair
      if (err.includes('duplicate') || err.includes('unique')) {
        setError('Tu as déjà signalé ce contenu.');
      } else {
        setError(err);
      }
      return;
    }
    setDone(true);
    setTimeout(onClose, 1800);
  };

  const titleText = targetType === 'user' ? 'Signaler ce compte' : 'Signaler cette vidéo';

  return (
    <div className="fixed inset-0 z-[95] flex items-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}>
      <div className="w-full rounded-t-2xl flex flex-col"
        style={{ backgroundColor: C.bg, maxHeight: '85dvh', border: `1px solid ${C.border}` }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: C.border }}>
          <div className="flex items-center gap-2">
            <Flag size={16} style={{ color: C.red }} />
            <div className="text-base font-extrabold" style={{ color: C.text }}>{titleText}</div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: C.surface }}>
            <X size={16} style={{ color: C.text }} />
          </button>
        </div>

        {done ? (
          <div className="px-6 py-12 text-center">
            <CheckCircle2 size={48} style={{ color: C.green }} className="mx-auto mb-3" />
            <h3 className="text-lg font-extrabold mb-1" style={{ color: C.text }}>Signalement envoyé</h3>
            <p className="text-sm" style={{ color: C.textDim }}>
              Notre équipe va examiner ton signalement.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {targetLabel && (
                <div className="text-xs mb-3" style={{ color: C.textDim }}>
                  Cible : <span style={{ color: C.text }}>{targetLabel}</span>
                </div>
              )}

              <div className="text-[10px] font-semibold mb-2" style={{ color: C.gold }}>
                Motif du signalement
              </div>
              <div className="flex flex-col gap-1.5 mb-4">
                {REPORT_REASONS.map(r => {
                  const active = reason === r.id;
                  return (
                    <button key={r.id} onClick={() => setReason(r.id)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm"
                      style={{
                        backgroundColor: active ? C.goldSoft : C.surface,
                        color: active ? C.gold : C.text,
                        border: `1px solid ${active ? C.gold : C.border}`,
                      }}>
                      <span className="text-base">{r.icon}</span>
                      <span className="flex-1 font-medium">{r.label}</span>
                      {active && <CheckCircle2 size={14} fill={C.gold} stroke={C.bg} />}
                    </button>
                  );
                })}
              </div>

              <div className="text-[10px] font-semibold mb-2" style={{ color: C.gold }}>
                Détails (facultatif)
              </div>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                rows={3} maxLength={1000}
                placeholder="Décris ce qui pose problème…"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
              <div className="text-[10px] mt-1 text-right" style={{ color: C.textMute }}>
                {description.length}/1000
              </div>

              {error && (
                <div className="mt-3 px-3 py-2 rounded-lg text-xs"
                  style={{ backgroundColor: 'rgba(255,71,87,0.12)', color: C.red, border: `1px solid ${C.red}` }}>
                  {error}
                </div>
              )}

              <div className="mt-4 flex items-start gap-2 px-3 py-2 rounded-lg"
                style={{ backgroundColor: 'rgba(255,184,0,0.08)', border: `1px solid ${C.borderGold}` }}>
                <AlertTriangle size={12} style={{ color: C.gold }} className="mt-0.5 flex-shrink-0" />
                <p className="text-[11px] leading-relaxed" style={{ color: C.textDim }}>
                  Les signalements abusifs peuvent entraîner des restrictions sur ton compte.
                </p>
              </div>
            </div>

            <div className="px-4 py-3 border-t" style={{ borderColor: C.border }}>
              <button onClick={handleSubmit} disabled={!reason || submitting}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                style={{
                  backgroundColor: !reason || submitting ? 'rgba(255,71,87,0.4)' : C.red,
                  color: C.text,
                }}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Flag size={14} />}
                {submitting ? 'Envoi…' : 'Envoyer le signalement'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══ SIGNED ATHLETES LIST MODAL ═════════════════════════════════════
// Liste des athlètes signés (status='signe') par un recruteur
function SignedAthletesListModal({ recruiterId, onClose, onLoadSignedAthletes, onSelectProfile }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!recruiterId) return;
    let cancel = false;
    setLoading(true);
    (async () => {
      const list = await onLoadSignedAthletes(recruiterId);
      if (!cancel) {
        setProfiles(list);
        setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [recruiterId]);

  return (
    <div className="fixed inset-0 z-[95] flex items-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}>
      <div className="w-full rounded-t-2xl flex flex-col"
        style={{ backgroundColor: C.bg, height: '80dvh', border: `1px solid ${C.border}` }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: C.border }}>
          <div className="flex items-center gap-2">
            <span className="text-base">🏆</span>
            <div className="text-base font-extrabold" style={{ color: C.text }}>Athlètes signés</div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: C.surface }}>
            <X size={16} style={{ color: C.text }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin" style={{ color: C.gold }} />
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-12">
              <Star size={32} style={{ color: C.textMute }} className="mx-auto mb-2" />
              <p className="text-sm" style={{ color: C.textDim }}>Aucun athlète signé pour le moment</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {profiles.map(p => (
                <button key={p.id} onClick={() => { onSelectProfile(p); onClose(); }}
                  className="flex items-center gap-3 p-2.5 rounded-xl text-left"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.borderGold}` }}>
                  <Avatar profile={p} size={44} ringColor={C.gold} ringWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate flex items-center gap-1.5" style={{ color: C.text }}>
                      {p.full_name || 'Athlète'}
                      {p.verified && <BadgeCheck size={12} fill={C.gold} stroke={C.bg} strokeWidth={2.5} />}
                    </div>
                    <div className="text-[11px] truncate" style={{ color: C.textDim }}>
                      {SPORTS.find(s => s.id === p.sport)?.icon || '🏆'} {SPORTS.find(s => s.id === p.sport)?.label || p.sport || 'Sport'}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold flex-shrink-0 px-2 py-1 rounded-md"
                    style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: C.green }}>
                    ✓ SIGNÉ
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══ USER PROFILE VIEW (Supabase) ═══════════════════════════════════
// Overlay qui affiche un vrai profil utilisateur (athlète ou recruteur)
// avec ses vidéos publiées + boutons Contacter / Shortlist.
function UserProfileView({ profile: profileProp, currentUserId, isViewerRecruiter, shortlistStatus,
                           isFollowing, onFollow, onUnfollow, onLoadFollowCounts, onShowFollowList,
                           onClose, onContact, onAddToShortlist, onRemoveFromShortlist, onPlayVideo,
                           onReport, onLoadSignedPosts, onSelectProfile, onLoadSignedCount,
                           onShowSignedAthletes, onDeleteVideo }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [signedCount, setSignedCount] = useState(0);
  const [criteriaOpen, setCriteriaOpen] = useState(false); // critères de recrutement masqués par défaut
  const [playingVideo, setPlayingVideo] = useState(null); // vidéo en lecture depuis le profil visité
  // Copie live du profil visité — patchée en temps réel via Realtime
  const [liveProfile, setLiveProfile] = useState(profileProp);
  // Se resynchronise dès que le profil reçu change (y compris quand openProfile
  // remplace l'objet partiel par le profil COMPLET avec le même id → bannière, bio…).
  useEffect(() => {
    if (!profileProp) return;
    setLiveProfile(prev =>
      (prev && prev.id === profileProp.id) ? { ...prev, ...profileProp } : profileProp
    );
  }, [profileProp]);
  useEffect(() => {
    if (!profileProp?.id) return;
    const channel = supabase
      .channel(`user-profile-${profileProp.id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles',
          filter: `id=eq.${profileProp.id}` },
        (payload) => {
          if (payload.new) setLiveProfile(prev => ({ ...prev, ...payload.new }));
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profileProp?.id]);
  const profile = liveProfile || profileProp;

  useEffect(() => {
    if (!profile?.id) return;
    let cancel = false;
    setLoading(true);
    (async () => {
      const isRecruiter = !!profile.is_recruiter;
      const [vRes, c, sc] = await Promise.all([
        // Pas de vidéos pour les recruteurs (ils ne peuvent pas publier)
        isRecruiter
          ? Promise.resolve({ data: [] })
          : supabase.from('videos').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
        onLoadFollowCounts ? onLoadFollowCounts(profile.id) : Promise.resolve({ followers: 0, following: 0 }),
        isRecruiter && onLoadSignedCount ? onLoadSignedCount(profile.id) : Promise.resolve(0),
      ]);
      if (cancel) return;
      if (vRes.error) console.error('Erreur chargement vidéos profil:', vRes.error);
      setVideos(vRes.data || []);
      setCounts(c);
      setSignedCount(sc);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [profile?.id, isFollowing]); // recharge quand follow change

  // Realtime : mettre à jour le compteur signés si une signing est confirmée
  useEffect(() => {
    if (!profile?.is_recruiter || !onLoadSignedCount) return;
    const channel = supabase
      .channel(`signed-count-${profile.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'shortlist',
          filter: `recruiter_id=eq.${profile.id}` },
        async () => {
          const sc = await onLoadSignedCount(profile.id);
          setSignedCount(sc);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, profile?.is_recruiter]);

  // Realtime : recharger les compteurs followers/following en temps réel
  useEffect(() => {
    if (!profile?.id || !onLoadFollowCounts) return;
    const reload = async () => {
      const c = await onLoadFollowCounts(profile.id);
      setCounts(c);
    };
    const channel = supabase
      .channel(`follow-counts-${profile.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'follows',
          filter: `following_id=eq.${profile.id}` }, reload)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'follows',
          filter: `follower_id=eq.${profile.id}` }, reload)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  if (!profile) return null;
  const sport = SPORTS.find(s => s.id === profile.sport);
  const isOwn = profile.id === currentUserId;
  const isShortlisted = !!shortlistStatus;
  const STATUS_LABELS = {
    en_attente: 'En attente',
    essai_en_cours: 'Essai en cours',
    essai_termine: 'Essai terminé',
    signe: 'Signé',
  };
  const canShortlist = isViewerRecruiter && !profile.is_recruiter && !isOwn;

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto slide-in-right"
      style={{ backgroundColor: C.bg }}>
      {/* Bannière (ou gradient par défaut) */}
      <div className="relative" style={{ height: 160 }}>
        {profile.banner_url ? (
          <img loading="lazy" decoding="async" src={profile.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${C.surface2} 0%, ${C.surface} 100%)` }} />
        )}
        <div className="absolute inset-0"
          style={{ background: `linear-gradient(180deg, rgba(8,15,32,0.2) 0%, ${C.bg} 100%)` }} />
      </div>

      {/* Bouton retour fixe en haut à gauche */}
      <button onClick={onClose}
        className="fixed top-12 left-4 z-[91] w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'rgba(8,15,32,0.7)', backdropFilter: 'blur(10px)', border: `1px solid ${C.border}` }}>
        <ArrowLeft size={18} style={{ color: C.text }} />
      </button>

      {/* Bouton Shortlist (recruteur regardant un athlète) — top-right fixe */}
      {canShortlist && (
        <button onClick={() => isShortlisted ? onRemoveFromShortlist?.(profile.id) : onAddToShortlist?.(profile.id)}
          className="fixed top-12 right-4 z-[91] px-3 h-10 rounded-full flex items-center gap-1.5"
          style={{
            backgroundColor: isShortlisted ? C.gold : 'rgba(8,15,32,0.7)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${isShortlisted ? C.gold : C.border}`,
            color: isShortlisted ? C.bg : C.text,
          }}>
          <Star size={16} fill={isShortlisted ? C.bg : 'transparent'} strokeWidth={2.2} />
          <span className="text-xs font-bold">
            {isShortlisted ? STATUS_LABELS[shortlistStatus] : 'Shortlist'}
          </span>
        </button>
      )}

      {/* Ligne avatar + actions (style X) : l'avatar chevauche la bannière, les actions sont à droite */}
      <div className="px-4 flex items-start justify-between" style={{ marginTop: -48 }}>
        <div className="rounded-full overflow-hidden fade-in"
          style={{ width: 96, height: 96, backgroundColor: C.surface, border: `4px solid ${C.bg}` }}>
          {profile.avatar_url ? (
            <img loading="lazy" decoding="async" src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl font-extrabold"
              style={{ color: C.gold }}>
              {(profile.full_name || '?').charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Actions à droite (Message + Suivre), comme sur X */}
        {!isOwn && (
          <div className="flex items-center gap-2 mt-12">
            <button onClick={onContact}
              aria-label="Message"
              className="w-10 h-10 rounded-full flex items-center justify-center active:opacity-70"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}>
              <MessageCircle size={16} strokeWidth={2.4} />
            </button>
            <button onClick={() => isFollowing ? onUnfollow?.(profile.id) : onFollow?.(profile.id)}
              className="px-4 h-10 rounded-full text-sm font-extrabold"
              style={{
                backgroundColor: isFollowing ? 'transparent' : C.text,
                color: isFollowing ? C.text : C.bg,
                border: `1.5px solid ${isFollowing ? C.border : C.text}`,
              }}>
              {isFollowing ? 'Suivi' : 'Suivre'}
            </button>
          </div>
        )}
      </div>

      {/* Bloc identité aligné à gauche (style X) */}
      <div className="px-4 mt-3 fade-in">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <h1 className="text-xl font-extrabold" style={{ color: C.text }}>
            {profile.full_name || 'Utilisateur'}
          </h1>
          {profile.verified && <BadgeCheck size={18} fill={C.gold} stroke={C.bg} strokeWidth={2.5} />}
          {profile.nationality && (
            <span className="text-xs" style={{ color: C.textDim }}>
              🌐 {profile.nationality}
            </span>
          )}
          {/* Âge — masqué si le réglage de confidentialité « Masquer mon âge » est actif */}
          {!profile.hide_age && (computeAge(profile.birthdate) ?? profile.age) && (
            <span className="text-xs" style={{ color: C.textDim }}>
              · {computeAge(profile.birthdate) ?? profile.age} ans
            </span>
          )}
        </div>

        {/* Rôle + (sport pour athlètes uniquement) */}
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          {isObserverRole(profile) ? (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1"
              style={{ backgroundColor: C.goldSoft, color: C.gold }}>
              <Eye size={10} strokeWidth={2.4} />
              Observateur
            </span>
          ) : profile.is_recruiter ? (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1"
              style={{ backgroundColor: C.goldSoft, color: C.gold }}>
              <Briefcase size={10} strokeWidth={2.4} />
              Recruteur
            </span>
          ) : (
            <>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1"
                style={{ backgroundColor: C.goldSoft, color: C.gold }}>
                <Star size={10} strokeWidth={2.4} />
                Athlète
              </span>
              {/* Niveau juste à côté de la mention Athlète, si affichable */}
              {isLevelDisplayable(profile) && <LevelChip level={profile.level} />}
            </>
          )}
          {sport && !profile.is_recruiter && !isObserverRole(profile) && (
            <span className="text-xs" style={{ color: C.textDim }}>
              {sport.icon} {sport.label}
            </span>
          )}
        </div>

        {profile.is_recruiter ? (
          // Recruteur : juste l'organisation
          profile.organization && (
            <div className="text-sm font-semibold" style={{ color: C.gold }}>
              {profile.organization}
            </div>
          )
        ) : (
          <>
            {(profile.position || profile.club) && (
              <div className="text-xs" style={{ color: C.textDim }}>
                {profile.position && profile.position}
                {profile.club && ` · ${profile.club}`}
              </div>
            )}
            {/* Localisation — masquée si le réglage « Masquer ma localisation » est actif */}
            {!profile.hide_location && (profile.city || profile.region || profile.country) && (
              <div className="text-xs mt-0.5" style={{ color: C.textDim }}>
                📍 {[profile.city, profile.region, profile.country].filter(Boolean).join(' · ')}
              </div>
            )}
          </>
        )}

        {/* Stats inline style X : 115 abonnements · 17 M abonnés */}
        <div className="flex items-center gap-4 mt-3 text-sm flex-wrap">
          <button onClick={() => onShowFollowList?.(profile.id, 'following')}
            className="active:opacity-60">
            <strong style={{ color: C.text }}>{counts.following}</strong>
            <span className="ml-1" style={{ color: C.textDim }}>Abonnements</span>
          </button>
          <button onClick={() => onShowFollowList?.(profile.id, 'followers')}
            className="active:opacity-60">
            <strong style={{ color: C.text }}>{counts.followers}</strong>
            <span className="ml-1" style={{ color: C.textDim }}>Abonnés</span>
          </button>
          {profile.is_recruiter ? (
            <button onClick={() => onShowSignedAthletes?.(profile.id)}
              className="active:opacity-60">
              <strong style={{ color: C.gold }}>{signedCount}</strong>
              <span className="ml-1" style={{ color: C.textDim }}>🏆 Signés</span>
            </button>
          ) : (
            <span>
              <strong style={{ color: C.text }}>{videos.length}</strong>
              <span className="ml-1" style={{ color: C.textDim }}>Vidéos</span>
            </span>
          )}
        </div>
      </div>

      {/* Liens externes — recruteurs uniquement (les athlètes n'en affichent pas) */}
      {profile.is_recruiter && profile.social_links && Object.keys(profile.social_links).length > 0 && (
        <div className="px-4 mt-3">
          <SocialLinksDisplay links={profile.social_links} />
        </div>
      )}

      <div className="h-4" />

      {/* Critères de recrutement (recruteurs visités uniquement) — dépliable */}
      {profile.is_recruiter && (
        (profile.recruiting_gender || (profile.recruiting_levels && profile.recruiting_levels.length > 0)
          || profile.recruiting_age_min != null || profile.recruiting_age_max != null) && (
          <div className="px-4 mb-4">
            <button
              onClick={() => setCriteriaOpen(o => !o)}
              aria-expanded={criteriaOpen}
              className="w-full rounded-xl px-3 py-2.5 flex items-center justify-between active:opacity-80"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.borderGold}` }}>
              <span className="text-xs font-semibold" style={{ color: C.gold }}>
                🎯 Critères de recrutement
              </span>
              <ChevronDown size={16}
                style={{ color: C.gold, transform: criteriaOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </button>
            {criteriaOpen && (
              <div className="rounded-xl p-3 mt-1.5 fade-in"
                style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                <div className="flex flex-col gap-2 text-xs">
                  {profile.recruiting_gender && (
                    <div style={{ color: C.text }}>
                      <span style={{ color: C.textDim }}>Genre : </span>
                      {profile.recruiting_gender === 'all' ? 'Tous'
                        : profile.recruiting_gender === 'M' ? '♂ Hommes'
                        : profile.recruiting_gender === 'F' ? '♀ Femmes'
                        : '⚧ Autre'}
                    </div>
                  )}
                  {profile.recruiting_age_min != null && profile.recruiting_age_max != null && (
                    <div style={{ color: C.text }}>
                      <span style={{ color: C.textDim }}>Âge : </span>
                      {profile.recruiting_age_min} – {profile.recruiting_age_max} ans
                    </div>
                  )}
                  {profile.recruiting_levels && profile.recruiting_levels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profile.recruiting_levels.map(lv => <LevelChip key={lv} level={lv} />)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* Galerie signatures (uniquement si recruteur) */}
      {profile.is_recruiter && (
        <div className="px-4 mb-6">
          <SignedPostsGallery
            recruiterId={profile.id}
            currentUserId={currentUserId}
            onLoad={onLoadSignedPosts}
            onDelete={() => Promise.resolve({})}
            onAdd={null}
            onSelectAthlete={onSelectProfile} />
        </div>
      )}

      {/* Bouton signaler (petit, façon feed vidéo — sauf si c'est mon propre profil) */}
      {!isOwn && (
        <div className="px-4 mb-4 flex justify-center">
          <IconButton icon={Flag} label="Signaler"
            onClick={() => onReport?.('user', profile.id, profile.full_name)} />
        </div>
      )}

      {/* Liste des vidéos (athlètes uniquement — recruteurs et observateurs ne publient pas) */}
      <div className="px-4 pb-32"
        style={{ display: (profile.is_recruiter || isObserverRole(profile)) ? 'none' : undefined }}>
        <h3 className="text-xs font-semibold mb-3" style={{ color: C.gold }}>
          🎬 Vidéos publiées
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin" style={{ color: C.gold }} />
          </div>
        ) : videos.length === 0 ? (
          <div className="rounded-xl py-10 px-6 text-center"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            <Camera size={28} style={{ color: C.textMute }} className="mx-auto mb-2" />
            <p className="text-xs" style={{ color: C.textDim }}>Aucune vidéo publiée</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {videos.map(v => (
              <OwnVideoThumb key={v.id} video={v} onPlay={setPlayingVideo}
                onDelete={isOwn ? onDeleteVideo : null} />
            ))}
          </div>
        )}
      </div>

      {playingVideo && (
        <YouTubePlayer video={playingVideo} onClose={() => setPlayingVideo(null)} />
      )}
    </div>
  );
}

// ═══ ATHLETE PROFILE (slide-in) ═════════════════════════════════════
function AthleteProfile({ athlete, onClose, isRecruiter, shortlisted, onToggleShortlist, onMessage }) {
  const [following, setFollowing] = useState(false);
  if (!athlete) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto slide-in-right" style={{ backgroundColor: C.bg }}>
      <div className="relative" style={{ height: '38vh' }}>
        {athlete.poster && <img loading="lazy" decoding="async" src={athlete.poster} alt={athlete.name} className="w-full h-full object-cover" />}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(8,15,32,1) 0%, rgba(8,15,32,0.3) 50%, rgba(8,15,32,0.5) 100%)' }} />
        <button onClick={onClose}
          className="absolute top-12 left-4 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(8,15,32,0.7)', backdropFilter: 'blur(10px)', border: `1px solid ${C.border}` }}>
          <X size={18} style={{ color: C.text }} />
        </button>

        {isRecruiter && (
          <button onClick={onToggleShortlist}
            className="absolute top-12 right-4 w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: shortlisted ? C.gold : 'rgba(8,15,32,0.7)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${shortlisted ? C.gold : C.border}`,
            }}>
            <Star size={18} fill={shortlisted ? C.bg : 'transparent'}
              style={{ color: shortlisted ? C.bg : C.text }} strokeWidth={2.4} />
          </button>
        )}

        <div className="absolute bottom-0 left-4 right-4 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-extrabold" style={{ color: C.text }}>{athlete.name}</h2>
            {athlete.verified && <BadgeCheck size={20} fill={C.gold} stroke={C.bg} strokeWidth={2.5} />}
          </div>
          <span className="font-mono text-xs" style={{ color: C.gold }}>{athlete.handle}</span>
          <div className="text-sm mt-1" style={{ color: C.text }}>
            {athlete.icon} {athlete.position} · {athlete.club} · {athlete.age} ans
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 mb-4">
        <div className="rounded-xl py-2.5 flex items-center justify-around"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <div className="text-center">
            <div className="text-base font-extrabold" style={{ color: C.text }}>2.4K</div>
            <div className="text-[10px]" style={{ color: C.textDim }}>Abonnés</div>
          </div>
          <div className="w-px h-7" style={{ backgroundColor: C.border }} />
          <div className="text-center">
            <div className="text-base font-extrabold" style={{ color: C.text }}>186</div>
            <div className="text-[10px]" style={{ color: C.textDim }}>Abonnements</div>
          </div>
          <div className="w-px h-7" style={{ backgroundColor: C.border }} />
          <div className="text-center">
            <div className="text-base font-extrabold" style={{ color: C.text }}>{athlete.views}</div>
            <div className="text-[10px]" style={{ color: C.textDim }}>Vues</div>
          </div>
        </div>
      </div>

      <div className="px-4 grid grid-cols-2 gap-2 mb-4">
        {athlete.stats?.map((s, i) => (
          <div key={i} className="rounded-xl p-3 text-center"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            <div className="text-lg font-bold" style={{ color: C.gold }}>{s.v}</div>
            <div className="text-[10px]" style={{ color: C.textDim }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div className="px-4 mb-4">
        <div className="rounded-xl p-3 flex items-center gap-2.5"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.borderGold}` }}>
          <Sparkles size={16} style={{ color: C.gold }} />
          <div className="flex-1">
            <div className="text-xs font-semibold" style={{ color: C.text }}>
              Vérifié par l'IA Yatsai
            </div>
            <div className="text-[10px]" style={{ color: C.textDim }}>
              Score : <span style={{ color: C.gold }}>{athlete.rating}/10</span> · {athlete.detection?.confidence ?? 95}% de confiance
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-32 flex flex-col gap-2">
        <GoldButton variant="solid" icon={MessageCircle} fullWidth onClick={onMessage}>
          Contacter ce joueur
        </GoldButton>
        <GoldButton variant={following ? 'solid' : 'outline'} fullWidth
          onClick={() => setFollowing(!following)}>
          {following ? 'Suivi' : 'Suivre'}
        </GoldButton>
      </div>
    </div>
  );
}

// ─── Helper : upload image vers Supabase Storage ────────────────
// Redimensionne + compresse une image côté client avant upload.
// Évite d'envoyer des photos de 5 Mo : on borne la largeur et on ré-encode en JPEG.
// maxW : largeur max (avatars ~512, bannières ~1280). quality : 0..1.
async function compressImage(file, maxW, quality = 0.82) {
  // Les GIF/SVG ne sont pas re-compressés (animation / vectoriel)
  if (!file.type.startsWith('image/') || /gif|svg/.test(file.type)) return file;
  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = dataUrl;
    });
    const scale = Math.min(1, maxW / (img.width || maxW));
    // Si déjà petite ET légère (<300 Ko), on garde l'original
    if (scale >= 1 && file.size < 300 * 1024) return file;
    const w = Math.round((img.width || maxW) * scale);
    const h = Math.round((img.height || maxW) * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) return file;
    // Si la compression n'a rien gagné, on garde l'original
    if (blob.size >= file.size) return file;
    return new File([blob], (file.name || 'image').replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file; // en cas d'échec, on retombe sur le fichier original
  }
}

async function uploadImage(file, bucket, userId) {
  if (!file || !userId) return { error: 'Fichier ou utilisateur manquant' };
  // Compression adaptée au type de visuel
  const maxW = bucket === 'banners' ? 1280 : 512;
  const compressed = await compressImage(file, maxW, 0.82);
  const ext = (compressed.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from(bucket)
    .upload(path, compressed, { cacheControl: '3600', upsert: false, contentType: compressed.type });
  if (upErr) return { error: upErr.message };
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

// ═══ PROFIL EDITOR (modale) ═════════════════════════════════════
// Affichage des liens externes (réseaux sociaux + apps fitness)
function SocialLinksDisplay({ links }) {
  if (!links || Object.keys(links).length === 0) return null;
  const items = SOCIAL_LINK_PLATFORMS.filter(p => links[p.key] && String(links[p.key]).trim());
  if (items.length === 0) return null;
  return (
    <div className="rounded-xl p-3 mb-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
      <div className="text-[10px] font-mono tracking-widest mb-2" style={{ color: C.gold }}>🔗 LIENS</div>
      <div className="flex flex-wrap gap-2">
        {items.map(p => {
          const url = String(links[p.key]).trim();
          const href = /^https?:\/\//i.test(url) ? url : 'https://' + url;
          return (
            <a key={p.key} href={href} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: C.bg, color: C.text, border: `1px solid ${C.border}` }}>
              <span className="text-base">{p.icon}</span>
              <span>{p.label}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ─── PARTAGE PROFIL (QR + lien) ──────────────────────────────────
// Modal simple : QR code + lien copiable (sans partage via réseaux sociaux).
function ShareProfileModal({ userProfile, onClose }) {
  const profileUrl = `https://yatsai.app/u/${userProfile?.id || ''}`;
  const [copied, setCopied] = useState(false);
  const [QRComp, setQRComp] = useState(null);

  useEffect(() => {
    let cancel = false;
    import('qrcode.react').then(mod => {
      if (!cancel) setQRComp(() => mod.QRCodeSVG || mod.default);
    });
    return () => { cancel = true; };
  }, []);

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(profileUrl); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = profileUrl;
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}>
      <div className="w-full rounded-t-2xl flex flex-col"
        style={{ backgroundColor: C.bg, maxHeight: '90dvh', border: `1px solid ${C.border}` }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: C.border }}>
          <div className="flex items-center gap-2">
            <Share2 size={16} style={{ color: C.gold }} />
            <div className="text-base font-extrabold" style={{ color: C.text }}>Partager mon compte</div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: C.surface }}>
            <X size={16} style={{ color: C.text }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
          {/* QR Code */}
          <div className="rounded-xl p-5 flex flex-col items-center"
            style={{ backgroundColor: '#FFFFFF' }}>
            {QRComp ? (
              <QRComp value={profileUrl} size={220} bgColor="#FFFFFF" fgColor="#080F20" level="M" />
            ) : (
              <div className="w-[220px] h-[220px] flex items-center justify-center">
                <Loader2 size={20} className="animate-spin" style={{ color: C.bg }} />
              </div>
            )}
            <p className="text-xs mt-3 text-center font-semibold" style={{ color: '#080F20' }}>
              Scanne pour ouvrir mon profil
            </p>
          </div>

          {/* Lien à copier */}
          <div>
            <div className="text-[10px] font-mono tracking-widest mb-2" style={{ color: C.gold }}>
              LIEN DE MON PROFIL
            </div>
            <div className="flex gap-2">
              <input type="text" readOnly value={profileUrl}
                onFocus={(e) => e.target.select()}
                className="flex-1 px-3 py-2.5 rounded-lg text-xs outline-none font-mono"
                style={{ backgroundColor: C.surface, color: C.gold, border: `1px solid ${C.borderGold}` }} />
              <button onClick={copyLink}
                className="px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1"
                style={{ backgroundColor: copied ? C.green : C.gold, color: C.bg }}>
                {copied ? '✓ Copié' : 'Copier'}
              </button>
            </div>
            <p className="text-[10px] mt-2" style={{ color: C.textMute }}>
              💡 Tu peux coller ce lien dans ta bio Instagram, TikTok, ton message WhatsApp, etc.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Définitions des liens externes ────────────────────────────
const SOCIAL_LINK_PLATFORMS = [
  { key: 'linkedin',  label: 'LinkedIn',          icon: 'in', placeholder: 'https://linkedin.com/in/…' },
  { key: 'youtube',   label: 'YouTube',           icon: '▶',  placeholder: 'https://youtube.com/@…' },
  { key: 'instagram', label: 'Instagram',         icon: '📷', placeholder: 'https://instagram.com/…' },
  { key: 'tiktok',    label: 'TikTok',            icon: '🎵', placeholder: 'https://tiktok.com/@…' },
  { key: 'x',         label: 'X (Twitter)',       icon: '𝕏',  placeholder: 'https://x.com/…' },
  { key: 'facebook',  label: 'Facebook',          icon: 'ⓕ',  placeholder: 'https://facebook.com/…' },
  { key: 'snapchat',  label: 'Snapchat',          icon: '👻', placeholder: 'snap username ou lien' },
  { key: 'whatsapp',  label: 'WhatsApp',          icon: '💬', placeholder: 'https://wa.me/336…' },
  { key: 'telegram',  label: 'Telegram',          icon: '✈️', placeholder: 'https://t.me/…' },
  { key: 'twitch',    label: 'Twitch',            icon: '🎮', placeholder: 'https://twitch.tv/…' },
  { key: 'strava',    label: 'Strava',            icon: '🏃', placeholder: 'https://strava.com/athletes/…' },
  { key: 'nike',      label: 'Nike Training',     icon: '✔️', placeholder: 'Lien partagé Nike' },
  { key: 'freeletics',label: 'Freeletics',        icon: '🔥', placeholder: 'Lien partagé Freeletics' },
  { key: 'adidas',    label: 'Adidas Running',    icon: '🏅', placeholder: 'Lien partagé Adidas Running' },
  { key: 'fiton',     label: 'FitOn',             icon: '💪', placeholder: 'Lien partagé FitOn' },
];

// ─── Rappel "début de saison" inline dans le profil (août → 15 septembre)
function ProfileSeasonReminder({ userProfile, onEdit }) {
  if (!userProfile) return null;
  // N'apparaît que dans la fenêtre temporelle ET si season_start_month n'a pas
  // été défini par l'utilisateur (valeur par défaut = null après refonte).
  if (!isSeasonReminderWindow()) return null;
  if (userProfile.season_start_month) return null;
  const season = currentSeasonLabel(9);
  return (
    <div className="mx-4 mb-3 rounded-xl p-3 flex items-start gap-2 fade-in"
      style={{ backgroundColor: 'rgba(255,184,0,0.1)', border: `1px solid ${C.borderGold}` }}>
      <span className="text-base flex-shrink-0">📅</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-extrabold mb-0.5" style={{ color: C.text }}>
          Saison {season} : pense à confirmer ta rentrée
        </div>
        <p className="text-[11px] leading-relaxed" style={{ color: C.textDim }}>
          Précise ton <strong style={{ color: C.text }}>club actuel</strong>,
          ta <strong style={{ color: C.text }}>localisation</strong> et le
          <strong style={{ color: C.text }}> mois de début</strong> de ta saison pour
          que les catégories d'âge soient à jour.
        </p>
        <button onClick={onEdit}
          className="mt-2 px-3 py-1.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5"
          style={{ backgroundColor: C.gold, color: C.bg }}>
          <Edit3 size={11} strokeWidth={2.6} />
          Mettre à jour
        </button>
      </div>
    </div>
  );
}

// ─── Section sécurité du compte (changement email / mot de passe) ──
function AccountSecuritySection() {
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState(null); // 'idle' | 'pending' | 'sent' | 'error'
  const [emailMsg, setEmailMsg] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwStatus, setPwStatus] = useState(null);
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!cancel) setCurrentEmail(data?.user?.email || '');
    })();
    return () => { cancel = true; };
  }, []);

  const handleChangeEmail = async () => {
    setEmailStatus('pending'); setEmailMsg('');
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setEmailStatus('error'); setEmailMsg('Email invalide'); return;
    }
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    if (error) {
      setEmailStatus('error'); setEmailMsg(error.message); return;
    }
    setEmailStatus('sent');
    setEmailMsg('Vérifie ta boîte mail (nouvelle ET ancienne adresse) pour confirmer.');
    setNewEmail('');
  };

  const handleChangePassword = async () => {
    setPwStatus('pending'); setPwMsg('');
    if (newPassword.length < 6) {
      setPwStatus('error'); setPwMsg('6 caractères minimum'); return;
    }
    if (newPassword !== confirmPassword) {
      setPwStatus('error'); setPwMsg('Les mots de passe ne correspondent pas'); return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPwStatus('error'); setPwMsg(error.message); return;
    }
    setPwStatus('sent');
    setPwMsg('Mot de passe mis à jour ✅');
    setNewPassword(''); setConfirmPassword('');
  };

  return (
    <div className="space-y-3">
      {/* Email actuel */}
      <div>
        <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: C.textDim }}>
          Email actuel
        </label>
        <input type="email" value={currentEmail} readOnly disabled
          className="w-full px-3 py-2.5 rounded-lg text-xs outline-none cursor-not-allowed"
          style={{ backgroundColor: 'rgba(15,23,42,0.5)', color: C.textDim, border: `1px solid ${C.border}` }} />
      </div>

      {/* Changement email */}
      <div>
        <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: C.textDim }}>
          Changer mon email
        </label>
        <div className="flex gap-2">
          <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
            placeholder="nouveau@email.com"
            className="flex-1 px-3 py-2.5 rounded-lg text-xs outline-none"
            style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
          <button onClick={handleChangeEmail} disabled={emailStatus === 'pending' || !newEmail.trim()}
            className="px-3 py-2.5 rounded-lg text-xs font-bold"
            style={{
              backgroundColor: emailStatus === 'pending' || !newEmail.trim() ? 'rgba(255,184,0,0.4)' : C.gold,
              color: C.bg,
            }}>
            {emailStatus === 'pending' ? '...' : 'Changer'}
          </button>
        </div>
        {emailMsg && (
          <p className="text-[10px] mt-1"
            style={{ color: emailStatus === 'error' ? C.red : C.green }}>{emailMsg}</p>
        )}
      </div>

      {/* Changement mot de passe */}
      <div>
        <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: C.textDim }}>
          Nouveau mot de passe
        </label>
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Min. 6 caractères"
          className="w-full px-3 py-2.5 rounded-lg text-xs outline-none mb-2"
          style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirmer le nouveau mot de passe"
          className="w-full px-3 py-2.5 rounded-lg text-xs outline-none"
          style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
        <button onClick={handleChangePassword} disabled={pwStatus === 'pending' || !newPassword || !confirmPassword}
          className="w-full mt-2 py-2.5 rounded-lg text-xs font-bold"
          style={{
            backgroundColor: pwStatus === 'pending' || !newPassword ? 'rgba(255,184,0,0.4)' : C.gold,
            color: C.bg,
          }}>
          {pwStatus === 'pending' ? '...' : 'Changer le mot de passe'}
        </button>
        {pwMsg && (
          <p className="text-[10px] mt-1"
            style={{ color: pwStatus === 'error' ? C.red : C.green }}>{pwMsg}</p>
        )}
      </div>
    </div>
  );
}

function ProfileEditor({ userProfile, isRecruiter, onClose, onSave }) {
  // Rôle réel (3 valeurs) pour adapter les champs affichés
  const editorRole = getUserRole(userProfile);
  const isObserverEditor = editorRole === 'observer';
  const isAthleteEditor = editorRole === 'athlete';
  // Champs NON modifiables après inscription : full_name, birthdate
  const fullName = userProfile?.full_name || ''; // lecture seule
  const birthdate = userProfile?.birthdate || ''; // lecture seule
  const computedAge = computeAge(birthdate);
  // Champs modifiables
  const [sport, setSport] = useState(userProfile?.sport || '');
  const [position, setPosition] = useState(userProfile?.position || '');
  const [club, setClub] = useState(userProfile?.club || '');
  const [organization, setOrganization] = useState(userProfile?.organization || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [country, setCountry] = useState(userProfile?.country || '');
  const [region, setRegion] = useState(userProfile?.region || '');
  const [city, setCity] = useState(userProfile?.city || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [username, setUsername] = useState(userProfile?.username || '');
  const [seasonStartMonth, setSeasonStartMonth] = useState(userProfile?.season_start_month || 9);
  const [gender, setGender] = useState(userProfile?.gender || '');
  const [nationality, setNationality] = useState(userProfile?.nationality || '');
  const [hasClubLocal, setHasClubLocal] = useState(
    userProfile?.has_club === true ? true : userProfile?.has_club === false ? false : null
  );
  const [level, setLevel] = useState(userProfile?.level || '');
  // Preuve de niveau (pour young_pro / senior_pro)
  const [levelProofFile, setLevelProofFile] = useState(null);
  const initialProofStatus = userProfile?.level_proof_status || 'none';
  const initialLevel = userProfile?.level || '';
  const proofInputRef = useRef(null);
  // Recruteur — critères de recrutement
  const [recruitingGender, setRecruitingGender] = useState(userProfile?.recruiting_gender || 'all');
  const [recruitingLevels, setRecruitingLevels] = useState(userProfile?.recruiting_levels || []);
  const [recruitingAgeMin, setRecruitingAgeMin] = useState(userProfile?.recruiting_age_min ?? '');
  const [recruitingAgeMax, setRecruitingAgeMax] = useState(userProfile?.recruiting_age_max ?? '');
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url || null);
  const [bannerUrl, setBannerUrl] = useState(userProfile?.banner_url || null);
  // Liens externes (réseaux sociaux + apps fitness)
  const [socialLinks, setSocialLinks] = useState(userProfile?.social_links || {});
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const handlePickAvatar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(''); setUploadingAvatar(true);
    const { url, error: err } = await uploadImage(file, 'avatars', userProfile.id);
    setUploadingAvatar(false);
    if (err) { setError('Avatar : ' + err); return; }
    setAvatarUrl(url);
  };

  const handlePickBanner = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(''); setUploadingBanner(true);
    const { url, error: err } = await uploadImage(file, 'banners', userProfile.id);
    setUploadingBanner(false);
    if (err) { setError('Bannière : ' + err); return; }
    setBannerUrl(url);
  };

  const handleSave = async () => {
    setError(''); setSaving(true);
    const updates = {
      // full_name et birthdate sont volontairement omis (non modifiables).
      // L'âge est recalculé en cache à partir de birthdate.
      age: computedAge,
      sport: sport || null,
      position: position.trim() || null,
      club: isRecruiter ? null : (club.trim() || null),
      organization: isRecruiter ? (organization.trim() || null) : null,
      bio: bio.trim() || null,
      country: country.trim() || null,
      region: region.trim() || null,
      city: city.trim() || null,
      phone: phone.trim() || null,
      username: username.trim() || null,
      season_start_month: seasonStartMonth,
      avatar_url: avatarUrl,
      banner_url: bannerUrl,
      social_links: socialLinks,
    };
    if (!isRecruiter) {
      updates.gender = gender || null;
      updates.nationality = nationality.trim() || null;
      updates.has_club = hasClubLocal === true ? true : hasClubLocal === false ? false : null;
      // Cohérence : si pas en club -> level=no_club, sinon le niveau choisi
      updates.club = (hasClubLocal === true && club.trim()) ? club.trim() : null;
      // Le niveau est conservé tel que choisi par l'athlète, qu'il soit en club ou non.
      updates.level = level || null;
      // ─── Gestion preuve niveau ───
      const newNeedsProof = levelRequiresProof(level);
      if (!newNeedsProof) {
        // Niveau qui ne nécessite pas de preuve → statut neutralisé
        updates.level_proof_status = 'none';
      } else if (levelProofFile) {
        // Nouvelle preuve fournie → on l'uploade et on passe en pending
        try {
          const ext = (levelProofFile.name.split('.').pop() || 'jpg').toLowerCase();
          const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(ext) ? ext : 'jpg';
          const path = `${userProfile.id}/${Date.now()}.${safeExt}`;
          const { error: upErr } = await supabase.storage
            .from('level-proofs')
            .upload(path, levelProofFile, { cacheControl: '3600', upsert: false, contentType: levelProofFile.type });
          if (upErr) {
            setError('Upload preuve : ' + upErr.message);
            setSaving(false);
            return;
          }
          updates.level_proof_url = path;
          updates.level_proof_status = 'pending';
        } catch (e) {
          setError('Erreur preuve : ' + (e?.message || 'inconnue'));
          setSaving(false);
          return;
        }
      } else if (level !== initialLevel) {
        // L'athlète a changé pour un niveau exigeant une preuve sans en fournir une
        setError(`Joins une preuve pour le niveau ${LEVEL_LABELS[level]?.label || level}.`);
        setSaving(false);
        return;
      }
      // Sinon : niveau inchangé et preuve déjà présente → on n'écrase rien
    } else {
      // Recruteur : identité + critères de recrutement
      updates.gender = gender || null;
      updates.nationality = nationality.trim() || null;
      updates.recruiting_gender = recruitingGender || null;
      updates.recruiting_levels = recruitingLevels || [];
      updates.recruiting_age_min = recruitingAgeMin === '' ? null : Number(recruitingAgeMin);
      updates.recruiting_age_max = recruitingAgeMax === '' ? null : Number(recruitingAgeMax);
    }
    const { error: err } = await onSave(updates);
    setSaving(false);
    if (err) setError(err); else onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}>
      <div className="w-full rounded-t-2xl flex flex-col"
        style={{ backgroundColor: C.bg, height: '90dvh', border: `1px solid ${C.border}` }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: C.border }}>
          <div className="text-base font-extrabold" style={{ color: C.text }}>Modifier mon profil</div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: C.surface }}>
            <X size={16} style={{ color: C.text }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Bannière + Avatar (zone hero) */}
          <div>
            <div className="relative rounded-xl overflow-hidden"
              style={{ height: 120, backgroundColor: C.surface2, border: `1px solid ${C.border}` }}>
              {bannerUrl ? (
                <img loading="lazy" decoding="async" src={bannerUrl} alt="Bannière" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${C.surface} 0%, ${C.surface2} 100%)` }}>
                  <span className="text-xs" style={{ color: C.textMute }}>Aucune bannière</span>
                </div>
              )}
              {/* Boutons changer / supprimer bannière */}
              <div className="absolute top-2 right-2 flex gap-1">
                <button type="button" onClick={() => bannerInputRef.current?.click()} disabled={uploadingBanner}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1"
                  style={{ backgroundColor: 'rgba(8,15,32,0.85)', color: C.gold, backdropFilter: 'blur(10px)' }}>
                  {uploadingBanner ? <Loader2 size={11} className="animate-spin" /> : <Camera size={11} />}
                  {bannerUrl ? 'Changer' : 'Ajouter'}
                </button>
                {bannerUrl && (
                  <button type="button" onClick={() => setBannerUrl(null)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(8,15,32,0.85)', color: C.red }}>
                    <X size={12} />
                  </button>
                )}
              </div>
              <input ref={bannerInputRef} type="file" accept="image/*" hidden onChange={handlePickBanner} />
            </div>

            {/* Avatar EN DEHORS du wrapper qui clippe — chevauche par marge négative */}
            <div className="px-4 pb-2" style={{ marginTop: -40 }}>
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-full overflow-hidden"
                  style={{ backgroundColor: C.surface, border: `3px solid ${C.bg}` }}>
                  {avatarUrl ? (
                    <img loading="lazy" decoding="async" src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-extrabold"
                      style={{ color: C.gold }}>
                      {(fullName || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}
                  aria-label="Changer la photo de profil"
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: C.gold, color: C.bg, border: `2px solid ${C.bg}` }}>
                  {uploadingAvatar ? <Loader2 size={11} className="animate-spin" /> : <Camera size={12} strokeWidth={2.6} />}
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={handlePickAvatar} />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>
              Nom complet <span style={{ color: C.gold }}>🔒 non modifiable</span>
            </label>
            <input type="text" value={fullName} readOnly disabled
              className="w-full px-4 py-3 rounded-xl text-sm outline-none cursor-not-allowed"
              style={{ backgroundColor: 'rgba(15,23,42,0.5)', color: C.textDim, border: `1px solid ${C.border}` }} />
          </div>

          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>
              Date de naissance <span style={{ color: C.gold }}>🔒 non modifiable</span>
            </label>
            <input type="date" value={birthdate} readOnly disabled
              className="w-full px-4 py-3 rounded-xl text-sm outline-none cursor-not-allowed"
              style={{ backgroundColor: 'rgba(15,23,42,0.5)', color: C.textDim, border: `1px solid ${C.border}`, colorScheme: 'dark' }} />
            {computedAge !== null && (
              <p className="text-[11px] mt-1.5" style={{ color: C.gold }}>
                Âge actuel : {computedAge} ans (mis à jour automatiquement)
              </p>
            )}
          </div>

          {/* Téléphone (modifiable) */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>📞 Téléphone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="+33 6 12 34 56 78" maxLength={20}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
          </div>

          {/* Nom d'utilisateur (modifiable) */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>@ Nom d'utilisateur</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="ton_pseudo" maxLength={30}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
            <p className="text-[10px] mt-1" style={{ color: C.textMute }}>
              Lettres minuscules, chiffres et _ uniquement
            </p>
          </div>

          {/* Début de saison sportive — athlètes uniquement (catégories d'âge U17/U18…) */}
          {isAthleteEditor && (
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>
                📅 Début de la saison sportive
              </label>
              <select value={seasonStartMonth} onChange={(e) => setSeasonStartMonth(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }}>
                <option value={8}>Août</option>
                <option value={9}>Septembre</option>
              </select>
              <p className="text-[10px] mt-1" style={{ color: C.textMute }}>
                Sert à calculer ta catégorie d'âge (U17, U18…) par rapport à la saison
              </p>
            </div>
          )}

          {/* Sport — athlètes + recruteurs (pas les observateurs) */}
          {!isObserverEditor && (
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>Sport</label>
              <select value={sport} onChange={(e) => { setSport(e.target.value); setPosition(''); }}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }}>
                <option value="">— Choisir —</option>
                {SPORTS.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
              </select>
            </div>
          )}

          {/* Poste sur le terrain — athlètes uniquement */}
          {isAthleteEditor && (
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>
                Poste sur le terrain
              </label>
              <input type="text" value={position} onChange={(e) => setPosition(e.target.value)}
                placeholder="Ex : Milieu offensif, Gardien, 100 m…"
                maxLength={60} className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
            </div>
          )}

          {isRecruiter ? (
            <>
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>Genre</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'M', label: '♂ Homme' },
                    { id: 'F', label: '♀ Femme' },
                    { id: 'O', label: '⚧ Autre' },
                  ].map(opt => {
                    const active = gender === opt.id;
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
                    );
                  })}
                </div>
              </div>

              {/* Âge recruteur : remplacé par la date de naissance lecture seule (déjà affichée plus haut) */}

              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>Nationalité</label>
                <input type="text" value={nationality} onChange={(e) => setNationality(e.target.value)}
                  placeholder="Ex : Française, Sénégalaise…" maxLength={60}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
              </div>

              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>Organisation</label>
                <input type="text" value={organization} onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Ex : Paris Saint-Germain" maxLength={80}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
              </div>

              {/* Critères de recrutement */}
              <div className="rounded-xl px-3 py-2.5 flex items-start gap-2"
                style={{ backgroundColor: C.goldSoft, border: `1px solid ${C.borderGold}` }}>
                <span className="text-base">🎯</span>
                <p className="text-[11px]" style={{ color: C.textDim }}>
                  <strong style={{ color: C.text }}>Tes critères de recrutement</strong> — affichés sur ton profil
                  et utilisés pour matcher avec les athlètes.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>
                  Genre des athlètes recrutés
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'all', label: 'Tous' },
                    { id: 'M',   label: '♂ H' },
                    { id: 'F',   label: '♀ F' },
                    { id: 'O',   label: '⚧ Autre' },
                  ].map(opt => {
                    const active = recruitingGender === opt.id;
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
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>
                  Niveaux recrutés (plusieurs possibles)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'amateur',         label: '🌱 Amateur' },
                    { id: 'young_pro',       label: '🚀 Young Pro' },
                    { id: 'senior_amateur',  label: '⭐ Senior Am.' },
                    { id: 'senior_semi_pro', label: '⭐⭐ Semi-Pro' },
                    { id: 'senior_pro',      label: '⭐⭐⭐ Pro' },
                    { id: 'no_club',         label: '🆓 Sans club' },
                  ].map(lv => {
                    const active = recruitingLevels.includes(lv.id);
                    return (
                      <button key={lv.id} type="button"
                        onClick={() => setRecruitingLevels(prev =>
                          active ? prev.filter(x => x !== lv.id) : [...prev, lv.id]
                        )}
                        className="px-2.5 py-1.5 rounded-full text-[11px] font-medium"
                        style={{
                          backgroundColor: active ? C.goldSoft : C.surface,
                          color: active ? C.gold : C.text,
                          border: `1px solid ${active ? C.gold : C.border}`,
                        }}>
                        {lv.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>
                  Tranche d'âge recrutée
                </label>
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
              </div>
            </>
          ) : (
            <>
              {/* Genre */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>Genre</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'M', label: '♂ Homme' },
                    { id: 'F', label: '♀ Femme' },
                    { id: 'O', label: '⚧ Autre' },
                  ].map(opt => {
                    const active = gender === opt.id;
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
                    );
                  })}
                </div>
              </div>

              {/* Nationalité */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>Nationalité</label>
                <input type="text" value={nationality} onChange={(e) => setNationality(e.target.value)}
                  placeholder="Ex : Française, Sénégalaise…" maxLength={60}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
              </div>

              {/* Club + niveau — athlètes uniquement (pas les observateurs) */}
              {isAthleteEditor && (<>
              {/* Inscrit en club ? */}
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>
                  Inscrit en club ?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setHasClubLocal(true)}
                    className="py-2.5 rounded-xl text-xs font-semibold"
                    style={{
                      backgroundColor: hasClubLocal === true ? C.goldSoft : C.surface,
                      color: hasClubLocal === true ? C.gold : C.text,
                      border: `1px solid ${hasClubLocal === true ? C.gold : C.border}`,
                    }}>
                    ✅ Oui
                  </button>
                  <button type="button" onClick={() => { setHasClubLocal(false); setClub(''); setLevel(''); }}
                    className="py-2.5 rounded-xl text-xs font-semibold"
                    style={{
                      backgroundColor: hasClubLocal === false ? C.goldSoft : C.surface,
                      color: hasClubLocal === false ? C.gold : C.text,
                      border: `1px solid ${hasClubLocal === false ? C.gold : C.border}`,
                    }}>
                    ❌ Non
                  </button>
                </div>
              </div>

              {/* Si en club : nom du club */}
              {hasClubLocal === true && (
                <div>
                  <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>
                    Nom du club / structure
                  </label>
                  <input type="text" value={club} onChange={(e) => setClub(e.target.value)}
                    placeholder="Ex : OL Centre Formation" maxLength={80}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
                </div>
              )}

              {/* Si pas en club : badge "Sans club" */}
              {hasClubLocal === false && (
                <div className="rounded-xl px-3 py-2.5 flex items-start gap-2"
                  style={{ backgroundColor: C.goldSoft, border: `1px solid ${C.borderGold}` }}>
                  <span className="text-base">🆓</span>
                  <p className="text-[11px]" style={{ color: C.textDim }}>
                    Tu seras affiché comme <strong style={{ color: C.text }}>« sans club »</strong>.
                    Indique quand même ton niveau ci-dessous — les recruteurs peuvent te repérer pour te proposer une structure adaptée.
                  </p>
                </div>
              )}

              {/* NIVEAU — toujours visible (avec ou sans club) */}
              {hasClubLocal !== null && (
                <div>
                  <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>Niveau</label>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { id: 'amateur',         label: 'Amateur',         icon: '🌱', desc: 'Joueur de loisir' },
                      { id: 'young_pro',       label: 'Young Pro',       icon: '🚀', desc: 'Espoir / centre de formation' },
                      { id: 'senior_amateur',  label: 'Senior Amateur',  icon: '⭐', desc: 'Adulte non rémunéré' },
                      { id: 'senior_semi_pro', label: 'Senior Semi-Pro', icon: '⭐⭐', desc: 'Compensé sans contrat' },
                      { id: 'senior_pro',      label: 'Senior Pro',      icon: '⭐⭐⭐', desc: 'Contrat professionnel' },
                    ].map(lv => {
                      const active = level === lv.id;
                      return (
                        <button key={lv.id} type="button"
                          onClick={() => { setLevel(lv.id); if (!levelRequiresProof(lv.id)) setLevelProofFile(null); }}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-sm"
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
                          {levelRequiresProof(lv.id) && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                              style={{ backgroundColor: 'rgba(255,184,0,0.15)', color: C.gold, border: `1px solid ${C.borderGold}` }}>
                              Preuve
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PREUVE DE NIVEAU — affichée pour young_pro / senior_pro */}
              {levelRequiresProof(level) && (
                <div>
                  <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>
                    Preuve de niveau
                  </label>
                  {/* État actuel si on avait déjà un proof identique */}
                  {!levelProofFile && level === initialLevel && initialProofStatus !== 'none' && (
                    <div className="rounded-xl p-3 mb-2 flex items-center gap-2.5"
                      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                      <FileCheck2 size={16}
                        style={{ color: initialProofStatus === 'approved' ? C.green : C.gold, flexShrink: 0 }} />
                      <div className="flex-1 min-w-0 text-xs" style={{ color: C.text }}>
                        {initialProofStatus === 'approved' && 'Preuve validée ✓'}
                        {initialProofStatus === 'pending' && 'Preuve en cours de vérification…'}
                        {initialProofStatus === 'rejected' && 'Preuve refusée — joins-en une nouvelle.'}
                      </div>
                    </div>
                  )}
                  <p className="text-[11px] mb-2" style={{ color: C.textMute }}>
                    Pour afficher ce niveau, joins un document qui le justifie
                    (contrat, licence, attestation du club…). PDF ou image (max 10 Mo).
                  </p>
                  <input ref={proofInputRef} type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (f.size > 10 * 1024 * 1024) {
                        setError('Le fichier dépasse 10 Mo.');
                        return;
                      }
                      setError('');
                      setLevelProofFile(f);
                    }} />
                  {!levelProofFile ? (
                    <button type="button" onClick={() => proofInputRef.current?.click()}
                      className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold"
                      style={{ backgroundColor: C.surface, color: C.gold, border: `1.5px dashed ${C.borderGold}` }}>
                      <Upload size={14} />
                      {initialProofStatus === 'none' ? 'Joindre la preuve' : 'Remplacer la preuve'}
                    </button>
                  ) : (
                    <div className="rounded-xl p-3 flex items-center gap-2.5"
                      style={{ backgroundColor: C.surface, border: `1px solid ${C.borderGold}` }}>
                      <FileCheck2 size={16} style={{ color: C.gold, flexShrink: 0 }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate" style={{ color: C.text }}>{levelProofFile.name}</div>
                        <div className="text-[10px]" style={{ color: C.textDim }}>
                          {(levelProofFile.size / 1024 / 1024).toFixed(2)} Mo · En attente après enregistrement
                        </div>
                      </div>
                      <button type="button"
                        onClick={() => { setLevelProofFile(null); if (proofInputRef.current) proofInputRef.current.value = ''; }}
                        className="px-2 py-1 rounded text-[10px] font-bold"
                        style={{ color: C.red, border: `1px solid ${C.red}` }}>
                        Retirer
                      </button>
                    </div>
                  )}
                </div>
              )}
              </>)}
            </>
          )}

          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)}
              rows={4} maxLength={300}
              placeholder="Quelques mots sur toi…"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
            <div className="text-[10px] mt-1 text-right" style={{ color: C.textMute }}>{bio.length}/300</div>
          </div>

          {/* Localisation */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>
              📍 Localisation (pour le matching recruteurs)
            </label>
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
          </div>

          {/* Liens externes : recruteurs uniquement (les athlètes n'en affichent pas) */}
          {isRecruiter && (
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: C.textDim }}>
                🔗 Mes liens externes (réseaux sociaux, apps fitness)
              </label>
              <p className="text-[11px] mb-2" style={{ color: C.textMute }}>
                Colle l'URL de ton profil ou laisse vide. Affiché publiquement sur ta page profil.
              </p>
              <div className="flex flex-col gap-2">
                {SOCIAL_LINK_PLATFORMS.map(p => (
                  <div key={p.key} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-base"
                      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                      {p.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px]" style={{ color: C.textDim }}>{p.label}</div>
                      <input type="url" value={socialLinks?.[p.key] || ''}
                        onChange={(e) => setSocialLinks(prev => ({ ...prev, [p.key]: e.target.value }))}
                        placeholder={p.placeholder}
                        className="w-full px-2.5 py-1.5 rounded text-xs outline-none"
                        style={{ backgroundColor: C.bg, color: C.text, border: `1px solid ${C.border}` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Section Compte (changement email / mot de passe) ─── */}
          <div className="rounded-xl p-3 mt-4"
            style={{ backgroundColor: 'rgba(255,184,0,0.04)', border: `1px solid ${C.border}` }}>
            <div className="text-[10px] font-mono tracking-widest mb-3" style={{ color: C.gold }}>
              🔐 COMPTE
            </div>
            <AccountSecuritySection />
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg text-xs"
              style={{ backgroundColor: 'rgba(255,71,87,0.12)', color: C.red, border: `1px solid ${C.red}` }}>
              {error}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t" style={{ borderColor: C.border }}>
          <button onClick={handleSave} disabled={saving}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            style={{
              backgroundColor: saving ? 'rgba(255,184,0,0.4)' : C.gold,
              color: C.bg,
            }}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══ PROFIL VIEWS (athlète & recruteur) ═════════════════════════════
// ─── Card vidéo "ma vidéo" avec bouton de suppression ──────────────
function OwnVideoThumb({ video, onPlay, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const thumb = getVideoThumb(video);
  const uploaded = isUploadedVideo(video);
  const vsport = SPORTS.find(s => s.id === video.sport);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(video.id);
    setDeleting(false);
    setConfirm(false);
    setMenuOpen(false);
  };

  return (
    <div className="rounded-xl overflow-hidden fade-in relative"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, opacity: deleting ? 0.5 : 1 }}>
      <button onClick={() => onPlay(video)}
        className="relative w-full text-left" style={{ aspectRatio: '1', backgroundColor: '#000' }}>
        {thumb ? (
          <img loading="lazy" decoding="async" src={thumb} alt={video.title} className="w-full h-full object-cover" />
        ) : uploaded ? (
          <video src={`${video.video_url}#t=0.1`} preload="metadata" muted playsInline
            className="w-full h-full object-cover pointer-events-none" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: C.surface2 }}>
            <Play size={24} style={{ color: C.gold }} />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.6) 100%)' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,184,0,0.9)' }}>
            <Play size={16} fill={C.bg} stroke={C.bg} />
          </div>
        </div>
      </button>

      {/* Bouton ... en haut à droite */}
      {onDelete && (
        <button onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); }}
          aria-label="Options"
          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(8,15,32,0.7)', backdropFilter: 'blur(6px)' }}>
          <MoreVertical size={13} style={{ color: C.text }} />
        </button>
      )}

      {/* Menu actions */}
      {menuOpen && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-3"
          style={{ backgroundColor: 'rgba(8,15,32,0.92)', backdropFilter: 'blur(4px)' }}
          onClick={() => { setMenuOpen(false); setConfirm(false); }}>
          <div className="rounded-xl overflow-hidden w-full" onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            {confirm ? (
              <div className="p-3 text-center">
                <p className="text-xs mb-3" style={{ color: C.text }}>
                  Supprimer cette vidéo&nbsp;?
                </p>
                <div className="flex gap-1.5">
                  <button onClick={() => setConfirm(false)}
                    className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold"
                    style={{ color: C.textDim, border: `1px solid ${C.border}` }}>
                    Annuler
                  </button>
                  <button onClick={handleDelete} disabled={deleting}
                    className="flex-1 py-1.5 rounded-lg text-[10px] font-bold"
                    style={{ backgroundColor: C.red, color: C.text }}>
                    {deleting ? <Loader2 size={10} className="animate-spin mx-auto" /> : 'Supprimer'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirm(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-[11px] font-semibold"
                style={{ color: C.red }}>
                <Trash2 size={12} />
                Supprimer
              </button>
            )}
          </div>
        </div>
      )}

      <div className="p-2">
        <div className="text-xs font-bold truncate" style={{ color: C.text }}>{video.title}</div>
        {vsport && (
          <div className="text-[10px] mt-0.5" style={{ color: C.textDim }}>
            {vsport.icon} {vsport.label}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileView({ userProfile, userEmail, onLogout, onEdit, onShowFollowList, onLoadFollowCounts,
                       onDeleteVideo, onOpenSettings, onShareProfile }) {
  const sport = SPORTS.find(s => s.id === userProfile?.sport);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [myVideos, setMyVideos] = useState([]);
  const [playingVideo, setPlayingVideo] = useState(null);

  // Realtime : recharger les compteurs followers/following en temps réel
  useEffect(() => {
    if (!userProfile?.id || !onLoadFollowCounts) return;
    const reload = async () => {
      const c = await onLoadFollowCounts(userProfile.id);
      setCounts(c);
    };
    const channel = supabase
      .channel(`my-follow-counts-${userProfile.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'follows',
          filter: `following_id=eq.${userProfile.id}` }, reload)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'follows',
          filter: `follower_id=eq.${userProfile.id}` }, reload)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProfile?.id]);

  useEffect(() => {
    if (!userProfile?.id) return;
    let cancel = false;
    (async () => {
      const [c, vRes] = await Promise.all([
        onLoadFollowCounts ? onLoadFollowCounts(userProfile.id) : Promise.resolve({ followers: 0, following: 0 }),
        supabase.from('videos').select('*').eq('user_id', userProfile.id)
          .order('created_at', { ascending: false }),
      ]);
      if (cancel) return;
      setCounts(c);
      setMyVideos(vRes.data || []);
    })();
    return () => { cancel = true; };
  }, [userProfile?.id]);

  const videosCount = myVideos.length;

  return (
    <div className="pb-32 overflow-y-auto" style={{ height: '100dvh', backgroundColor: C.bg }}>
      {/* Bannière */}
      <div className="relative" style={{ height: 140 }}>
        {userProfile?.banner_url ? (
          <img loading="lazy" decoding="async" src={userProfile.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${C.surface2} 0%, ${C.surface} 100%)` }} />
        )}
        <div className="absolute inset-0"
          style={{ background: `linear-gradient(180deg, transparent 50%, ${C.bg} 100%)` }} />
        {/* Icône Partager en haut à droite */}
        {onShareProfile && (
          <button onClick={onShareProfile} aria-label="Partager mon compte"
            className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center active:opacity-70"
            style={{ backgroundColor: 'rgba(8,15,32,0.55)', backdropFilter: 'blur(8px)',
                     border: `1px solid ${C.borderGold}`, color: C.gold }}>
            <Share2 size={16} strokeWidth={2.4} />
          </button>
        )}
      </div>

      {/* Rappel saison sportive (août → 15 sept, si non configuré) */}
      <ProfileSeasonReminder userProfile={userProfile} onEdit={onEdit} />

      {/* Ligne avatar + actions (style X) */}
      <div className="px-4 flex items-start justify-between" style={{ marginTop: -48 }}>
        <div className="rounded-full overflow-hidden fade-in"
          style={{ width: 96, height: 96, backgroundColor: C.surface, border: `4px solid ${C.bg}` }}>
          {userProfile?.avatar_url ? (
            <img loading="lazy" decoding="async" src={userProfile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl font-bold"
              style={{ color: C.gold }}>
              {userProfile?.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-12">
          {onOpenSettings && (
            <button onClick={onOpenSettings} aria-label="Paramètres"
              className="w-10 h-10 rounded-full flex items-center justify-center active:opacity-70"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}>
              <Settings size={16} strokeWidth={2.2} />
            </button>
          )}
          <button onClick={onEdit}
            className="px-4 h-10 rounded-full text-sm font-extrabold flex items-center gap-1.5"
            style={{ backgroundColor: 'transparent', color: C.text, border: `1.5px solid ${C.border}` }}>
            <Edit3 size={14} strokeWidth={2.4} />
            Modifier
          </button>
        </div>
      </div>

      {/* Identité aligné à gauche (style X) */}
      <div className="px-4 mt-3 fade-in">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <h1 className="text-xl font-extrabold" style={{ color: C.text }}>
            {userProfile?.full_name || 'Nouvel utilisateur'}
          </h1>
          {userProfile?.verified && <BadgeCheck size={18} fill={C.gold} stroke={C.bg} strokeWidth={2.5} />}
          {userProfile?.nationality && (
            <span className="text-xs" style={{ color: C.textDim }}>
              🌐 {userProfile.nationality}
            </span>
          )}
          {(computeAge(userProfile?.birthdate) ?? userProfile?.age) && (
            <span className="text-xs" style={{ color: C.textDim }}>
              · {computeAge(userProfile?.birthdate) ?? userProfile?.age} ans
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1"
            style={{ backgroundColor: C.goldSoft, color: C.gold }}>
            <Star size={10} strokeWidth={2.4} />
            Athlète
          </span>
          {/* Niveau à côté du chip Athlète — affiché uniquement si validé */}
          {isLevelDisplayable(userProfile) && <LevelChip level={userProfile.level} />}
          {/* Indicateur si une preuve est en attente / refusée */}
          {userProfile?.level && levelRequiresProof(userProfile.level) && userProfile?.level_proof_status === 'pending' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
              style={{ backgroundColor: 'rgba(255,184,0,0.15)', color: C.gold, border: `1px solid ${C.borderGold}` }}>
              ⏳ Preuve en vérification
            </span>
          )}
          {userProfile?.level && levelRequiresProof(userProfile.level) && userProfile?.level_proof_status === 'rejected' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
              style={{ backgroundColor: 'rgba(255,71,87,0.15)', color: C.red, border: `1px solid ${C.red}` }}>
              ❌ Preuve refusée
            </span>
          )}
          {sport && (
            <span className="text-xs" style={{ color: C.textDim }}>
              {sport.icon} {sport.label}
            </span>
          )}
        </div>

        {(userProfile?.position || userProfile?.club) && (
          <div className="text-xs" style={{ color: C.textDim }}>
            {userProfile?.position && userProfile.position}
            {userProfile?.club && ` · ${userProfile.club}`}
          </div>
        )}
        {/* Localisation (ville · région · pays) — sous poste/club */}
        {(userProfile?.city || userProfile?.region || userProfile?.country) && (
          <div className="text-xs mt-0.5" style={{ color: C.textDim }}>
            📍 {[userProfile?.city, userProfile?.region, userProfile?.country].filter(Boolean).join(' · ')}
          </div>
        )}

        {/* Stats inline style X */}
        <div className="flex items-center gap-4 mt-3 text-sm flex-wrap">
          <button onClick={() => onShowFollowList?.(userProfile.id, 'following')}
            className="active:opacity-60">
            <strong style={{ color: C.text }}>{counts.following}</strong>
            <span className="ml-1" style={{ color: C.textDim }}>Abonnements</span>
          </button>
          <button onClick={() => onShowFollowList?.(userProfile.id, 'followers')}
            className="active:opacity-60">
            <strong style={{ color: C.text }}>{counts.followers}</strong>
            <span className="ml-1" style={{ color: C.textDim }}>Abonnés</span>
          </button>
          <span>
            <strong style={{ color: C.text }}>{videosCount}</strong>
            <span className="ml-1" style={{ color: C.textDim }}>Vidéos</span>
          </span>
        </div>
      </div>

      <div className="px-4 mt-4">

      {/* Mes vidéos publiées */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold mb-3" style={{ color: C.gold }}>
          🎬 Mes vidéos ({videosCount})
        </h3>
        {myVideos.length === 0 ? (
          <div className="rounded-xl py-8 px-6 text-center"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            <Camera size={24} style={{ color: C.textMute }} className="mx-auto mb-2" />
            <p className="text-xs" style={{ color: C.textDim }}>
              Publie ta première vidéo depuis l'onglet "+"
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {myVideos.map(v => (
              <OwnVideoThumb key={v.id} video={v} onPlay={setPlayingVideo} onDelete={onDeleteVideo} />
            ))}
          </div>
        )}
      </div>

      </div>{/* fin px-4 */}

      {playingVideo && (
        <YouTubePlayer video={playingVideo} onClose={() => setPlayingVideo(null)} />
      )}
    </div>
  );
}

// Section vidéos sauvegardées (recruteur favoris)
function SavedVideosSection({ currentUserId, onLoad, onPlay, onUnsave }) {
  const [vids, setVids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!currentUserId) return;
    let cancel = false;
    setLoading(true);
    (async () => {
      const list = await onLoad(currentUserId);
      if (!cancel) { setVids(list); setLoading(false); }
    })();
    return () => { cancel = true; };
  }, [currentUserId]);

  // Bloque le scroll du body quand le modal est ouvert
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const count = vids.length;
  // Aperçu : prend jusqu'à 3 miniatures pour le dossier
  const previews = vids.slice(0, 3).map(v => getVideoThumb(v)).filter(Boolean);

  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold mb-3" style={{ color: C.gold }}>
        🔖 Vidéos enregistrées ({loading ? '…' : count})
      </h3>

      {/* Carte "dossier" cliquable */}
      <button
        onClick={() => !loading && setOpen(true)}
        disabled={loading}
        className="w-full rounded-xl p-4 flex items-center gap-3 text-left active:opacity-80 transition-opacity"
        style={{
          backgroundColor: C.surface,
          border: `1px solid ${C.border}`,
          opacity: loading ? 0.6 : 1,
        }}
      >
        {/* Icône dossier + aperçu miniatures */}
        <div className="relative w-14 h-14 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'rgba(255,184,0,0.12)', border: `1px solid ${C.border}` }}>
          {previews.length > 0 ? (
            <div className="grid grid-cols-2 gap-0.5 w-full h-full p-1 overflow-hidden rounded">
              {previews.slice(0, 4).map((p, i) => (
                <img loading="lazy" decoding="async" key={i} src={p} alt="" className="w-full h-full object-cover rounded-sm" />
              ))}
              {previews.length < 4 && Array.from({ length: 4 - previews.length }).map((_, i) => (
                <div key={`ph-${i}`} className="w-full h-full rounded-sm"
                  style={{ backgroundColor: 'rgba(255,184,0,0.08)' }} />
              ))}
            </div>
          ) : (
            <Folder size={26} style={{ color: C.gold }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold truncate" style={{ color: C.text }}>
            Mes vidéos enregistrées
          </div>
          <div className="text-xs" style={{ color: C.textDim }}>
            {loading
              ? 'Chargement…'
              : count === 0
                ? "Aucune vidéo · clique sur 🔖 sur une vidéo du feed"
                : `${count} vidéo${count > 1 ? 's' : ''} · Cliquer pour ouvrir`}
          </div>
        </div>

        <ChevronDown size={18} style={{ color: C.textDim, transform: 'rotate(-90deg)' }} />
      </button>

      {/* Page pleine d'ouverture du dossier */}
      {open && (
        <div
          className="fixed inset-0 z-[80] flex flex-col fade-in"
          style={{
            backgroundColor: C.bg,
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {/* Header de la page */}
          <div className="flex items-center gap-3 px-4 py-3 shrink-0"
            style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: C.bg }}>
            <button
              onClick={() => setOpen(false)}
              aria-label="Retour"
              className="w-10 h-10 rounded-full flex items-center justify-center active:opacity-70"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
            >
              <ArrowLeft size={18} style={{ color: C.text }} />
            </button>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <FolderOpen size={20} style={{ color: C.gold }} className="shrink-0" />
              <div className="min-w-0">
                <div className="text-base font-extrabold truncate" style={{ color: C.text }}>
                  Mes vidéos enregistrées
                </div>
                <div className="text-[11px]" style={{ color: C.textDim }}>
                  {count} vidéo{count > 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Contenu scrollable plein écran */}
          <div className="flex-1 overflow-y-auto p-3">
            {count === 0 ? (
              <div className="rounded-xl py-12 px-6 text-center mt-6"
                style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                <Bookmark size={32} style={{ color: C.textMute }} className="mx-auto mb-3" />
                <p className="text-sm font-bold mb-1" style={{ color: C.text }}>
                  Aucune vidéo enregistrée
                </p>
                <p className="text-xs" style={{ color: C.textDim }}>
                  Clique sur 🔖 sur une vidéo du feed pour l'ajouter ici.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {vids.map(v => {
                  const thumb = getVideoThumb(v);
                  const uploaded = isUploadedVideo(v);
                  return (
                    <div key={v.id} className="rounded-xl overflow-hidden fade-in relative"
                      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                      <button
                        onClick={() => { setOpen(false); onPlay?.(v); }}
                        className="relative w-full text-left"
                        style={{ aspectRatio: '1', backgroundColor: '#000' }}
                      >
                        {thumb
                          ? <img loading="lazy" decoding="async" src={thumb} alt={v.title} className="w-full h-full object-cover" />
                          : uploaded
                            ? <video src={`${v.video_url}#t=0.1`} preload="metadata" muted playsInline
                                className="w-full h-full object-cover pointer-events-none" />
                            : null}
                        <div className="absolute inset-0 flex items-center justify-center"
                          style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.6) 100%)' }}>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: 'rgba(255,184,0,0.9)' }}>
                            <Play size={16} fill={C.bg} stroke={C.bg} />
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          onUnsave?.(v.id);
                          setVids(prev => prev.filter(x => x.id !== v.id));
                        }}
                        aria-label="Retirer des favoris"
                        className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(8,15,32,0.7)', backdropFilter: 'blur(6px)' }}
                      >
                        <Bookmark size={13} fill={C.gold} stroke={C.gold} />
                      </button>
                      <div className="p-2">
                        <div className="text-xs font-bold truncate" style={{ color: C.text }}>{v.title}</div>
                        <div className="text-[10px] truncate" style={{ color: C.textDim }}>
                          par {v.profiles?.full_name || 'Athlète'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PROFIL OBSERVATEUR (page minimaliste, vidéos enregistrées privées) ──
function ObserverProfileView({ userProfile, onEdit, onShowFollowList, onLoadFollowCounts,
                                onOpenSettings, onShareProfile,
                                onLoadSavedVideos, onToggleSaveVideo, onPlayVideo }) {
  const [counts, setCounts] = useState({ followers: 0, following: 0 });

  // Realtime : recharger les compteurs followers/following en temps réel
  useEffect(() => {
    if (!userProfile?.id || !onLoadFollowCounts) return;
    const reload = async () => {
      const c = await onLoadFollowCounts(userProfile.id);
      setCounts(c);
    };
    const channel = supabase
      .channel(`observer-follow-counts-${userProfile.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'follows',
          filter: `following_id=eq.${userProfile.id}` }, reload)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'follows',
          filter: `follower_id=eq.${userProfile.id}` }, reload)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProfile?.id]);

  useEffect(() => {
    if (!userProfile?.id || !onLoadFollowCounts) return;
    let cancel = false;
    (async () => {
      const c = await onLoadFollowCounts(userProfile.id);
      if (!cancel) setCounts(c);
    })();
    return () => { cancel = true; };
  }, [userProfile?.id]);

  return (
    <div className="pb-32 overflow-y-auto" style={{ height: '100dvh', backgroundColor: C.bg }}>
      {/* Bannière */}
      <div className="relative" style={{ height: 140 }}>
        {userProfile?.banner_url ? (
          <img loading="lazy" decoding="async" src={userProfile.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${C.surface2} 0%, ${C.surface} 100%)` }} />
        )}
        <div className="absolute inset-0"
          style={{ background: `linear-gradient(180deg, transparent 50%, ${C.bg} 100%)` }} />
        {onShareProfile && (
          <button onClick={onShareProfile} aria-label="Partager mon compte"
            className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center active:opacity-70"
            style={{ backgroundColor: 'rgba(8,15,32,0.55)', backdropFilter: 'blur(8px)',
                     border: `1px solid ${C.borderGold}`, color: C.gold }}>
            <Share2 size={16} strokeWidth={2.4} />
          </button>
        )}
      </div>

      {/* Rappel saison sportive (août → 15 sept, si non configuré) */}
      <ProfileSeasonReminder userProfile={userProfile} onEdit={onEdit} />

      {/* Ligne avatar + actions (style X) */}
      <div className="px-4 flex items-start justify-between" style={{ marginTop: -48 }}>
        <div className="rounded-full overflow-hidden fade-in"
          style={{ width: 96, height: 96, backgroundColor: C.surface, border: `4px solid ${C.bg}` }}>
          {userProfile?.avatar_url ? (
            <img loading="lazy" decoding="async" src={userProfile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl font-bold"
              style={{ color: C.gold }}>
              {userProfile?.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-12">
          {onOpenSettings && (
            <button onClick={onOpenSettings} aria-label="Paramètres"
              className="w-10 h-10 rounded-full flex items-center justify-center active:opacity-70"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}>
              <Settings size={16} strokeWidth={2.2} />
            </button>
          )}
          {onEdit && (
            <button onClick={onEdit}
              className="px-4 h-10 rounded-full text-sm font-extrabold flex items-center gap-1.5"
              style={{ backgroundColor: 'transparent', color: C.text, border: `1.5px solid ${C.border}` }}>
              <Edit3 size={14} strokeWidth={2.4} />
              Modifier
            </button>
          )}
        </div>
      </div>

      {/* Identité minimaliste */}
      <div className="px-4 mt-3 fade-in">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h1 className="text-xl font-extrabold" style={{ color: C.text }}>
            {userProfile?.full_name || 'Nouvel utilisateur'}
          </h1>
          {userProfile?.verified && <BadgeCheck size={18} fill={C.gold} stroke={C.bg} strokeWidth={2.5} />}
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1"
            style={{ backgroundColor: C.goldSoft, color: C.gold }}>
            <Eye size={10} strokeWidth={2.4} />
            Observateur
          </span>
        </div>

        {/* Stats inline */}
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <button onClick={() => onShowFollowList?.(userProfile.id, 'following')}
            className="active:opacity-60">
            <strong style={{ color: C.text }}>{counts.following}</strong>
            <span className="ml-1" style={{ color: C.textDim }}>Abonnements</span>
          </button>
          <button onClick={() => onShowFollowList?.(userProfile.id, 'followers')}
            className="active:opacity-60">
            <strong style={{ color: C.text }}>{counts.followers}</strong>
            <span className="ml-1" style={{ color: C.textDim }}>Abonnés</span>
          </button>
        </div>
      </div>

      <div className="px-4 mt-6">
        {/* Vidéos enregistrées — privées, visibles uniquement par soi-même */}
        {onLoadSavedVideos && (
          <SavedVideosSection currentUserId={userProfile?.id}
            onLoad={onLoadSavedVideos}
            onPlay={(v) => onPlayVideo?.(v)}
            onUnsave={onToggleSaveVideo} />
        )}

        <div className="rounded-xl p-3 mt-4 flex items-start gap-2.5"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <Lock size={14} style={{ color: C.textDim }} className="mt-0.5 flex-shrink-0" />
          <p className="text-[11px] leading-relaxed" style={{ color: C.textDim }}>
            En tant qu'observateur, ton dossier de vidéos enregistrées est <strong style={{ color: C.text }}>privé</strong>.
            Personne d'autre que toi ne peut le voir.
          </p>
        </div>
      </div>
    </div>
  );
}

function RecruiterProfileView({ userProfile, userEmail, onLogout, onEdit, onShowFollowList, onLoadFollowCounts,
                                onLoadSignedPosts, onDeleteSignedPost, onOpenSignedPostModal, onSelectProfile,
                                onLoadSignedCount, onShowSignedAthletes, onOpenSettings,
                                onShareProfile, onLoadSavedVideos, onToggleSaveVideo, onPlayVideo }) {
  const sport = SPORTS.find(s => s.id === userProfile?.sport);
  const initials = (userProfile?.full_name || '?')
    .split(' ').slice(0, 2).map(s => s.charAt(0).toUpperCase()).join('') || '?';
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [signedCount, setSignedCount] = useState(0);
  const [criteriaOpen, setCriteriaOpen] = useState(false);

  // Realtime : recharger les compteurs followers/following en temps réel
  useEffect(() => {
    if (!userProfile?.id || !onLoadFollowCounts) return;
    const reload = async () => {
      const c = await onLoadFollowCounts(userProfile.id);
      setCounts(c);
    };
    const channel = supabase
      .channel(`recruiter-follow-counts-${userProfile.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'follows',
          filter: `following_id=eq.${userProfile.id}` }, reload)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'follows',
          filter: `follower_id=eq.${userProfile.id}` }, reload)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProfile?.id]);

  useEffect(() => {
    if (!userProfile?.id) return;
    let cancel = false;
    (async () => {
      const [c, sc] = await Promise.all([
        onLoadFollowCounts ? onLoadFollowCounts(userProfile.id) : Promise.resolve({ followers: 0, following: 0 }),
        onLoadSignedCount ? onLoadSignedCount(userProfile.id) : Promise.resolve(0),
      ]);
      if (cancel) return;
      setCounts(c);
      setSignedCount(sc);
    })();
    return () => { cancel = true; };
  }, [userProfile?.id]);

  // Realtime : refresh le compteur quand un joueur confirme une signature
  useEffect(() => {
    if (!userProfile?.id || !onLoadSignedCount) return;
    const channel = supabase
      .channel(`my-signed-count-${userProfile.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'shortlist',
          filter: `recruiter_id=eq.${userProfile.id}` },
        async () => {
          const sc = await onLoadSignedCount(userProfile.id);
          setSignedCount(sc);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProfile?.id]);

  return (
    <div className="pb-32 overflow-y-auto" style={{ height: '100dvh', backgroundColor: C.bg }}>
      {/* Bannière */}
      <div className="relative" style={{ height: 140 }}>
        {userProfile?.banner_url ? (
          <img loading="lazy" decoding="async" src={userProfile.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${C.surface2} 0%, ${C.surface} 100%)` }} />
        )}
        <div className="absolute inset-0"
          style={{ background: `linear-gradient(180deg, transparent 50%, ${C.bg} 100%)` }} />
        {/* Icône Partager en haut à droite */}
        {onShareProfile && (
          <button onClick={onShareProfile} aria-label="Partager mon compte"
            className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center active:opacity-70"
            style={{ backgroundColor: 'rgba(8,15,32,0.55)', backdropFilter: 'blur(8px)',
                     border: `1px solid ${C.borderGold}`, color: C.gold }}>
            <Share2 size={16} strokeWidth={2.4} />
          </button>
        )}
      </div>

      {/* Rappel saison sportive (août → 15 sept, si non configuré) */}
      <ProfileSeasonReminder userProfile={userProfile} onEdit={onEdit} />

      {/* Ligne avatar + actions (style X) */}
      <div className="px-4 flex items-start justify-between" style={{ marginTop: -48 }}>
        <div className="rounded-full overflow-hidden fade-in"
          style={{ width: 96, height: 96, backgroundColor: C.surface, border: `4px solid ${C.bg}` }}>
          {userProfile?.avatar_url ? (
            <img loading="lazy" decoding="async" src={userProfile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl font-bold"
              style={{ color: C.gold }}>
              {initials}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-12">
          {onOpenSettings && (
            <button onClick={onOpenSettings} aria-label="Paramètres"
              className="w-10 h-10 rounded-full flex items-center justify-center active:opacity-70"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}>
              <Settings size={16} strokeWidth={2.2} />
            </button>
          )}
          <button onClick={onEdit}
            className="px-4 h-10 rounded-full text-sm font-extrabold flex items-center gap-1.5"
            style={{ backgroundColor: 'transparent', color: C.text, border: `1.5px solid ${C.border}` }}>
            <Edit3 size={14} strokeWidth={2.4} />
            Modifier
          </button>
        </div>
      </div>

      {/* Identité aligné à gauche (style X) — épuré pour recruteur */}
      <div className="px-4 mt-3 fade-in">
        <div className="flex items-center gap-2 mb-0.5">
          <h1 className="text-xl font-extrabold" style={{ color: C.text }}>
            {userProfile?.full_name || 'Nouvel utilisateur'}
          </h1>
          {userProfile?.verified && <BadgeCheck size={18} fill={C.gold} stroke={C.bg} strokeWidth={2.5} />}
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1"
            style={{ backgroundColor: C.goldSoft, color: C.gold }}>
            <Briefcase size={10} strokeWidth={2.4} />
            Recruteur
          </span>
        </div>

        {userProfile?.organization && (
          <div className="text-sm font-semibold" style={{ color: C.gold }}>
            {userProfile.organization}
          </div>
        )}

        {/* Stats inline style X */}
        <div className="flex items-center gap-4 mt-3 text-sm flex-wrap">
          <button onClick={() => onShowFollowList?.(userProfile.id, 'following')}
            className="active:opacity-60">
            <strong style={{ color: C.text }}>{counts.following}</strong>
            <span className="ml-1" style={{ color: C.textDim }}>Abonnements</span>
          </button>
          <button onClick={() => onShowFollowList?.(userProfile.id, 'followers')}
            className="active:opacity-60">
            <strong style={{ color: C.text }}>{counts.followers}</strong>
            <span className="ml-1" style={{ color: C.textDim }}>Abonnés</span>
          </button>
          <button onClick={() => onShowSignedAthletes?.(userProfile.id)}
            className="active:opacity-60">
            <strong style={{ color: C.gold }}>{signedCount}</strong>
            <span className="ml-1" style={{ color: C.textDim }}>🏆 Signés</span>
          </button>
        </div>
      </div>

      <div className="px-4 mt-4">

      {/* Critères de recrutement — dépliable */}
      {(userProfile?.recruiting_gender || (userProfile?.recruiting_levels && userProfile.recruiting_levels.length > 0)
        || userProfile?.recruiting_age_min != null || userProfile?.recruiting_age_max != null) && (
        <div className="mb-4">
          <button
            onClick={() => setCriteriaOpen(o => !o)}
            aria-expanded={criteriaOpen}
            className="w-full rounded-xl px-3 py-2.5 flex items-center justify-between active:opacity-80"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.borderGold}` }}>
            <span className="text-xs font-semibold" style={{ color: C.gold }}>
              🎯 Critères de recrutement
            </span>
            <ChevronDown size={16}
              style={{ color: C.gold, transform: criteriaOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          </button>
          {criteriaOpen && (
            <div className="rounded-xl p-3 mt-1.5 fade-in"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              <div className="flex flex-col gap-2 text-xs">
                {userProfile?.recruiting_gender && (
                  <div style={{ color: C.text }}>
                    <span style={{ color: C.textDim }}>Genre : </span>
                    {userProfile.recruiting_gender === 'all' ? 'Tous'
                      : userProfile.recruiting_gender === 'M' ? '♂ Hommes'
                      : userProfile.recruiting_gender === 'F' ? '♀ Femmes'
                      : '⚧ Autre'}
                  </div>
                )}
                {userProfile?.recruiting_age_min != null && userProfile?.recruiting_age_max != null && (
                  <div style={{ color: C.text }}>
                    <span style={{ color: C.textDim }}>Âge : </span>
                    {userProfile.recruiting_age_min} – {userProfile.recruiting_age_max} ans
                  </div>
                )}
                {userProfile?.recruiting_levels && userProfile.recruiting_levels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {userProfile.recruiting_levels.map(lv => <LevelChip key={lv} level={lv} />)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Liens externes (recruteurs uniquement) */}
      <SocialLinksDisplay links={userProfile?.social_links} />

      {/* Vidéos sauvegardées (favoris recruteur) */}
      {onLoadSavedVideos && (
        <SavedVideosSection currentUserId={userProfile?.id}
          onLoad={onLoadSavedVideos}
          onPlay={(v) => onPlayVideo?.(v)}
          onUnsave={onToggleSaveVideo} />
      )}

      {/* Galerie signatures */}
      <div className="mb-6">
        <SignedPostsGallery
          recruiterId={userProfile?.id}
          currentUserId={userProfile?.id}
          onLoad={onLoadSignedPosts}
          onDelete={onDeleteSignedPost}
          onAdd={onOpenSignedPostModal}
          onSelectAthlete={onSelectProfile} />
      </div>

      </div>{/* fin px-4 */}
    </div>
  );
}

// ═══ BOTTOM NAV ════════════════════════════════════════════════════
function BottomNav({ tab, setTab, mode }) {
  // 3 modes : recruiter, athlete, observer
  const items = mode === 'recruiter' ? [
    { id: 'feed', icon: Home, label: 'Feed' },
    { id: 'discover', icon: Search, label: 'Recherche' },
    { id: 'shortlist', icon: Star, label: 'Short-list' },
    { id: 'messages', icon: Inbox, label: 'Messages' },
    { id: 'profile', icon: User, label: 'Profil' },
  ] : mode === 'observer' ? [
    // Observateur : pas de publish, pas de shortlist
    { id: 'feed', icon: Home, label: 'Feed' },
    { id: 'search', icon: Search, label: 'Recherche' },
    { id: 'messages', icon: Inbox, label: 'Messages' },
    { id: 'profile', icon: User, label: 'Profil' },
  ] : [
    { id: 'feed', icon: Home, label: 'Feed' },
    { id: 'search', icon: Search, label: 'Recherche' },
    { id: 'publish', icon: Plus, label: 'Publier' },
    { id: 'messages', icon: Inbox, label: 'Messages' },
    { id: 'profile', icon: User, label: 'Profil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-2 pt-2 pb-3 flex items-center justify-around"
      style={{
        backgroundColor: 'rgba(8,15,32,0.92)',
        backdropFilter: 'blur(12px)',
        borderTop: `1px solid ${C.border}`,
      }}>
      {items.map(item => {
        const active = tab === item.id;
        const isPublish = item.id === 'publish';
        return (
          <button key={item.id} onClick={() => setTab(item.id)}
            className="flex flex-col items-center gap-0.5 py-1 px-2 gold-tap relative">
            {isPublish ? (
              <div className="w-11 h-11 rounded-xl flex items-center justify-center -mt-3"
                style={{ backgroundColor: C.gold, boxShadow: `0 0 14px rgba(255,184,0,0.5)` }}>
                <item.icon size={22} strokeWidth={3} style={{ color: C.bg }} />
              </div>
            ) : (
              <>
                <item.icon size={20} strokeWidth={active ? 2.5 : 2}
                  style={{ color: active ? C.gold : C.textDim }} />
                <span className="text-[9px] font-medium"
                  style={{ color: active ? C.gold : C.textDim }}>
                  {item.label}
                </span>
                {active && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                    style={{ backgroundColor: C.gold }} />
                )}
              </>
            )}
          </button>
        );
      })}
    </nav>
  );
}

// ═══ APP ═══════════════════════════════════════════════════════════
export default function App() {
// ─── AUTHENTIFICATION SUPABASE ─────────────────────────────────
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  // Écran de lancement Yatsai : durée minimale ~3 s (même si la session
  // se charge plus vite), pour une intro de marque propre.
  const [splashMinElapsed, setSplashMinElapsed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSplashMinElapsed(true), 3000);
    return () => clearTimeout(t);
  }, []);
  const [landingDone, setLandingDone] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState('signup'); // 'signup' | 'login'
  const [permsOnboard, setPermsOnboard] = useState(false); // écran d'autorisations (mobile, 1ère fois)
  const [userProfile, setUserProfile] = useState(null);
  const [videos, setVideos] = useState([]);

  const loadVideos = async () => {
    // 1) Charger les vidéos + auteur + count de likes (via la relation)
    const { data, error } = await supabase
      .from('videos')
      .select(`
        *,
        profiles!videos_user_id_fkey ( id, full_name, username, is_recruiter, avatar_url, sport, level ),
        likes(count)
      `)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Erreur chargement vidéos:', error);
      return;
    }
    setVideos(data || []);
  };

  useEffect(() => {
    loadVideos();
    // Realtime : recharger le feed dès qu'une vidéo est ajoutée/supprimée
    // OU qu'un profil est modifié (changement de niveau, avatar, nom…).
    const channel = supabase
      .channel('videos-feed-realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'videos' },
        () => loadVideos())
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'videos' },
        () => loadVideos())
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          // Patch local : on met à jour le profil intégré aux vidéos
          // concernées sans refaire toute la requête.
          const updated = payload.new;
          if (!updated?.id) return;
          setVideos(prev => prev.map(v =>
            v.user_id === updated.id && v.profiles
              ? { ...v, profiles: { ...v.profiles, ...updated } }
              : v
          ));
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('Erreur chargement profil:', error);
      return;
    }
    // Auto-sync de l'âge en cache si birthdate existe (l'âge change chaque année)
    if (data?.birthdate) {
      const liveAge = computeAge(data.birthdate);
      if (liveAge !== null && liveAge !== data.age) {
        supabase.from('profiles').update({ age: liveAge }).eq('id', userId)
          .then(({ error: upErr }) => {
            if (upErr) console.warn('Auto-sync âge échec:', upErr.message);
          });
        data.age = liveAge; // miroir immédiat en mémoire
      }
    }
    setUserProfile(data);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
      if (session) loadProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setUserProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);
  // Onboarding des permissions natives : à la 1ère ouverture sur mobile, une fois connecté
  useEffect(() => {
    if (!session) return;
    let cancel = false;
    (async () => {
      const native = await isNativeApp();
      let done = false;
      try { done = localStorage.getItem(ONBOARD_FLAG) === '1'; } catch {}
      if (!cancel && native && !done) setPermsOnboard(true);
    })();
    return () => { cancel = true; };
  }, [session]);

  const [mode, setMode] = useState('athlete');
  // Synchroniser le mode avec le rôle du profil Supabase (3 valeurs possibles)
  useEffect(() => {
    if (userProfile) {
      setMode(getUserRole(userProfile)); // 'athlete' | 'recruiter' | 'observer'
    }
  }, [userProfile]);
  const [tab, setTab] = useState('feed');
  const [filtered] = useState(() => SportDetectorAI.filter(VIDEOS));
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [activeChat, setActiveChat] = useState(null);

  // Shortlist mock (ancienne — pour DiscoveryView/SearchView qui utilisent encore les mocks)
  const [shortlistIds, setShortlistIds] = useState(() => new Set([2, 3]));
  const toggleShortlist = (id) => setShortlistIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  // ─── SHORTLIST SUPABASE (recruteurs uniquement) ────────────────
  // Map<athleteUuid, { status, created_at }>
  const [dbShortlist, setDbShortlist] = useState(new Map());

  const loadDbShortlist = async (recruiterId) => {
    const { data, error } = await supabase
      .from('shortlist')
      .select('athlete_id, status, created_at')
      .eq('recruiter_id', recruiterId);
    if (error) { console.error('Erreur chargement shortlist:', error); return; }
    const map = new Map();
    for (const row of data) map.set(row.athlete_id, { status: row.status, created_at: row.created_at });
    setDbShortlist(map);
  };

  const addToDbShortlist = async (athleteId) => {
    if (!userProfile?.id) return;
    const { error } = await supabase.from('shortlist').insert({
      recruiter_id: userProfile.id, athlete_id: athleteId, status: 'en_attente',
    });
    if (error) { console.error('Erreur ajout shortlist:', error); return; }
    setDbShortlist(prev => new Map(prev).set(athleteId, { status: 'en_attente', created_at: new Date().toISOString() }));
  };

  const updateDbShortlistStatus = async (athleteId, status) => {
    if (!userProfile?.id) return;
    const { error } = await supabase.from('shortlist')
      .update({ status })
      .eq('recruiter_id', userProfile.id).eq('athlete_id', athleteId);
    if (error) { console.error('Erreur update statut:', error); return; }
    setDbShortlist(prev => {
      const next = new Map(prev);
      const cur = next.get(athleteId);
      if (cur) next.set(athleteId, { ...cur, status });
      return next;
    });
  };

  const removeFromDbShortlist = async (athleteId) => {
    if (!userProfile?.id) return;
    const { error } = await supabase.from('shortlist')
      .delete().eq('recruiter_id', userProfile.id).eq('athlete_id', athleteId);
    if (error) { console.error('Erreur suppression shortlist:', error); return; }
    setDbShortlist(prev => { const next = new Map(prev); next.delete(athleteId); return next; });
  };

  // Charge la shortlist quand un recruteur se connecte
  useEffect(() => {
    if (userProfile?.is_recruiter && userProfile?.id) {
      loadDbShortlist(userProfile.id);
    } else {
      setDbShortlist(new Map());
    }
  }, [userProfile?.id, userProfile?.is_recruiter]);

  // Realtime : rafraîchir la shortlist quand un statut change (ex: confirmation de signature par l'athlète)
  useEffect(() => {
    if (!userProfile?.is_recruiter || !userProfile?.id) return;
    const channel = supabase
      .channel(`shortlist-${userProfile.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'shortlist',
          filter: `recruiter_id=eq.${userProfile.id}` },
        () => loadDbShortlist(userProfile.id))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProfile?.id, userProfile?.is_recruiter]);

  // ─── ENGAGEMENT (likes / comments / shares counts) ────────────
  // { [videoId]: { likes, comments, shares, likedByMe } }
  const [engagement, setEngagement] = useState({});

  const loadEngagement = async (videoIds, currentUserId) => {
    if (!videoIds || videoIds.length === 0) return;
    const [likesRes, commentsRes, sharesRes, myLikesRes] = await Promise.all([
      supabase.from('likes').select('video_id').in('video_id', videoIds),
      supabase.from('comments').select('video_id').in('video_id', videoIds),
      supabase.from('shares').select('video_id').in('video_id', videoIds),
      currentUserId
        ? supabase.from('likes').select('video_id').eq('user_id', currentUserId).in('video_id', videoIds)
        : Promise.resolve({ data: [] }),
    ]);
    const counts = {};
    for (const id of videoIds) counts[id] = { likes: 0, comments: 0, shares: 0, likedByMe: false };
    for (const r of likesRes.data || []) counts[r.video_id].likes++;
    for (const r of commentsRes.data || []) counts[r.video_id].comments++;
    for (const r of sharesRes.data || []) counts[r.video_id].shares++;
    for (const r of myLikesRes.data || []) counts[r.video_id].likedByMe = true;
    setEngagement(counts);
  };

  // Charge l'engagement quand vidéos ou user changent
  useEffect(() => {
    if (videos.length > 0) {
      loadEngagement(videos.map(v => v.id), userProfile?.id);
    }
  }, [videos, userProfile?.id]);

  // ─── ACTIONS LIKE / COMMENT / SHARE ──────────────────────────
  const toggleLike = async (videoId) => {
    if (!userProfile?.id) return;
    const cur = engagement[videoId];
    const wasLiked = cur?.likedByMe;
    // Optimistic update
    setEngagement(prev => ({
      ...prev,
      [videoId]: {
        ...prev[videoId],
        likedByMe: !wasLiked,
        likes: (prev[videoId]?.likes || 0) + (wasLiked ? -1 : 1),
      },
    }));
    if (wasLiked) {
      const { error } = await supabase.from('likes')
        .delete().eq('user_id', userProfile.id).eq('video_id', videoId);
      if (error) console.error('Erreur unlike:', error);
    } else {
      const { error } = await supabase.from('likes')
        .insert({ user_id: userProfile.id, video_id: videoId });
      if (error) console.error('Erreur like:', error);
    }
  };

  const addComment = async (videoId, body) => {
    if (!userProfile?.id || !body.trim()) return null;
    const { data, error } = await supabase.from('comments')
      .insert({ user_id: userProfile.id, video_id: videoId, body: body.trim() })
      .select('*, profiles!comments_user_id_fkey(full_name)')
      .single();
    if (error) { console.error('Erreur commentaire:', error); return null; }
    setEngagement(prev => ({
      ...prev,
      [videoId]: { ...prev[videoId], comments: (prev[videoId]?.comments || 0) + 1 },
    }));
    return data;
  };

  const deleteComment = async (videoId, commentId) => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) { console.error('Erreur suppression commentaire:', error); return false; }
    setEngagement(prev => ({
      ...prev,
      [videoId]: { ...prev[videoId], comments: Math.max(0, (prev[videoId]?.comments || 0) - 1) },
    }));
    return true;
  };

  // ─── PROFIL : mise à jour ────────────────────────────────────
  const updateProfile = async (updates) => {
    if (!userProfile?.id) return { error: 'Non connecté' };
    const { data, error } = await supabase.from('profiles')
      .update(updates).eq('id', userProfile.id)
      .select().single();
    if (error) { console.error('Erreur update profil:', error); return { error: error.message }; }
    setUserProfile(data);
    return { data };
  };

  // ─── MESSAGES : conversations groupées + envoi + realtime ─────
  // conversations: [{ otherId, otherProfile, lastMessage, unreadCount }]
  const [conversations, setConversations] = useState([]);

  const loadConversations = async (currentUserId) => {
    if (!currentUserId) return;
    const { data, error } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_id, content, read, created_at, video_id')
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .order('created_at', { ascending: false });
    if (error) { console.error('Erreur chargement messages:', error); return; }

    // Groupe par interlocuteur
    const byOther = new Map();
    for (const m of data || []) {
      const otherId = m.sender_id === currentUserId ? m.receiver_id : m.sender_id;
      if (!otherId) continue;
      if (!byOther.has(otherId)) {
        byOther.set(otherId, { otherId, lastMessage: m, unreadCount: 0 });
      }
      const conv = byOther.get(otherId);
      // Compter les non-lus reçus
      if (m.receiver_id === currentUserId && !m.read) conv.unreadCount++;
    }

    const otherIds = Array.from(byOther.keys());
    if (otherIds.length === 0) { setConversations([]); return; }

    const { data: profs, error: pErr } = await supabase
      .from('profiles')
      .select('id, full_name, is_recruiter, organization, sport, avatar_url, level, verified')
      .in('id', otherIds);
    if (pErr) { console.error('Erreur chargement profils messages:', pErr); return; }

    const profileMap = new Map();
    for (const p of profs || []) profileMap.set(p.id, p);

    const list = Array.from(byOther.values())
      .map(c => ({ ...c, otherProfile: profileMap.get(c.otherId) }))
      .filter(c => c.otherProfile)
      .sort((a, b) => new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at));
    setConversations(list);
  };

  // Charger les conversations quand l'utilisateur change
  useEffect(() => {
    if (userProfile?.id) loadConversations(userProfile.id);
    else setConversations([]);
  }, [userProfile?.id]);

  // Realtime : recharger conversations à chaque nouveau message me concernant
  useEffect(() => {
    if (!userProfile?.id) return;
    const channel = supabase
      .channel('messages-feed-' + userProfile.id)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'messages',
          filter: `receiver_id=eq.${userProfile.id}` },
        () => loadConversations(userProfile.id))
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'messages',
          filter: `sender_id=eq.${userProfile.id}` },
        () => loadConversations(userProfile.id))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProfile?.id]);

  // Realtime : patcher les profils embarqués dans les conversations
  // dès qu'un utilisateur modifie son profil (nom, avatar, niveau…).
  useEffect(() => {
    if (!userProfile?.id) return;
    const channel = supabase
      .channel(`conversations-profiles-${userProfile.id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          const updated = payload.new;
          if (!updated?.id) return;
          setConversations(prev => prev.map(c =>
            c.otherId === updated.id
              ? { ...c, otherProfile: { ...c.otherProfile, ...updated } }
              : c
          ));
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProfile?.id]);

  const sendMessage = async (receiverId, content, videoId = null) => {
    if (!userProfile?.id || !content.trim()) return null;
    const payload = {
      sender_id: userProfile.id,
      receiver_id: receiverId,
      content: content.trim(),
    };
    if (videoId) payload.video_id = videoId;
    const { data, error } = await supabase.from('messages')
      .insert(payload).select().single();
    if (error) { console.error('Erreur envoi message:', error); return null; }
    return data;
  };

  // ─── NOTES sur athlètes (recruteurs uniquement) ────────────
  const loadAthleteNote = async (athleteId) => {
    if (!userProfile?.id) return null;
    // Charge la note où je suis recruiter OU où je suis dans shared_with
    const { data, error } = await supabase
      .from('notes')
      .select('id, body, recruiter_id, shared_with, created_at, updated_at')
      .eq('athlete_id', athleteId)
      .or(`recruiter_id.eq.${userProfile.id},shared_with.cs.{${userProfile.id}}`)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) { console.error('Erreur loadAthleteNote:', error); return null; }
    return data;
  };

  // Mettre à jour le partage d'une note (le owner uniquement)
  const updateNoteShare = async (noteId, sharedWithArr) => {
    if (!userProfile?.id) return { error: 'Non connecté' };
    const { error } = await supabase.from('notes')
      .update({ shared_with: sharedWithArr })
      .eq('id', noteId);
    if (error) { console.error('Erreur updateNoteShare:', error); return { error: error.message }; }
    return {};
  };

  const saveAthleteNote = async (athleteId, body, existingId) => {
    if (!userProfile?.id) return { error: 'Non connecté' };
    if (existingId) {
      const { data, error } = await supabase.from('notes')
        .update({ body, updated_at: new Date().toISOString() })
        .eq('id', existingId)
        .select().single();
      if (error) { console.error('Erreur saveAthleteNote update:', error); return { error: error.message }; }
      return { data };
    } else {
      const { data, error } = await supabase.from('notes')
        .insert({ recruiter_id: userProfile.id, athlete_id: athleteId, body })
        .select().single();
      if (error) { console.error('Erreur saveAthleteNote insert:', error); return { error: error.message }; }
      return { data };
    }
  };

  // ─── VIDÉOS SAUVEGARDÉES (bookmark / favoris) ────────────────
  const [savedVideoIds, setSavedVideoIds] = useState(new Set());

  const loadSavedVideoIds = async (uid) => {
    if (!uid) return;
    const { data, error } = await supabase
      .from('saved_videos').select('video_id').eq('user_id', uid);
    if (error) { console.error('Erreur load saved videos:', error); return; }
    setSavedVideoIds(new Set((data || []).map(r => r.video_id)));
  };

  useEffect(() => {
    if (userProfile?.id) loadSavedVideoIds(userProfile.id);
    else setSavedVideoIds(new Set());
  }, [userProfile?.id]);

  const toggleSaveVideo = async (videoId) => {
    if (!userProfile?.id) return;
    const isSaved = savedVideoIds.has(videoId);
    // Optimistic
    setSavedVideoIds(prev => {
      const next = new Set(prev);
      if (isSaved) next.delete(videoId); else next.add(videoId);
      return next;
    });
    if (isSaved) {
      const { error } = await supabase.from('saved_videos').delete()
        .eq('user_id', userProfile.id).eq('video_id', videoId);
      if (error) {
        console.error('Erreur unsave:', error);
        setSavedVideoIds(prev => new Set(prev).add(videoId));
      }
    } else {
      const { error } = await supabase.from('saved_videos')
        .insert({ user_id: userProfile.id, video_id: videoId });
      if (error) {
        console.error('Erreur save:', error);
        setSavedVideoIds(prev => { const n = new Set(prev); n.delete(videoId); return n; });
      }
    }
  };

  const loadSavedVideos = async (uid) => {
    if (!uid) return [];
    const { data, error } = await supabase
      .from('saved_videos')
      .select(`
        video_id, created_at,
        video:videos!saved_videos_video_id_fkey(id, title, description, youtube_url, video_url, thumbnail_url, sport, position, video_type, user_id,
          profiles!videos_user_id_fkey(id, full_name, avatar_url))
      `)
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    if (error) { console.error('Erreur loadSavedVideos:', error); return []; }
    return (data || []).map(r => r.video).filter(Boolean);
  };

  // Mise à jour des liens externes (réseaux sociaux + apps fitness)
  const updateSocialLinks = async (newLinks) => {
    if (!userProfile?.id) return { error: 'Non connecté' };
    const { data, error } = await supabase.from('profiles')
      .update({ social_links: newLinks })
      .eq('id', userProfile.id)
      .select().single();
    if (error) { console.error('Erreur updateSocialLinks:', error); return { error: error.message }; }
    setUserProfile(data);
    return { data };
  };

  const deleteVideo = async (videoId) => {
    if (!userProfile?.id) return { error: 'Non connecté' };
    // 1) Récupère les URLs Storage avant suppression pour pouvoir nettoyer le bucket
    const { data: vRow } = await supabase.from('videos')
      .select('video_url, thumbnail_url, user_id')
      .eq('id', videoId).maybeSingle();

    const { error } = await supabase.from('videos').delete().eq('id', videoId);
    if (error) { console.error('Erreur deleteVideo:', error); return { error: error.message }; }

    // 2) Si la vidéo était uploadée, on supprime aussi les fichiers du bucket "videos"
    if (vRow?.video_url || vRow?.thumbnail_url) {
      const pathsToRemove = [];
      const extractPath = (url) => {
        try {
          // public URL = .../storage/v1/object/public/videos/<path>
          const m = url?.match(/\/storage\/v1\/object\/public\/videos\/(.+)$/);
          return m ? decodeURIComponent(m[1]) : null;
        } catch { return null; }
      };
      const vp = extractPath(vRow.video_url);
      const tp = extractPath(vRow.thumbnail_url);
      if (vp) pathsToRemove.push(vp);
      if (tp) pathsToRemove.push(tp);
      if (pathsToRemove.length > 0) {
        const { error: rmErr } = await supabase.storage.from('videos').remove(pathsToRemove);
        if (rmErr) console.warn('Nettoyage Storage videos:', rmErr.message);
      }
    }

    // Optimistic local removal
    setVideos(prev => prev.filter(v => v.id !== videoId));
    return {};
  };

  const deleteMessage = async (messageId) => {
    if (!userProfile?.id) return { error: 'Non connecté' };
    const { error } = await supabase.from('messages').delete().eq('id', messageId);
    if (error) { console.error('Erreur deleteMessage:', error); return { error: error.message }; }
    return {};
  };

  const markConversationAsRead = async (otherId) => {
    if (!userProfile?.id) return;
    const { error } = await supabase.from('messages')
      .update({ read: true })
      .eq('receiver_id', userProfile.id)
      .eq('sender_id', otherId)
      .eq('read', false);
    if (error) { console.error('Erreur mark read:', error); return; }
    // Optimistic local update
    setConversations(prev => prev.map(c => c.otherId === otherId ? { ...c, unreadCount: 0 } : c));
  };

  // ─── NOTIFICATIONS ──────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [notifUnread, setNotifUnread] = useState(0);

  const loadNotifications = async (userId) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*, actor:profiles!notifications_actor_id_fkey(id, full_name, avatar_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) { console.error('Erreur loadNotifications:', error); return; }
    setNotifications(data || []);
    setNotifUnread((data || []).filter(n => !n.read).length);
  };

  useEffect(() => {
    if (userProfile?.id) loadNotifications(userProfile.id);
    else { setNotifications([]); setNotifUnread(0); }
  }, [userProfile?.id]);

  // Realtime sur notifications
  useEffect(() => {
    if (!userProfile?.id) return;
    const channel = supabase
      .channel('notifications-' + userProfile.id)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications',
          filter: `user_id=eq.${userProfile.id}` },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev].slice(0, 50));
          if (!payload.new.read) setNotifUnread(c => c + 1);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProfile?.id]);

  const markAllNotificationsRead = async () => {
    if (!userProfile?.id || notifUnread === 0) return;
    const { error } = await supabase.from('notifications')
      .update({ read: true })
      .eq('user_id', userProfile.id)
      .eq('read', false);
    if (error) { console.error('Erreur markAllNotificationsRead:', error); return; }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setNotifUnread(0);
  };

  const deleteNotification = async (id) => {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) { console.error('Erreur deleteNotification:', error); return; }
    setNotifications(prev => prev.filter(n => n.id !== id));
    setNotifUnread(prev => {
      const removed = notifications.find(n => n.id === id);
      return removed && !removed.read ? Math.max(0, prev - 1) : prev;
    });
  };

  // ─── SIGNED POSTS (photos avec joueurs signés) ─────────────
  const loadSignedPosts = async (recruiterId) => {
    if (!recruiterId) return [];
    const { data, error } = await supabase
      .from('signed_posts')
      .select('*, athlete:profiles!signed_posts_athlete_id_fkey(id, full_name, avatar_url, sport)')
      .eq('recruiter_id', recruiterId)
      .order('created_at', { ascending: false });
    if (error) { console.error('Erreur loadSignedPosts:', error); return []; }
    return data || [];
  };

  const createSignedPost = async (file, caption, athleteId) => {
    if (!userProfile?.id || !file) return { error: 'Données manquantes' };
    const { url, error: upErr } = await uploadImage(file, 'signed-posts', userProfile.id);
    if (upErr) return { error: upErr };
    const { data, error: insErr } = await supabase.from('signed_posts').insert({
      recruiter_id: userProfile.id,
      athlete_id: athleteId || null,
      image_url: url,
      caption: caption?.trim() || null,
    }).select().single();
    if (insErr) { console.error('Erreur création signed post:', insErr); return { error: insErr.message }; }
    return { data };
  };

  const deleteSignedPost = async (postId) => {
    const { error } = await supabase.from('signed_posts').delete().eq('id', postId);
    if (error) { console.error('Erreur suppression signed post:', error); return { error: error.message }; }
    return {};
  };

  // Liste des athlètes signés (pour le select dans la modal)
  const loadSignedAthletes = async (recruiterId) => {
    if (!recruiterId) return [];
    const { data, error } = await supabase
      .from('shortlist')
      .select('athlete_id, athlete:profiles!shortlist_athlete_id_fkey(id, full_name, avatar_url, sport)')
      .eq('recruiter_id', recruiterId)
      .eq('status', 'signe');
    if (error) { console.error('Erreur loadSignedAthletes:', error); return []; }
    return (data || []).map(r => r.athlete).filter(Boolean);
  };

  // ─── CANDIDATURES (athlète → recruteurs) ────────────────────
  // Renvoie le set des recruteurs déjà contactés (pour griser dans la modale)
  const loadMyApplications = async (athleteId) => {
    if (!athleteId) return new Set();
    const { data, error } = await supabase
      .from('applications').select('recruiter_id').eq('athlete_id', athleteId);
    if (error) { console.error('Erreur loadMyApplications:', error); return new Set(); }
    return new Set((data || []).map(r => r.recruiter_id));
  };

  // Envoi groupé de candidatures + message dans la conversation
  // videoIds : tableau de uuids de vidéos à joindre (optionnel)
  const sendApplications = async (recruiterIds, messageText, videoIds = []) => {
    if (!userProfile?.id || recruiterIds.length === 0) return { error: 'Données manquantes' };
    const trimmed = (messageText || '').trim();
    const playerName = userProfile.full_name || 'Un athlète';

    // Pré-charger les vidéos jointes pour construire les URLs dans le message
    let attachedVideos = [];
    if (videoIds.length > 0) {
      const { data } = await supabase.from('videos')
        .select('id, title, youtube_url, video_url').in('id', videoIds);
      attachedVideos = data || [];
    }
    const videosBlock = attachedVideos.length === 0 ? '' :
      `\n\n🎬 Vidéos jointes :\n` + attachedVideos.map(v => `• ${v.title || 'Vidéo'} — ${v.youtube_url || v.video_url}`).join('\n');

    let sent = 0; let skipped = 0; const errors = [];
    for (const rid of recruiterIds) {
      const { error: aErr } = await supabase.from('applications').insert({
        athlete_id: userProfile.id,
        recruiter_id: rid,
        message: trimmed || null,
        sport: userProfile.sport || null,
        video_ids: videoIds,
      });
      if (aErr) {
        if (aErr.code === '23505' || aErr.message?.includes('unique')) { skipped++; continue; }
        errors.push(aErr.message); continue;
      }
      // Message visible dans la conversation (inclut les liens vidéos si présents)
      const body = `📨 Candidature de ${playerName}\n\n${trimmed || '(sans message)'}${videosBlock}`;
      await supabase.from('messages').insert({
        sender_id: userProfile.id, receiver_id: rid, content: body,
      });
      sent++;
    }
    return { sent, skipped, errors };
  };

  // ─── Signatures (workflow anti-fraude) ──────────────────────
  // Map<athleteId, { id, status, recruiter_message }> des demandes pending
  // créées par moi (recruteur) — pour griser le statut Signé pendant l'attente
  const [pendingSignings, setPendingSignings] = useState(new Map());

  const loadMyPendingSignings = async (recruiterId) => {
    if (!recruiterId) return;
    const { data, error } = await supabase
      .from('signing_confirmations')
      .select('id, athlete_id, status, recruiter_message')
      .eq('recruiter_id', recruiterId)
      .eq('status', 'pending');
    if (error) { console.error('Erreur loadMyPendingSignings:', error); return; }
    const m = new Map();
    for (const r of data || []) m.set(r.athlete_id, r);
    setPendingSignings(m);
  };

  useEffect(() => {
    if (userProfile?.is_recruiter && userProfile?.id) loadMyPendingSignings(userProfile.id);
    else setPendingSignings(new Map());
  }, [userProfile?.id, userProfile?.is_recruiter]);

  // Recruteur demande une confirmation de signature
  const requestSigningConfirmation = async (athleteId, message) => {
    if (!userProfile?.id) return { error: 'Non connecté' };
    // 1. Créer la demande
    const { data: conf, error: insErr } = await supabase
      .from('signing_confirmations')
      .insert({
        recruiter_id: userProfile.id,
        athlete_id: athleteId,
        recruiter_message: message?.trim() || null,
      })
      .select().single();
    if (insErr) { console.error('Erreur création signing:', insErr); return { error: insErr.message }; }

    // 2. Passer le statut shortlist à signe_pending
    await supabase.from('shortlist')
      .update({ status: 'signe_pending' })
      .eq('recruiter_id', userProfile.id).eq('athlete_id', athleteId);
    setDbShortlist(prev => {
      const next = new Map(prev);
      const cur = next.get(athleteId);
      if (cur) next.set(athleteId, { ...cur, status: 'signe_pending' });
      return next;
    });

    // 3. Envoyer un message au joueur
    const recruiterName = userProfile.full_name || 'Un recruteur';
    const body = `📝 ${recruiterName} a déclaré t'avoir signé. Confirme ou refuse depuis cette conversation.`
      + (message?.trim() ? `\n\nMessage : « ${message.trim()} »` : '');
    await supabase.from('messages').insert({
      sender_id: userProfile.id,
      receiver_id: athleteId,
      content: body,
    });

    setPendingSignings(prev => new Map(prev).set(athleteId, conf));
    return { data: conf };
  };

  // Athlete confirme ou refuse une signature
  const respondToSigning = async (confirmationId, accepted, reply) => {
    if (!userProfile?.id) return { error: 'Non connecté' };
    const newStatus = accepted ? 'confirmed' : 'refused';

    const { data: conf, error: upErr } = await supabase
      .from('signing_confirmations')
      .update({
        status: newStatus,
        athlete_reply: reply?.trim() || null,
        decided_at: new Date().toISOString(),
      })
      .eq('id', confirmationId)
      .eq('athlete_id', userProfile.id)
      .select().single();
    if (upErr) { console.error('Erreur respondToSigning:', upErr); return { error: upErr.message }; }

    // Le trigger SQL sync_shortlist_on_signing_decision met à jour shortlist.status
    // automatiquement côté serveur (l'athlète n'a pas les droits RLS pour le faire).

    // Envoyer un message de retour au recruteur
    const playerName = userProfile.full_name || 'Le joueur';
    const body = accepted
      ? `✅ ${playerName} a confirmé sa signature.` + (reply?.trim() ? `\n\n« ${reply.trim()} »` : '')
      : `❌ ${playerName} a refusé la déclaration de signature.` + (reply?.trim() ? `\n\nRaison : « ${reply.trim()} »` : '');
    await supabase.from('messages').insert({
      sender_id: userProfile.id,
      receiver_id: conf.recruiter_id,
      content: body,
    });

    return { data: conf };
  };

  // Compte les joueurs signés (status = 'signe') d'un recruteur
  const loadSignedCount = async (recruiterId) => {
    if (!recruiterId) return 0;
    const { count, error } = await supabase
      .from('shortlist')
      .select('athlete_id', { count: 'exact', head: true })
      .eq('recruiter_id', recruiterId)
      .eq('status', 'signe');
    if (error) { console.error('Erreur loadSignedCount:', error); return 0; }
    return count || 0;
  };

  // Charge la signing pending entre l'utilisateur courant et un autre user (peu importe le sens)
  const loadPendingSigningWith = async (otherUserId) => {
    if (!userProfile?.id || !otherUserId) return null;
    const { data, error } = await supabase
      .from('signing_confirmations')
      .select('*')
      .or(`and(recruiter_id.eq.${userProfile.id},athlete_id.eq.${otherUserId}),and(recruiter_id.eq.${otherUserId},athlete_id.eq.${userProfile.id})`)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) { console.error('Erreur loadPendingSigningWith:', error); return null; }
    return data;
  };

  // ─── SIGNALEMENTS ──────────────────────────────────────────
  const submitReport = async ({ targetType, targetId, reason, description }) => {
    if (!userProfile?.id) return { error: 'Non connecté' };
    const { error } = await supabase.from('reports').insert({
      reporter_id: userProfile.id,
      target_type: targetType,
      target_id: targetId,
      reason,
      description,
    });
    if (error) { console.error('Erreur signalement:', error); return { error: error.message }; }
    return {};
  };

  // ─── ABONNEMENTS (follows) ──────────────────────────────────
  // Set des userIds que l'utilisateur courant suit
  const [myFollowing, setMyFollowing] = useState(new Set());

  // ─── ALGORITHME DE FEED (placé après myFollowing pour éviter ReferenceError) ──
  const [feedPeriodFilter, setFeedPeriodFilter] = useState(null);
  const [feedTypeFilter, setFeedTypeFilter] = useState(null); // null | 'match' | 'training'

  const scoredVideos = useMemo(() => {
    if (!Array.isArray(videos) || videos.length === 0) return [];
    const now = Date.now();
    const userSport = userProfile?.sport;
    return videos
      .map(v => {
        const createdAt = v.created_at ? new Date(v.created_at).getTime() : now;
        const ageDays = Math.max(0, (now - createdAt) / (1000 * 60 * 60 * 24));
        const recency = Math.exp(-ageDays / 21);
        const likesCount = v.likes?.[0]?.count || 0;
        const likesScore = Math.log(1 + likesCount);
        let prefScore = 0;
        if (userSport && v.sport === userSport) prefScore += 0.3;
        if (v.user_id && myFollowing?.has(v.user_id)) prefScore += 0.6;
        const score = recency * 1.0 + likesScore * 0.35 + prefScore;
        return { ...v, _likesCount: likesCount, _ageDays: ageDays, _score: score };
      })
      .sort((a, b) => b._score - a._score);
  }, [videos, userProfile?.sport, myFollowing]);

  const feedVideos = useMemo(() => {
    let list = scoredVideos;
    if (feedPeriodFilter) list = list.filter(v => v._ageDays <= feedPeriodFilter);
    if (feedTypeFilter) list = list.filter(v => v.video_type === feedTypeFilter);
    return list;
  }, [scoredVideos, feedPeriodFilter, feedTypeFilter]);

  const loadMyFollowing = async (currentId) => {
    if (!currentId) return;
    const { data, error } = await supabase
      .from('follows').select('following_id').eq('follower_id', currentId);
    if (error) { console.error('Erreur chargement following:', error); return; }
    setMyFollowing(new Set((data || []).map(r => r.following_id)));
  };

  useEffect(() => {
    if (userProfile?.id) loadMyFollowing(userProfile.id);
    else setMyFollowing(new Set());
  }, [userProfile?.id]);

  const followUser = async (userId) => {
    if (!userProfile?.id || userId === userProfile.id) return;
    // Optimistic
    setMyFollowing(prev => new Set(prev).add(userId));
    const { error } = await supabase.from('follows')
      .insert({ follower_id: userProfile.id, following_id: userId });
    if (error) {
      console.error('Erreur follow:', error);
      setMyFollowing(prev => { const n = new Set(prev); n.delete(userId); return n; });
    }
  };

  const unfollowUser = async (userId) => {
    if (!userProfile?.id) return;
    setMyFollowing(prev => { const n = new Set(prev); n.delete(userId); return n; });
    const { error } = await supabase.from('follows')
      .delete().eq('follower_id', userProfile.id).eq('following_id', userId);
    if (error) {
      console.error('Erreur unfollow:', error);
      setMyFollowing(prev => new Set(prev).add(userId));
    }
  };

  // Compteurs (followers + following) pour un user donné
  const loadFollowCounts = async (userId) => {
    if (!userId) return { followers: 0, following: 0 };
    const [followersRes, followingRes] = await Promise.all([
      supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', userId),
    ]);
    return { followers: followersRes.count || 0, following: followingRes.count || 0 };
  };

  // Liste des followers ou following d'un user
  const loadFollowList = async (userId, kind) => {
    // kind: 'followers' (qui suit userId) | 'following' (que userId suit)
    const col = kind === 'followers' ? 'follower_id' : 'following_id';
    const filterCol = kind === 'followers' ? 'following_id' : 'follower_id';
    const { data, error } = await supabase
      .from('follows').select(col).eq(filterCol, userId);
    if (error) { console.error('Erreur loadFollowList:', error); return []; }
    const ids = (data || []).map(r => r[col]).filter(Boolean);
    if (ids.length === 0) return [];
    const { data: profs, error: pErr } = await supabase
      .from('profiles').select('id, full_name, is_recruiter, organization, sport, verified').in('id', ids);
    if (pErr) { console.error('Erreur chargement profils:', pErr); return []; }
    return profs || [];
  };

  const recordShare = async (videoId, channel = 'external', sharedWithId = null) => {
    if (!userProfile?.id) return;
    const { error } = await supabase.from('shares').insert({
      user_id: userProfile.id, video_id: videoId, channel, shared_with_id: sharedWithId,
    });
    if (error) { console.error('Erreur partage:', error); return; }
    setEngagement(prev => ({
      ...prev,
      [videoId]: { ...prev[videoId], shares: (prev[videoId]?.shares || 0) + 1 },
    }));
  };

  // Notes mock (pour ShortlistView mock — remplacé plus bas par version DB)
  const [notes, setNotes] = useState({
    2: [{ id: 'n1', body: 'Sprint impressionnant. À revoir en compétition officielle.', createdAt: '2026-04-20T14:32:00Z' }],
  });
  const addNote = (athleteId, body) => setNotes(prev => ({
    ...prev,
    [athleteId]: [{ id: `n${Date.now()}`, body, createdAt: new Date().toISOString() }, ...(prev[athleteId] ?? [])],
  }));
  const updateNote = (athleteId, noteId, newBody) => setNotes(prev => ({
    ...prev,
    [athleteId]: (prev[athleteId] ?? []).map(n =>
      n.id === noteId ? { ...n, body: newBody, updatedAt: new Date().toISOString() } : n
    ),
  }));
  const deleteNote = (athleteId, noteId) => setNotes(prev => ({
    ...prev,
    [athleteId]: (prev[athleteId] ?? []).filter(n => n.id !== noteId),
  }));

  const switchMode = (newMode) => { setMode(newMode); setTab('feed'); };

  // Profile editor modal
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  // New conversation modal
  const [newConvOpen, setNewConvOpen] = useState(false);
  // Profil utilisateur ouvert (overlay)
  const [selectedProfile, setSelectedProfile] = useState(null);
  const openProfile = async (profile) => {
    if (!profile?.id) return;
    // Affichage immédiat avec ce qu'on a déjà…
    setSelectedProfile(profile);
    // …puis on complète avec le profil COMPLET (bannière, bio, localisation, etc.)
    // quel que soit l'endroit d'où on l'ouvre (feed, partage, messagerie…).
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', profile.id).single();
      if (data) setSelectedProfile(prev => (prev && prev.id === data.id ? data : prev));
    } catch {}
  };

  // FollowsListModal state : { userId, kind: 'followers'|'following' }
  const [followsList, setFollowsList] = useState(null);
  const showFollowList = (userId, kind) => setFollowsList({ userId, kind });

  // ReportModal state : { targetType, targetId, targetLabel }
  const [reportTarget, setReportTarget] = useState(null);
  const openReport = (targetType, targetId, targetLabel) =>
    setReportTarget({ targetType, targetId, targetLabel });

  // SignRequestModal state : athlete profile
  const [signRequestAthlete, setSignRequestAthlete] = useState(null);
  const openSignRequest = (athlete) => setSignRequestAthlete(athlete);

  // CandidatureModal state
  const [candidatureOpen, setCandidatureOpen] = useState(false);

  // SignedPostModal state : { onAfterCreate?: () => void }
  const [signedPostOpen, setSignedPostOpen] = useState(null);
  const openSignedPostModal = (onAfterCreate) => setSignedPostOpen({ onAfterCreate });

  // Modal liste des athlètes signés d'un recruteur
  const [signedListRecruiterId, setSignedListRecruiterId] = useState(null);
  const showSignedAthletes = (recruiterId) => setSignedListRecruiterId(recruiterId);

  // Notes athlète (éditeur Word-like)
  const [notesAthlete, setNotesAthlete] = useState(null);
  const openAthleteNotes = (athlete) => setNotesAthlete(athlete);

  // Modal Partage profil (QR + réseaux sociaux)
  const [shareProfileOpen, setShareProfileOpen] = useState(false);

  // SettingsView state
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Search overlay sur le feed (loupe en haut à gauche)
  const [feedSearchOpen, setFeedSearchOpen] = useState(false);
  const [searchPlayingVideo, setSearchPlayingVideo] = useState(null);
  // Notifications panel
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);

  // L'AthleteProfile (mocks) appelait openChatWithAthlete — on garde un noop pour ne pas casser
  // l'UI mock. Pour les vraies conversations, on passe par openChatWithProfile (Supabase).
  const openChatWithAthlete = (athlete) => {
    setSelectedAthlete(null);
    setTab('messages');
    // L'AthleteProfile mock n'a pas de user_id Supabase → on ne peut pas ouvrir un vrai chat
    console.warn('Chat avec athlète mock non supporté:', athlete?.name);
  };

  const openChatWithProfile = (profile) => {
    setActiveChat({ otherProfile: profile });
    setNewConvOpen(false);
  };

  const handleAddToShortlistFromVideo = (video) => {
    if (!video.user_id) return;
    if (video.user_id === userProfile?.id) return;
    if (dbShortlist.has(video.user_id)) return;
    addToDbShortlist(video.user_id);
  };

  const feedProps = {
    videos: feedVideos,
    periodFilter: feedPeriodFilter,
    onChangePeriodFilter: setFeedPeriodFilter,
    typeFilter: feedTypeFilter,
    onChangeTypeFilter: setFeedTypeFilter,
    engagement,
    currentUserId: userProfile?.id,
    isRecruiter: userProfile?.is_recruiter,
    canBookmark: canBookmarkVideos(userProfile),
    dbShortlist,
    onLike: toggleLike,
    onAddComment: addComment,
    onDeleteComment: deleteComment,
    onShare: recordShare,
    onAddToShortlist: handleAddToShortlistFromVideo,
    onSelectProfile: openProfile,
    onOpenSearch: () => setFeedSearchOpen(true),
    onReport: openReport,
    savedVideoIds,
    onToggleSaveVideo: toggleSaveVideo,
    onOpenNotifications: () => setNotifPanelOpen(true),
    notifUnreadCount: notifUnread,
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const messagesProps = {
    conversations,
    currentUserId: userProfile?.id,
    onOpenChat: (c) => setActiveChat({ otherProfile: c.otherProfile }),
    onNewConversation: () => setNewConvOpen(true),
    onSelectProfile: openProfile,
    isRecruiter: !!userProfile?.is_recruiter,
    isAthlete: isAthleteRole(userProfile),
    onOpenCandidature: () => setCandidatureOpen(true),
  };

  const renderScreen = () => {
    if (mode === 'recruiter') {
      switch (tab) {
        case 'feed':      return <FeedView {...feedProps} />;
        case 'discover':  return <DiscoveryView currentUserId={userProfile?.id}
                                  onSelectProfile={openProfile}
                                  dbShortlist={dbShortlist}
                                  onAddToShortlist={addToDbShortlist}
                                  onRemoveFromShortlist={removeFromDbShortlist} />;
        case 'shortlist': return <ShortlistView dbShortlist={dbShortlist}
                                  onUpdateStatus={updateDbShortlistStatus}
                                  onRemove={removeFromDbShortlist}
                                  onSelectProfile={openProfile}
                                  onRequestSign={openSignRequest}
                                  onOpenNotes={openAthleteNotes} />;
        case 'messages':  return <MessagesView {...messagesProps} />;
        case 'profile':   return <RecruiterProfileView userProfile={userProfile} userEmail={session?.user?.email}
                                  onLogout={handleLogout} onEdit={() => setProfileEditorOpen(true)}
                                  onShowFollowList={showFollowList} onLoadFollowCounts={loadFollowCounts}
                                  onLoadSignedPosts={loadSignedPosts}
                                  onDeleteSignedPost={deleteSignedPost}
                                  onOpenSignedPostModal={openSignedPostModal}
                                  onSelectProfile={openProfile}
                                  onLoadSignedCount={loadSignedCount}
                                  onShowSignedAthletes={showSignedAthletes}
                                  onOpenSettings={() => setSettingsOpen(true)}
                                  onShareProfile={() => setShareProfileOpen(true)}
                                  onLoadSavedVideos={loadSavedVideos}
                                  onToggleSaveVideo={toggleSaveVideo}
                                  onPlayVideo={(v) => setSearchPlayingVideo(v)} />;
        default: return null;
      }
    }
    // Branche observateur : pas de publish, pas de shortlist, pas de vidéos publiées
    if (mode === 'observer') {
      switch (tab) {
        case 'feed':     return <FeedView {...feedProps} />;
        case 'search':   return <SearchView currentUserId={userProfile?.id} onSelectProfile={openProfile} onPlayVideo={(v) => setSearchPlayingVideo(v)} />;
        case 'messages': return <MessagesView {...messagesProps} />;
        case 'profile':  return <ObserverProfileView userProfile={userProfile}
                                  onEdit={() => setProfileEditorOpen(true)}
                                  onShowFollowList={showFollowList} onLoadFollowCounts={loadFollowCounts}
                                  onOpenSettings={() => setSettingsOpen(true)}
                                  onShareProfile={() => setShareProfileOpen(true)}
                                  onLoadSavedVideos={loadSavedVideos}
                                  onToggleSaveVideo={toggleSaveVideo}
                                  onPlayVideo={(v) => setSearchPlayingVideo(v)} />;
        default: return null;
      }
    }
    switch (tab) {
      case 'feed':     return <FeedView {...feedProps} />;
      case 'search':   return <SearchView currentUserId={userProfile?.id} onSelectProfile={openProfile} onPlayVideo={(v) => setSearchPlayingVideo(v)} />;
      case 'publish':   return <PublishView userProfile={userProfile} setTab={setTab} />;
      case 'messages': return <MessagesView {...messagesProps} />;
      case 'profile':   return <ProfileView userProfile={userProfile} userEmail={session?.user?.email}
                                onLogout={handleLogout} onEdit={() => setProfileEditorOpen(true)}
                                onShowFollowList={showFollowList} onLoadFollowCounts={loadFollowCounts}
                                onDeleteVideo={deleteVideo}
                                onOpenSettings={() => setSettingsOpen(true)}
                                onShareProfile={() => setShareProfileOpen(true)} />;
      default: return null;
    }
  };
// Écran de lancement Yatsai — affiché pendant le chargement de la session
// ET au moins 3 secondes (intro de marque).
  if (authLoading || !splashMinElapsed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: '#080F20' }}>
        {/* Halo doré */}
        <div className="absolute" style={{
          width: 420, height: 420, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,184,0,0.18) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }} />
        <div className="relative text-5xl font-extrabold fade-in"
          style={{ color: '#FFFFFF', letterSpacing: '-0.03em' }}>
          Yat<span style={{ color: '#FFB800' }}>sai</span>
        </div>
        <div className="relative mt-6">
          <Loader2 size={22} className="animate-spin" style={{ color: 'rgba(255,184,0,0.7)' }} />
        </div>
      </div>
    );
  }

  // Pas connecté → Landing page puis écran d'authentification
  if (!session) {
    if (!landingDone) {
      return <LandingPage onStart={(mode) => { setLandingDone(true); setAuthInitialMode(mode); }} />;
    }
    return <Auth initialMode={authInitialMode} />;
  }

  return (
    <div className="relative" style={{ backgroundColor: C.bg, minHeight: '100dvh' }}>
      <FontStyles />
      {/* Écran d'autorisations natif (mobile, première ouverture) */}
      {permsOnboard && <PermissionsOnboarding onDone={() => setPermsOnboard(false)} />}
      {renderScreen()}
      <BottomNav tab={tab} setTab={setTab} mode={mode} />

      {activeChat?.otherProfile && (
        <div className="fixed inset-0 z-[60]" style={{ backgroundColor: C.bg }}>
          <ChatView
            otherProfile={activeChat.otherProfile}
            currentUserId={userProfile?.id}
            onBack={() => { setActiveChat(null); loadConversations(userProfile?.id); }}
            onSendMessage={sendMessage}
            onMarkRead={markConversationAsRead}
            onSelectProfile={openProfile}
            onLoadPendingSigning={loadPendingSigningWith}
            onRespondToSigning={respondToSigning}
            onDeleteMessage={deleteMessage}
          />
        </div>
      )}

      {selectedProfile && (
        <UserProfileView
          profile={selectedProfile}
          currentUserId={userProfile?.id}
          isViewerRecruiter={!!userProfile?.is_recruiter}
          shortlistStatus={dbShortlist.get(selectedProfile.id)?.status}
          isFollowing={myFollowing.has(selectedProfile.id)}
          onFollow={followUser}
          onUnfollow={unfollowUser}
          onLoadFollowCounts={loadFollowCounts}
          onShowFollowList={showFollowList}
          onClose={() => setSelectedProfile(null)}
          onContact={() => {
            setActiveChat({ otherProfile: selectedProfile });
            setSelectedProfile(null);
            setTab('messages');
          }}
          onAddToShortlist={addToDbShortlist}
          onRemoveFromShortlist={removeFromDbShortlist}
          onPlayVideo={() => {}}
          onReport={openReport}
          onLoadSignedPosts={loadSignedPosts}
          onSelectProfile={openProfile}
          onLoadSignedCount={loadSignedCount}
          onShowSignedAthletes={showSignedAthletes}
          onDeleteVideo={deleteVideo}
        />
      )}

      {settingsOpen && (
        <SettingsView
          userProfile={userProfile}
          userEmail={session?.user?.email}
          onClose={() => setSettingsOpen(false)}
          onLogout={async () => { await handleLogout(); setSettingsOpen(false); }}
        />
      )}

      {signedListRecruiterId && (
        <SignedAthletesListModal
          recruiterId={signedListRecruiterId}
          onClose={() => setSignedListRecruiterId(null)}
          onLoadSignedAthletes={loadSignedAthletes}
          onSelectProfile={openProfile}
        />
      )}

      {notesAthlete && (
        <AthleteNotesEditor
          athlete={notesAthlete}
          currentUserId={userProfile?.id}
          onClose={() => setNotesAthlete(null)}
          onLoad={loadAthleteNote}
          onSave={saveAthleteNote}
          onUpdateShare={updateNoteShare}
        />
      )}

      {shareProfileOpen && (
        <ShareProfileModal userProfile={userProfile} onClose={() => setShareProfileOpen(false)} />
      )}

      {followsList && (
        <FollowsListModal
          userId={followsList.userId}
          kind={followsList.kind}
          currentUserId={userProfile?.id}
          myFollowing={myFollowing}
          onClose={() => setFollowsList(null)}
          onLoadList={loadFollowList}
          onSelectProfile={openProfile}
          onFollow={followUser}
          onUnfollow={unfollowUser}
        />
      )}

      {reportTarget && (
        <ReportModal
          targetType={reportTarget.targetType}
          targetId={reportTarget.targetId}
          targetLabel={reportTarget.targetLabel}
          onClose={() => setReportTarget(null)}
          onSubmit={submitReport}
        />
      )}

      {signRequestAthlete && (
        <SignRequestModal
          athlete={signRequestAthlete}
          onClose={() => setSignRequestAthlete(null)}
          onConfirm={requestSigningConfirmation}
        />
      )}

      {candidatureOpen && (
        <CandidatureModal
          currentUser={userProfile}
          onClose={() => setCandidatureOpen(false)}
          onLoadAlreadyApplied={loadMyApplications}
          onSend={sendApplications}
        />
      )}

      {signedPostOpen && (
        <SignedPostModal
          currentUserId={userProfile?.id}
          onLoadSignedAthletes={loadSignedAthletes}
          onClose={() => setSignedPostOpen(null)}
          onCreate={async (file, caption, athleteId) => {
            const res = await createSignedPost(file, caption, athleteId);
            if (!res.error) signedPostOpen.onAfterCreate?.();
            return res;
          }}
        />
      )}

      {/* Onboarding permissions : à la 1ère connexion d'un user qui ne l'a pas encore vu */}
      {userProfile && userProfile.permissions_asked === false && (
        <PermissionsModal
          onFinish={async () => {
            await supabase.from('profiles')
              .update({ permissions_asked: true })
              .eq('id', userProfile.id);
            setUserProfile(prev => prev ? { ...prev, permissions_asked: true } : prev);
          }}
        />
      )}

      {/* Rappel saisonnier (août/septembre) — championnat à mettre à jour */}
      {userProfile && shouldShowSeasonReminder(userProfile) && (
        <SeasonReminderBanner
          onEdit={async () => {
            const now = new Date().toISOString();
            await supabase.from('profiles')
              .update({ season_reminder_dismissed_at: now })
              .eq('id', userProfile.id);
            setUserProfile(prev => prev ? { ...prev, season_reminder_dismissed_at: now } : prev);
            setProfileEditorOpen(true);
          }}
          onDismiss={async () => {
            const now = new Date().toISOString();
            await supabase.from('profiles')
              .update({ season_reminder_dismissed_at: now })
              .eq('id', userProfile.id);
            setUserProfile(prev => prev ? { ...prev, season_reminder_dismissed_at: now } : prev);
          }}
        />
      )}

      {feedSearchOpen && (
        <FeedSearchInline
          currentUserId={userProfile?.id}
          isRecruiter={!!userProfile?.is_recruiter}
          dbShortlist={dbShortlist}
          onAddToShortlist={addToDbShortlist}
          onRemoveFromShortlist={removeFromDbShortlist}
          onSelectProfile={openProfile}
          onPlayVideo={(v) => setSearchPlayingVideo(v)}
          onClose={() => setFeedSearchOpen(false)} />
      )}

      {/* Lecteur vidéo overlay — déclenché depuis la recherche du feed */}
      {searchPlayingVideo && (
        <YouTubePlayer video={searchPlayingVideo} onClose={() => setSearchPlayingVideo(null)} />
      )}

      {notifPanelOpen && (
        <NotificationsPanel
          notifications={notifications}
          currentUserId={userProfile?.id}
          onClose={() => setNotifPanelOpen(false)}
          onMarkAllRead={markAllNotificationsRead}
          onDelete={deleteNotification}
          onSelectProfile={openProfile}
        />
      )}

      {profileEditorOpen && (
        <ProfileEditor
          userProfile={userProfile}
          isRecruiter={!!userProfile?.is_recruiter}
          onClose={() => setProfileEditorOpen(false)}
          onSave={updateProfile}
        />
      )}

      {newConvOpen && (
        <NewConversationModal
          currentUserId={userProfile?.id}
          onClose={() => setNewConvOpen(false)}
          onSelect={openChatWithProfile}
          onSelectProfile={(u) => { setNewConvOpen(false); openProfile(u); }}
        />
      )}
    </div>
  );
}
