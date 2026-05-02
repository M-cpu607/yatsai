import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Heart, MessageCircle, Bookmark, Share2, Volume2, VolumeX,
  Plus, Search, User, Home, Inbox, Sparkles, BadgeCheck,
  ChevronDown, ChevronUp, RotateCcw, Camera, X, ArrowLeft,
  Play, Pause, MapPin as PinIcon, Trash2, CheckCircle2, ArrowDown,
  Briefcase, Star, NotebookPen, Building2,
  Mail, Edit3, Save, Loader2,
  Bot, Send, SlidersHorizontal, Wand2,
} from 'lucide-react';

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
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap');
    * { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    body { margin: 0; background: ${C.bg}; }
    @keyframes goldTap { 0% { box-shadow: 0 0 0 0 rgba(255,184,0,0.5); } 100% { box-shadow: 0 0 0 12px rgba(255,184,0,0); } }
    .gold-tap:active { animation: goldTap 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    .fade-in { animation: fadeIn 0.3s ease-out both; }
    @keyframes heartPop { 0% { transform: scale(1); } 50% { transform: scale(1.4); } 100% { transform: scale(1); } }
    .heart-pop { animation: heartPop 0.4s ease-out; }
    @keyframes slideInRight { from { transform: translateX(100%); opacity: 0.6; } to { transform: translateX(0); opacity: 1; } }
    .slide-in-right { animation: slideInRight 0.28s cubic-bezier(0.22, 1, 0.36, 1) both; }
    input[type="range"] { -webkit-appearance: none; appearance: none; background: transparent; width: 100%; }
    input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: ${C.gold}; box-shadow: 0 0 8px rgba(255,184,0,0.5); cursor: pointer; margin-top: -7px; }
    input[type="range"]::-webkit-slider-runnable-track { height: 4px; background: rgba(255,255,255,0.12); border-radius: 2px; }
    button { -webkit-tap-highlight-color: transparent; }
    .scrollbar-none::-webkit-scrollbar { display: none; }
    .scrollbar-none { scrollbar-width: none; }
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
  { id: 'volley', label: 'Volley', icon: '🏐' },
  { id: 'badminton', label: 'Badminton', icon: '🏸' },
  { id: 'pingpong', label: 'Ping-pong', icon: '🏓' },
];

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
  Volley: ['volley'],
  Badminton: ['badminton'],
  'Ping-pong': ['ping pong', 'tennis de table'],
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
      Sco<span style={{ color: C.gold }}>lympia</span>
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

function IconButton({ icon: Icon, label, onClick, active, count }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 gold-tap" aria-label={label}>
      <div className="w-11 h-11 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: active ? C.gold : 'rgba(8,15,32,0.5)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${active ? C.gold : 'rgba(255,255,255,0.15)'}`,
        }}>
        <Icon size={20} strokeWidth={2.2}
          fill={active ? C.bg : 'transparent'}
          style={{ color: active ? C.bg : C.text }}
          className={active && Icon === Heart ? 'heart-pop' : ''} />
      </div>
      {count !== undefined && (
        <span className="text-[10px] font-mono font-bold"
          style={{ color: active ? C.gold : C.text, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
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
        <img src={data.poster} alt={data.name}
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

function FeedView({ videos, onSelectAthlete }) {
  const [muted, setMuted] = useState(true);
  return (
    <div className="overflow-y-auto snap-y snap-mandatory scrollbar-none"
      style={{ height: '100dvh', backgroundColor: '#000' }}>
      {videos.map(v => (
        <VideoCard key={v.id} data={v} muted={muted}
          onToggleMute={() => setMuted(!muted)} onSelectAthlete={onSelectAthlete} />
      ))}
    </div>
  );
}

// ═══ PUBLISH (avec tracker conservé) ══════════════════════════════
function PublishView() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [keyframes, setKeyframes] = useState([]);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showHint, setShowHint] = useState(true);

  const videoRef = useRef(null);
  const stageRef = useRef(null);
  const fileInputRef = useRef(null);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setVideoFile(f);
    setVideoUrl(URL.createObjectURL(f));
    setKeyframes([]); setShowHint(true);
  };

  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime);
    const onLoaded = () => setDuration(v.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
    };
  }, [videoUrl]);

  const onStageTap = (e) => {
    if (!videoRef.current || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const t = videoRef.current.currentTime;
    setShowHint(false);
    setKeyframes(prev => {
      const filtered = prev.filter(k => Math.abs(k.t - t) > 0.1);
      return [...filtered, { t, x, y }].sort((a, b) => a.t - b.t);
    });
    videoRef.current.pause();
  };

  const markerPos = useMemo(() => {
    if (keyframes.length === 0) return null;
    if (keyframes.length === 1) return keyframes[0];
    if (currentTime <= keyframes[0].t) return keyframes[0];
    if (currentTime >= keyframes[keyframes.length - 1].t) return keyframes[keyframes.length - 1];
    for (let i = 0; i < keyframes.length - 1; i++) {
      const a = keyframes[i], b = keyframes[i + 1];
      if (currentTime >= a.t && currentTime <= b.t) {
        const r = (currentTime - a.t) / (b.t - a.t);
        return { t: currentTime, x: a.x + (b.x - a.x) * r, y: a.y + (b.y - a.y) * r };
      }
    }
    return keyframes[0];
  }, [keyframes, currentTime]);

  const togglePlay = () => { const v = videoRef.current; if (!v) return; if (v.paused) v.play(); else v.pause(); };
  const seekTo = (t) => { const v = videoRef.current; if (!v) return; v.currentTime = Math.max(0, Math.min(duration, t)); };
  const removeKeyframe = (idx) => setKeyframes(prev => prev.filter((_, i) => i !== idx));
  const clearAll = () => { setKeyframes([]); setShowHint(true); };
  const reset = () => {
    setVideoFile(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null); setKeyframes([]); setPlayerName('');
    setCurrentTime(0); setDuration(0);
  };
  const fmtTime = (t) => { const m = Math.floor(t / 60); const s = Math.floor(t % 60); return `${m}:${String(s).padStart(2, '0')}`; };

  if (!videoUrl) {
    return (
      <div className="px-4 pt-12 pb-32 fade-in" style={{ height: '100dvh', backgroundColor: C.bg }}>
        <h1 className="text-3xl font-extrabold mb-1" style={{ color: C.text }}>Publier</h1>
        <p className="text-sm mb-6" style={{ color: C.textDim }}>Partagez votre talent avec les recruteurs</p>

        <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={onFile} />

        <button onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-12 px-4 mb-4 text-center"
          style={{ borderColor: C.borderGold, backgroundColor: C.surface }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: C.goldSoft }}>
            <Camera size={28} style={{ color: C.gold }} />
          </div>
          <h3 className="text-base font-bold mb-1" style={{ color: C.text }}>Ajoutez votre vidéo</h3>
          <p className="text-xs mb-4" style={{ color: C.textDim }}>MP4, MOV — max 60s, 100 Mo</p>
          <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: C.gold, color: C.bg }}>
            <Plus size={16} strokeWidth={2.5} /> Choisir une vidéo
          </span>
        </button>

        <div className="rounded-xl p-3.5 flex items-start gap-3 mb-3"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.borderGold}` }}>
          <Sparkles size={18} style={{ color: C.gold }} className="mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-sm font-semibold mb-0.5" style={{ color: C.text }}>Vérification IA</div>
            <p className="text-xs" style={{ color: C.textDim }}>L'algorithme vérifie le contenu sportif avant publication.</p>
          </div>
        </div>

        <div className="rounded-xl p-3.5 flex items-start gap-3"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.borderGold}` }}>
          <PinIcon size={18} style={{ color: C.gold }} className="mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-sm font-semibold mb-0.5" style={{ color: C.text }}>Tracker un joueur</div>
            <p className="text-xs" style={{ color: C.textDim }}>Une flèche dorée qui suit le joueur pour les recruteurs.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-3 pb-32 fade-in flex flex-col" style={{ minHeight: '100dvh', backgroundColor: C.bg }}>
      <div className="px-4 flex items-center justify-between mb-3">
        <button onClick={reset}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}>
          <ArrowLeft size={17} strokeWidth={2.2} />
        </button>
        <span className="font-mono text-[10px] tracking-widest" style={{ color: C.gold }}>
          ÉDITEUR · TRACKING JOUEUR
        </span>
        <div className="w-9" />
      </div>

      <div ref={stageRef} onClick={onStageTap}
        className="relative w-full overflow-hidden select-none"
        style={{ backgroundColor: '#000', aspectRatio: '9/16', maxHeight: '60vh' }}>
        <video ref={videoRef} src={videoUrl} playsInline
          className="absolute inset-0 w-full h-full object-contain" />

        {keyframes.map((k, i) => (
          <div key={i} className="absolute pointer-events-none"
            style={{
              left: `${k.x * 100}%`, top: `${k.y * 100}%`,
              transform: 'translate(-50%, -100%)',
              opacity: Math.abs(k.t - currentTime) < 0.05 ? 1 : 0.25,
            }}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: C.gold, boxShadow: `0 0 8px ${C.gold}` }} />
          </div>
        ))}

        {markerPos && (
          <div className="absolute pointer-events-none transition-[left,top] duration-100 ease-linear"
            style={{ left: `${markerPos.x * 100}%`, top: `${markerPos.y * 100}%`, transform: 'translate(-50%, -100%)' }}>
            <div className="flex flex-col items-center -translate-y-1">
              {playerName && (
                <div className="px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap mb-1"
                  style={{ backgroundColor: C.gold, color: C.bg, boxShadow: `0 0 18px rgba(255,184,0,0.6)` }}>
                  {playerName}
                </div>
              )}
              <ArrowDown size={28} strokeWidth={3}
                style={{ color: C.gold, filter: `drop-shadow(0 0 8px ${C.gold}) drop-shadow(0 2px 4px rgba(0,0,0,0.6))` }} />
            </div>
          </div>
        )}

        {showHint && keyframes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="px-4 py-3 rounded-xl text-center max-w-[80%]"
              style={{ backgroundColor: 'rgba(8,15,32,0.85)', border: `1px solid ${C.borderGold}`, backdropFilter: 'blur(10px)' }}>
              <PinIcon size={22} style={{ color: C.gold }} className="mx-auto mb-1" />
              <div className="text-sm font-semibold" style={{ color: C.text }}>Tape sur la tête du joueur</div>
              <div className="text-[11px] mt-0.5" style={{ color: C.textDim }}>à différents moments</div>
            </div>
          </div>
        )}

        <button onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          className="absolute bottom-3 left-3 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(8,15,32,0.75)', border: `1px solid ${C.borderGold}`, backdropFilter: 'blur(10px)', color: C.gold }}>
          {playing ? <Pause size={18} fill={C.gold} /> : <Play size={18} fill={C.gold} />}
        </button>

        <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md font-mono text-[11px]"
          style={{ backgroundColor: 'rgba(8,15,32,0.75)', color: C.text, backdropFilter: 'blur(10px)' }}>
          {fmtTime(currentTime)} / {fmtTime(duration)}
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="relative h-10">
          <input type="range" min="0" max={duration || 1} step="0.05" value={currentTime}
            onChange={(e) => seekTo(Number(e.target.value))}
            className="absolute inset-0 w-full"
            style={{
              background: `linear-gradient(to right, ${C.gold} 0%, ${C.gold} ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.12) ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.12) 100%)`,
              borderRadius: 2, height: 4, top: 18,
            }} />
          <div className="absolute inset-x-0 top-0 h-4 pointer-events-none">
            {keyframes.map((k, i) => (
              <div key={i} className="absolute -translate-x-1/2"
                style={{ left: `${(k.t / (duration || 1)) * 100}%`, top: 0 }}>
                <div className="w-2 h-3 rounded-sm" style={{ backgroundColor: C.gold, boxShadow: `0 0 6px ${C.gold}` }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 flex flex-col gap-3">
        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: C.text }}>Nom du joueur</label>
          <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)}
            placeholder="ex. Kylian Benga" maxLength={30}
            className="w-full px-3.5 py-3 rounded-xl text-sm outline-none"
            style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
        </div>

        {keyframes.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold" style={{ color: C.text }}>
                Points de tracking ({keyframes.length})
              </label>
              <button onClick={clearAll} className="text-[11px] flex items-center gap-1" style={{ color: C.gold }}>
                <Trash2 size={11} /> Tout effacer
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {keyframes.map((k, i) => {
                const active = Math.abs(k.t - currentTime) < 0.1;
                return (
                  <div key={i} className="flex-shrink-0 flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                    style={{ backgroundColor: active ? C.goldSoft : C.surface, border: `1px solid ${active ? C.gold : C.border}` }}>
                    <button onClick={() => seekTo(k.t)}
                      className="font-mono text-[11px]" style={{ color: active ? C.gold : C.text }}>
                      {fmtTime(k.t)}
                    </button>
                    <button onClick={() => removeKeyframe(i)}
                      className="w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                      <X size={9} style={{ color: C.text }} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <GoldButton variant="solid" icon={CheckCircle2} fullWidth className="mt-2">
          Publier la vidéo {keyframes.length > 0 ? `(${keyframes.length} points)` : ''}
        </GoldButton>
      </div>
    </div>
  );
}

// ═══ ATHLETE CARD ══════════════════════════════════════════════════
function AthleteCard({ athlete, onSelect, shortlisted, onToggleShortlist }) {
  return (
    <div onClick={onSelect}
      className="rounded-xl overflow-hidden flex flex-col fade-in cursor-pointer"
      style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
      <div className="relative" style={{ aspectRatio: '1', backgroundColor: '#000' }}>
        {athlete.poster ? (
          <img src={athlete.poster} alt={athlete.name} className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: C.surface2 }}>
            <span className="text-3xl">{athlete.icon}</span>
          </div>
        )}

        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md" style={{ backgroundColor: C.gold }}>
          <span className="font-mono text-[11px] font-bold" style={{ color: C.bg }}>{athlete.rating}</span>
        </div>

        {onToggleShortlist && (
          <button onClick={(e) => { e.stopPropagation(); onToggleShortlist(); }}
            className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(8,15,32,0.7)',
              border: `1px solid ${shortlisted ? C.gold : 'rgba(255,255,255,0.2)'}`,
              backdropFilter: 'blur(10px)',
            }}>
            <Star size={14} fill={shortlisted ? C.gold : 'transparent'}
              style={{ color: shortlisted ? C.gold : '#fff' }} strokeWidth={2.4} />
          </button>
        )}
      </div>

      <div className="p-2.5 flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold truncate" style={{ color: C.text }}>{athlete.name}</span>
          {athlete.verified && <BadgeCheck size={12} fill={C.gold} stroke={C.bg} strokeWidth={2.5} />}
        </div>
        <span className="text-[10px] truncate" style={{ color: C.textDim }}>
          {athlete.icon} {athlete.position} · {athlete.age} ans
        </span>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[10px] truncate" style={{ color: C.textDim }}>{athlete.club}</span>
          <span className="font-mono text-[10px]" style={{ color: C.gold }}>{athlete.views}</span>
        </div>
      </div>
    </div>
  );
}

// ═══ SEARCH (athlète) ══════════════════════════════════════════════
function SearchView({ videos, onSelectAthlete }) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ sport: null, gender: null, ageMin: 14, ageMax: 35, minRating: 0 });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => videos.filter(v => {
    if (filters.sport && v.sport !== filters.sport) return false;
    if (filters.gender && v.gender !== filters.gender) return false;
    if (v.age < filters.ageMin || v.age > filters.ageMax) return false;
    if (v.rating < filters.minRating) return false;
    if (query && !`${v.name} ${v.club} ${v.position}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  }), [videos, query, filters]);

  const activeFilters = useMemo(() => {
    let n = 0;
    if (filters.sport) n++;
    if (filters.gender) n++;
    if (filters.ageMin !== 14 || filters.ageMax !== 35) n++;
    if (filters.minRating > 0) n++;
    return n;
  }, [filters]);

  const resetFilters = () => setFilters({ sport: null, gender: null, ageMin: 14, ageMax: 35, minRating: 0 });

  return (
    <div className="pt-12 pb-32 overflow-y-auto" style={{ height: '100dvh', backgroundColor: C.bg }}>
      <div className="px-4 mb-4">
        <h1 className="text-3xl font-extrabold mb-1" style={{ color: C.text }}>Recherche</h1>
        <p className="text-sm" style={{ color: C.textDim }}>
          {filtered.length} athlète{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Search bar */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.textMute }} />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un athlète, un club, un poste…"
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
      </div>

      {/* Filters toggle */}
      <div className="px-4 mb-3">
        <button onClick={() => setFiltersOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl"
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
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <div className="px-4 mb-4 fade-in">
          <div className="rounded-xl p-4 flex flex-col gap-4"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: C.text }}>Sport</label>
              <div className="flex flex-wrap gap-2">
                {SPORTS.map(s => {
                  const active = filters.sport === s.label;
                  return (
                    <button key={s.id} onClick={() => setFilters(f => ({ ...f, sport: active ? null : s.label }))}
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
              <label className="text-xs font-semibold mb-2 block" style={{ color: C.text }}>Genre</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: null, label: 'Tous' },
                  { id: 'F',   label: 'Femme' },
                  { id: 'M',   label: 'Homme' },
                ].map(opt => {
                  const active = filters.gender === opt.id;
                  return (
                    <button key={String(opt.id)}
                      onClick={() => setFilters(f => ({ ...f, gender: opt.id }))}
                      className="py-2.5 rounded-lg text-sm font-medium"
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

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold" style={{ color: C.text }}>Âge</label>
                <span className="font-mono text-[11px]" style={{ color: C.gold }}>
                  {filters.ageMin} – {filters.ageMax} ans
                </span>
              </div>
              <input type="range" min="14" max="35" value={filters.ageMax}
                onChange={(e) => setFilters(f => ({ ...f, ageMax: Number(e.target.value) }))} />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold" style={{ color: C.text }}>Score IA min</label>
                <span className="font-mono text-[11px]" style={{ color: C.gold }}>
                  ≥ {filters.minRating.toFixed(1)} / 10
                </span>
              </div>
              <input type="range" min="0" max="10" step="0.1" value={filters.minRating}
                onChange={(e) => setFilters(f => ({ ...f, minRating: Number(e.target.value) }))} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <GoldButton variant="outline" icon={RotateCcw} onClick={resetFilters}>Réinitialiser</GoldButton>
              <GoldButton variant="solid" onClick={() => setFiltersOpen(false)}>Voir résultats</GoldButton>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {filtered.map(a => (
          <AthleteCard key={a.id} athlete={a} onSelect={() => onSelectAthlete?.(a)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="px-4 mt-8 text-center">
          <Search size={32} style={{ color: C.textMute }} className="mx-auto mb-3" />
          <p className="text-sm" style={{ color: C.textDim }}>Aucun athlète trouvé.</p>
          <button onClick={resetFilters} className="text-xs mt-2" style={{ color: C.gold }}>
            Réinitialiser
          </button>
        </div>
      )}
    </div>
  );
}

// ═══ DISCOVERY (recruteur) ═════════════════════════════════════════
function DiscoveryView({ videos, onSelectAthlete, shortlistIds, toggleShortlist }) {
  const [filters, setFilters] = useState({ sport: null, gender: null, ageMin: 14, ageMax: 25, minRating: 7.0 });
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const filtered = useMemo(() => {
    let r = videos.filter(v => {
      if (filters.sport && v.sport !== filters.sport) return false;
      if (filters.gender && v.gender !== filters.gender) return false;
      if (v.age < filters.ageMin || v.age > filters.ageMax) return false;
      if (v.rating < filters.minRating) return false;
      if (query && !`${v.name} ${v.club} ${v.position}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
    return r.sort((a, b) => b.rating - a.rating);
  }, [videos, filters, query]);

  const activeFilters = useMemo(() => {
    let n = 0;
    if (filters.sport) n++;
    if (filters.gender) n++;
    if (filters.ageMin !== 14 || filters.ageMax !== 25) n++;
    if (filters.minRating > 7.0) n++;
    return n;
  }, [filters]);

  const resetFilters = () => setFilters({ sport: null, gender: null, ageMin: 14, ageMax: 25, minRating: 7.0 });
  const applyChatFilters = (parsed) => { setFilters(prev => ({ ...prev, ...parsed })); setFiltersOpen(true); };

  return (
    <div className="pt-4 pb-32 overflow-y-auto" style={{ height: '100dvh', backgroundColor: C.bg }}>
      <div className="px-4 mb-4 fade-in">
        <div className="flex items-center justify-between mb-3">
          <Logo />
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
            style={{ backgroundColor: C.goldSoft, border: `1px solid ${C.gold}` }}>
            <Briefcase size={12} style={{ color: C.gold }} />
            <span className="font-mono text-[10px]" style={{ color: C.gold }}>RECRUTEUR</span>
          </div>
        </div>
        <h1 className="text-3xl font-extrabold" style={{ color: C.text }}>Recherche</h1>
        <p className="text-sm" style={{ color: C.textDim }}>
          {filtered.length} athlète{filtered.length > 1 ? 's' : ''} correspond{filtered.length > 1 ? 'ent' : ''} à vos critères
        </p>
      </div>

      <div className="px-4 mb-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.textMute }} />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un athlète, un club, un poste…"
            className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none"
            style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
          {query && (
            <button onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: C.surface2 }}
              aria-label="Effacer">
              <X size={11} style={{ color: C.textDim }} />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 mb-3 flex gap-2">
        <button onClick={() => { setFiltersOpen(o => !o); setChatOpen(false); }}
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

        <button onClick={() => { setChatOpen(o => !o); setFiltersOpen(false); }}
          className="flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{
            backgroundColor: chatOpen ? C.gold : C.surface,
            color: chatOpen ? C.bg : C.gold,
            border: `1px solid ${chatOpen ? C.gold : C.borderGold}`,
          }}>
          <Bot size={16} strokeWidth={2.4} />
          <span className="text-sm font-semibold">IA</span>
        </button>
      </div>

      {chatOpen && (
        <div className="px-4 mb-3 fade-in">
          <ScoutChatbot onApplyFilters={applyChatFilters} onClose={() => setChatOpen(false)} />
        </div>
      )}

      {filtersOpen && (
        <div className="px-4 mb-4 fade-in">
          <div className="rounded-xl p-4 flex flex-col gap-4"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: C.text }}>Sport</label>
              <div className="flex flex-wrap gap-2">
                {SPORTS.map(s => {
                  const active = filters.sport === s.label;
                  return (
                    <button key={s.id} onClick={() => setFilters(f => ({ ...f, sport: active ? null : s.label }))}
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

            {/* Genre */}
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: C.text }}>Genre</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: null, label: 'Tous' },
                  { id: 'F',   label: 'Femme' },
                  { id: 'M',   label: 'Homme' },
                ].map(opt => {
                  const active = filters.gender === opt.id;
                  return (
                    <button key={String(opt.id)}
                      onClick={() => setFilters(f => ({ ...f, gender: opt.id }))}
                      className="py-2.5 rounded-lg text-sm font-medium transition-all"
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

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold" style={{ color: C.text }}>Âge</label>
                <span className="font-mono text-[11px]" style={{ color: C.gold }}>
                  {filters.ageMin} – {filters.ageMax} ans
                </span>
              </div>
              <input type="range" min="14" max="35" value={filters.ageMax}
                onChange={(e) => setFilters(f => ({ ...f, ageMax: Number(e.target.value) }))} />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold" style={{ color: C.text }}>Score IA min</label>
                <span className="font-mono text-[11px]" style={{ color: C.gold }}>
                  ≥ {filters.minRating.toFixed(1)} / 10
                </span>
              </div>
              <input type="range" min="0" max="10" step="0.1" value={filters.minRating}
                onChange={(e) => setFilters(f => ({ ...f, minRating: Number(e.target.value) }))} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <GoldButton variant="outline" icon={RotateCcw} onClick={resetFilters}>Réinitialiser</GoldButton>
              <GoldButton variant="solid" onClick={() => setFiltersOpen(false)}>Voir résultats</GoldButton>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 grid grid-cols-2 gap-3">
        {filtered.map(a => (
          <AthleteCard key={a.id} athlete={a}
            onSelect={() => onSelectAthlete?.(a)}
            shortlisted={shortlistIds?.has(a.id)}
            onToggleShortlist={() => toggleShortlist?.(a.id)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="px-4 mt-8 text-center">
          <Search size={32} style={{ color: C.textMute }} className="mx-auto mb-3" />
          <p className="text-sm" style={{ color: C.textDim }}>Aucun athlète ne correspond.</p>
          <button onClick={resetFilters} className="text-xs mt-2" style={{ color: C.gold }}>
            Réinitialiser
          </button>
        </div>
      )}
    </div>
  );
}

function ScoutChatbot({ onApplyFilters, onClose }) {
  const [messages, setMessages] = useState([
    { from: 'bot', text: "Décrivez l'athlète recherché, je règle les filtres.",
      hints: ['Footballeur U19', 'Basketteur score > 8', 'Tennis 18-22 ans'] },
  ]);
  const [input, setInput] = useState('');
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = (text) => {
    const q = (text ?? input).trim();
    if (!q) return;
    const { filters, matched } = parseQuery(q);
    const reply = matched.length === 0
      ? { from: 'bot', text: "Je n'ai rien identifié de précis. Essayez avec un sport, un âge ou un score." }
      : { from: 'bot', text: `J'ai compris ${matched.length} critère${matched.length > 1 ? 's' : ''} :`,
          bullets: matched, action: { label: 'Appliquer', filters } };
    setMessages(prev => [...prev, { from: 'user', text: q }, reply]);
    setInput('');
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.borderGold}` }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: C.goldSoft }}>
            <Bot size={15} style={{ color: C.gold }} />
          </div>
          <div className="text-sm font-bold" style={{ color: C.text }}>Assistant Scolympia</div>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: C.bg }}>
          <X size={13} style={{ color: C.text }} />
        </button>
      </div>

      <div className="px-3 py-3 max-h-72 overflow-y-auto flex flex-col gap-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'} fade-in`}>
            <div className="max-w-[85%] flex flex-col gap-1.5">
              <div className="px-3 py-2 rounded-2xl text-sm leading-relaxed"
                style={{
                  backgroundColor: m.from === 'user' ? C.gold : C.bg,
                  color: m.from === 'user' ? C.bg : C.text,
                  borderBottomRightRadius: m.from === 'user' ? 4 : undefined,
                  borderBottomLeftRadius: m.from === 'bot' ? 4 : undefined,
                  border: m.from === 'bot' ? `1px solid ${C.border}` : 'none',
                }}>
                {m.text}
              </div>
              {m.bullets && (
                <div className="flex flex-col gap-1 px-3 py-2 rounded-xl" style={{ backgroundColor: C.goldSoft, border: `1px solid ${C.borderGold}` }}>
                  {m.bullets.map((b, j) => (
                    <div key={j} className="flex items-start gap-1.5 text-xs">
                      <CheckCircle2 size={12} style={{ color: C.gold }} className="mt-0.5 flex-shrink-0" />
                      <span style={{ color: C.text }}>{b}</span>
                    </div>
                  ))}
                </div>
              )}
              {m.action && (
                <button onClick={() => {
                  onApplyFilters(m.action.filters);
                  setMessages(prev => [...prev, { from: 'bot', text: 'Filtres appliqués !' }]);
                }}
                  className="px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: C.gold, color: C.bg }}>
                  <Wand2 size={12} strokeWidth={2.6} /> {m.action.label}
                </button>
              )}
              {m.hints && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {m.hints.map((h, j) => (
                    <button key={j} onClick={() => send(h)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                      style={{ backgroundColor: 'transparent', color: C.gold, border: `1px solid ${C.borderGold}` }}>
                      {h}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="px-3 py-3 flex gap-2" style={{ borderTop: `1px solid ${C.border}` }}>
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder="Décrivez votre recherche…"
          className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
          style={{ backgroundColor: C.bg, color: C.text, border: `1px solid ${C.border}` }} />
        <button onClick={() => send()} disabled={!input.trim()}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: input.trim() ? C.gold : 'rgba(255,184,0,0.2)',
            color: input.trim() ? C.bg : 'rgba(8,15,32,0.4)',
          }}>
          <Send size={15} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}

// ═══ MESSAGES ══════════════════════════════════════════════════════
const CONVERSATIONS = [
  { id: 'c-psg', name: 'Recruteur PSG', subtitle: 'Football · PSG', isAthlete: false, time: '2min', unread: 2,
    messages: [
      { from: 'them', text: "Bonjour, j'ai vu votre vidéo, très impressionnant.", time: '14:32' },
      { from: 'them', text: 'Pourriez-vous nous envoyer plus de matchs ?', time: '14:33' },
    ] },
  { id: 'c-aminata', name: 'Aminata Diallo', subtitle: '🏃‍♀️ Athlétisme', isAthlete: true, time: '14min', unread: 1,
    messages: [
      { from: 'them', text: 'Salut ! Tu fais quoi ce week-end ?', time: '12:18' },
      { from: 'me', text: 'Tournoi régional samedi.', time: '12:21' },
    ] },
  { id: 'c-monaco', name: 'AS Monaco', subtitle: 'Football', isAthlete: false, time: '3h', unread: 0,
    messages: [
      { from: 'them', text: 'Pouvez-vous nous envoyer votre fiche technique ?', time: '09:30' },
    ] },
];

function findOrCreateConversation(athlete) {
  const existing = CONVERSATIONS.find(c => c.name === athlete.name);
  if (existing) return existing;
  return {
    id: `c-${athlete.id}`,
    name: athlete.name,
    subtitle: `${athlete.icon} ${athlete.sport}`,
    isAthlete: true, time: 'maintenant', unread: 0,
    messages: [],
  };
}

function MessagesView({ videos, onSelectAthlete, onOpenChat }) {
  const findAthlete = (name) => videos.find(v => v.name === name);

  return (
    <div className="pt-12 pb-32 px-4 overflow-y-auto" style={{ height: '100dvh', backgroundColor: C.bg }}>
      <h1 className="text-3xl font-extrabold mb-1" style={{ color: C.text }}>Messages</h1>
      <p className="text-sm mb-6" style={{ color: C.textDim }}>Vos conversations</p>

      <div className="flex flex-col gap-2">
        {CONVERSATIONS.map(c => {
          const full = c.isAthlete ? findAthlete(c.name) : null;
          const lastMsg = c.messages[c.messages.length - 1];
          return (
            <div key={c.id}
              className="flex items-center gap-3 p-3 rounded-xl fade-in"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              <button onClick={() => full && onSelectAthlete?.(full)} disabled={!full} className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold"
                  style={{ backgroundColor: C.surface2, color: C.gold,
                    border: full ? `2px solid ${C.gold}` : 'none' }}>
                  {c.name.charAt(0)}
                </div>
              </button>

              <div className="flex-1 min-w-0">
                <button onClick={() => full && onSelectAthlete?.(full)} disabled={!full}
                  className="flex items-center justify-between gap-2 w-full text-left">
                  <span className="font-semibold text-sm truncate" style={{ color: C.text }}>{c.name}</span>
                  <span className="text-[10px]" style={{ color: C.textDim }}>{c.time}</span>
                </button>
                <button onClick={() => onOpenChat?.(c)}
                  className="text-xs truncate block w-full text-left mt-0.5" style={{ color: C.textDim }}>
                  {lastMsg?.text ?? '—'}
                </button>
              </div>

              {c.unread > 0 && (
                <button onClick={() => onOpenChat?.(c)}
                  className="min-w-[20px] h-5 rounded-full flex items-center justify-center text-[10px] font-bold px-1.5"
                  style={{ backgroundColor: C.gold, color: C.bg }}>
                  {c.unread}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChatView({ conversation, onBack, onAvatarTap }) {
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState(conversation?.messages ?? []);
  const scrollRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [messages]);
  if (!conversation) return null;

  const send = () => {
    const text = draft.trim(); if (!text) return;
    const now = new Date();
    setMessages(prev => [...prev, { from: 'me', text, time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}` }]);
    setDraft('');
  };

  return (
    <div className="flex flex-col fade-in" style={{ height: '100dvh', backgroundColor: C.bg }}>
      <div className="px-4 pt-3 pb-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
        <button onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text }}>
          <ArrowLeft size={17} strokeWidth={2.2} />
        </button>
        <button onClick={onAvatarTap} disabled={!onAvatarTap}
          className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
            style={{ backgroundColor: C.surface2, color: C.gold, border: `2px solid ${C.gold}` }}>
            {conversation.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate" style={{ color: C.text }}>{conversation.name}</div>
            <div className="text-[11px]" style={{ color: C.textDim }}>{conversation.subtitle}</div>
          </div>
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
        {messages.length === 0 ? (
          <div className="text-center mt-12">
            <MessageCircle size={32} style={{ color: C.textMute }} className="mx-auto mb-2" />
            <p className="text-xs" style={{ color: C.textDim }}>Démarrez la conversation.</p>
          </div>
        ) : messages.map((m, i) => {
          const me = m.from === 'me';
          return (
            <div key={i} className={`flex ${me ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[80%] flex flex-col">
                <div className="px-3.5 py-2 rounded-2xl text-sm leading-relaxed"
                  style={{
                    backgroundColor: me ? C.gold : C.surface,
                    color: me ? C.bg : C.text,
                    borderBottomRightRadius: me ? 4 : undefined,
                    borderBottomLeftRadius: !me ? 4 : undefined,
                    border: me ? 'none' : `1px solid ${C.border}`,
                  }}>
                  {m.text}
                </div>
                <span className="text-[10px] mt-0.5 px-1"
                  style={{ color: C.textMute, alignSelf: me ? 'flex-end' : 'flex-start' }}>
                  {m.time}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-3 py-3 flex gap-2" style={{ borderTop: `1px solid ${C.border}` }}>
        <input type="text" value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder="Écrire un message…"
          className="flex-1 px-3.5 py-2.5 rounded-xl text-sm outline-none"
          style={{ backgroundColor: C.surface, color: C.text, border: `1px solid ${C.border}` }} />
        <button onClick={send} disabled={!draft.trim()}
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: draft.trim() ? C.gold : 'rgba(255,184,0,0.25)',
            color: draft.trim() ? C.bg : 'rgba(8,15,32,0.4)',
          }}>
          <Send size={16} strokeWidth={2.4} />
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
            <span className="text-[9px] font-mono tracking-widest" style={{ color: C.gold }}>
              NOTES PRIVÉES ({notes.length})
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

function ShortlistView({ videos, shortlistIds, toggleShortlist, notes, onSelectAthlete, onOpenChat, onAddNote, onUpdateNote, onDeleteNote }) {
  const shortlisted = videos.filter(v => shortlistIds?.has(v.id));

  if (shortlisted.length === 0) {
    return (
      <div className="pt-12 pb-32 px-4" style={{ height: '100dvh', backgroundColor: C.bg }}>
        <h1 className="text-3xl font-extrabold mb-1" style={{ color: C.text }}>Short-list</h1>
        <p className="text-sm mb-6" style={{ color: C.textDim }}>Vos athlètes favoris</p>
        <div className="rounded-2xl py-16 px-6 text-center"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <Star size={36} style={{ color: C.textMute }} className="mx-auto mb-3" />
          <h3 className="text-base font-bold mb-1" style={{ color: C.text }}>Short-list vide</h3>
          <p className="text-xs" style={{ color: C.textDim }}>
            Tape sur ⭐ depuis la Recherche pour ajouter un athlète.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-12 pb-32 px-4 overflow-y-auto" style={{ height: '100dvh', backgroundColor: C.bg }}>
      <div className="flex items-baseline justify-between mb-1">
        <h1 className="text-3xl font-extrabold" style={{ color: C.text }}>Short-list</h1>
        <span className="font-mono text-[12px]" style={{ color: C.gold }}>{shortlisted.length} / 50</span>
      </div>
      <p className="text-sm mb-5" style={{ color: C.textDim }}>Vos athlètes favoris</p>

      <div className="flex flex-col gap-2">
        {shortlisted.map(a => (
          <ShortlistRow key={a.id} athlete={a}
            notes={notes?.[a.id] ?? []}
            onSelectAthlete={onSelectAthlete}
            onOpenChat={onOpenChat}
            onRemove={() => toggleShortlist?.(a.id)}
            onAddNote={onAddNote} onUpdateNote={onUpdateNote} onDeleteNote={onDeleteNote} />
        ))}
      </div>
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
        {athlete.poster && <img src={athlete.poster} alt={athlete.name} className="w-full h-full object-cover" />}
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
              Vérifié par l'IA Scolympia
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

// ═══ PROFIL VIEWS (athlète & recruteur) ═════════════════════════════
function ProfileView({ onSwitchToRecruiter }) {
  return (
    <div className="pt-12 pb-32 px-4" style={{ height: '100dvh', backgroundColor: C.bg }}>
      <div className="flex flex-col items-center mb-6 fade-in">
        <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold mb-3"
          style={{ backgroundColor: C.surface, color: C.gold, border: `2px solid ${C.gold}` }}>
          T
        </div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-extrabold" style={{ color: C.text }}>Tom Lambert</h2>
          <BadgeCheck size={18} fill={C.gold} stroke={C.bg} strokeWidth={2.5} />
        </div>
        <span className="text-sm" style={{ color: C.textDim }}>⚽ Football · Milieu offensif</span>
        <span className="text-[10px] mt-1 flex items-center gap-1" style={{ color: C.textMute }}>
          🇫🇷 France
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[{ v: '2.4K', l: 'Abonnés' }, { v: '186', l: 'Abonnements' }, { v: '128', l: 'Vidéos' }].map((s, i) => (
          <div key={i} className="rounded-xl py-3 text-center"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            <div className="text-base font-bold" style={{ color: C.gold }}>{s.v}</div>
            <div className="text-[10px] mt-0.5" style={{ color: C.textDim }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <button onClick={onSwitchToRecruiter}
          className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
          style={{ backgroundColor: 'transparent', color: C.gold, border: `1px dashed ${C.borderGold}` }}>
          <Briefcase size={14} /> Passer en mode recruteur
        </button>
      </div>
    </div>
  );
}

function RecruiterProfileView({ onLogout }) {
  const r = CURRENT_RECRUITER;
  const responseRate = r.stats.contacted ? Math.round((r.stats.responses / r.stats.contacted) * 100) : 0;

  return (
    <div className="pt-12 pb-32 px-4 overflow-y-auto" style={{ height: '100dvh', backgroundColor: C.bg }}>
      <div className="flex items-start gap-3 mb-6 fade-in">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0"
          style={{ backgroundColor: C.surface, color: C.gold, border: `2px solid ${C.gold}` }}>
          {r.firstName.charAt(0)}{r.lastName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-extrabold truncate" style={{ color: C.text }}>{r.firstName} {r.lastName}</h2>
            {r.verified && <BadgeCheck size={16} fill={C.gold} stroke={C.bg} strokeWidth={2.5} />}
          </div>
          <span className="text-xs" style={{ color: C.textDim }}>{r.role}</span>
          <div className="text-xs font-semibold mt-0.5" style={{ color: C.gold }}>{r.organization}</div>
          <div className="text-[10px] mt-0.5" style={{ color: C.textMute }}>🇫🇷 France</div>
          <div className="flex items-center gap-4 mt-2">
            <div className="text-center">
              <div className="text-sm font-bold" style={{ color: C.text }}>{r.followers.toLocaleString('fr-FR')}</div>
              <div className="text-[9px]" style={{ color: C.textDim }}>Abonnés</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold" style={{ color: C.text }}>{r.following}</div>
              <div className="text-[9px]" style={{ color: C.textDim }}>Abonnements</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl p-3 text-center" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <div className="text-lg font-bold" style={{ color: C.gold }}>{r.stats.contacted}</div>
          <div className="text-[10px]" style={{ color: C.textDim }}>Contactés</div>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <div className="text-lg font-bold" style={{ color: C.green }}>{responseRate}%</div>
          <div className="text-[10px]" style={{ color: C.textDim }}>Taux de réponse</div>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <div className="text-lg font-bold" style={{ color: C.gold }}>{r.stats.signed}</div>
          <div className="text-[10px]" style={{ color: C.textDim }}>Signés</div>
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        <div className="rounded-xl p-3 flex items-center gap-2.5"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <Mail size={15} style={{ color: C.gold }} />
          <div className="flex-1 min-w-0">
            <div className="text-[10px]" style={{ color: C.textDim }}>Email pro</div>
            <div className="text-xs font-semibold truncate" style={{ color: C.text }}>{r.email}</div>
          </div>
          {r.verified && (
            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold font-mono"
              style={{ backgroundColor: C.gold, color: C.bg }}>OFFICIEL</span>
          )}
        </div>
        <div className="rounded-xl p-3 flex items-center gap-2.5"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <Building2 size={15} style={{ color: C.gold }} />
          <div className="flex-1 min-w-0">
            <div className="text-[10px]" style={{ color: C.textDim }}>Organisation</div>
            <div className="text-xs font-semibold truncate" style={{ color: C.text }}>{r.organization}</div>
          </div>
        </div>
      </div>

      <GoldButton variant="outline" fullWidth onClick={onLogout}>
        Repasser en mode joueur
      </GoldButton>
    </div>
  );
}

// ═══ BOTTOM NAV ════════════════════════════════════════════════════
function BottomNav({ tab, setTab, mode }) {
  const items = mode === 'recruiter' ? [
    { id: 'feed', icon: Home, label: 'Feed' },
    { id: 'discover', icon: Search, label: 'Recherche' },
    { id: 'shortlist', icon: Star, label: 'Short-list' },
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
  const [mode, setMode] = useState('athlete'); // 'athlete' | 'recruiter'
  const [tab, setTab] = useState('feed');
  const [filtered] = useState(() => SportDetectorAI.filter(VIDEOS));
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [activeChat, setActiveChat] = useState(null);

  const [shortlistIds, setShortlistIds] = useState(() => new Set([2, 3]));
  const toggleShortlist = (id) => setShortlistIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  // Notes par athlète
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

  const openChatWithAthlete = (athlete) => {
    const conv = findOrCreateConversation(athlete);
    setActiveChat(conv);
    setSelectedAthlete(null);
    setTab('messages');
  };

  const renderScreen = () => {
    if (mode === 'recruiter') {
      switch (tab) {
        case 'feed':      return <FeedView videos={filtered.videos} onSelectAthlete={setSelectedAthlete} />;
        case 'discover':  return <DiscoveryView videos={filtered.videos} onSelectAthlete={setSelectedAthlete} shortlistIds={shortlistIds} toggleShortlist={toggleShortlist} />;
        case 'shortlist': return <ShortlistView videos={filtered.videos} shortlistIds={shortlistIds} toggleShortlist={toggleShortlist} notes={notes} onSelectAthlete={setSelectedAthlete} onOpenChat={openChatWithAthlete} onAddNote={addNote} onUpdateNote={updateNote} onDeleteNote={deleteNote} />;
        case 'messages':  return <MessagesView videos={filtered.videos} onSelectAthlete={setSelectedAthlete} onOpenChat={setActiveChat} />;
        case 'profile':   return <RecruiterProfileView onLogout={() => switchMode('athlete')} />;
        default: return null;
      }
    }
    switch (tab) {
      case 'feed':     return <FeedView videos={filtered.videos} onSelectAthlete={setSelectedAthlete} />;
      case 'search':   return <SearchView videos={filtered.videos} onSelectAthlete={setSelectedAthlete} />;
      case 'publish':  return <PublishView />;
      case 'messages': return <MessagesView videos={filtered.videos} onSelectAthlete={setSelectedAthlete} onOpenChat={setActiveChat} />;
      case 'profile':  return <ProfileView onSwitchToRecruiter={() => switchMode('recruiter')} />;
      default: return null;
    }
  };

  return (
    <div className="relative" style={{ backgroundColor: C.bg, minHeight: '100dvh' }}>
      <FontStyles />
      {renderScreen()}
      <BottomNav tab={tab} setTab={setTab} mode={mode} />

      <AthleteProfile
        athlete={selectedAthlete}
        onClose={() => setSelectedAthlete(null)}
        isRecruiter={mode === 'recruiter'}
        shortlisted={selectedAthlete && shortlistIds.has(selectedAthlete.id)}
        onToggleShortlist={() => selectedAthlete && toggleShortlist(selectedAthlete.id)}
        onMessage={() => selectedAthlete && openChatWithAthlete(selectedAthlete)}
      />

      {activeChat && (
        <div className="fixed inset-0 z-[60]" style={{ backgroundColor: C.bg }}>
          <ChatView
            conversation={activeChat}
            onBack={() => setActiveChat(null)}
            onAvatarTap={() => {
              const athlete = filtered.videos.find(v => v.name === activeChat.name);
              if (athlete) {
                setActiveChat(null);
                setSelectedAthlete(athlete);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
