// Compression des vidéos avant l'envoi.
//
// Une vidéo de 30 s pèse de 5 à 200 Mo selon le réglage du téléphone (4K,
// 60 images/s…). Chaque lecture la télécharge en entier : c'est le premier
// poste de coût. On la ramène donc, sur le téléphone même, à un format fixe :
// 720 pixels sur le petit côté, 30 images/s, ~2 Mbit/s, soit 7 à 8 Mo pour
// 30 s. Le son est recopié tel quel quand c'est possible.
//
// L'encodage passe par WebCodecs (le matériel vidéo du téléphone), via la
// bibliothèque Mediabunny, chargée seulement quand on publie. Si le
// téléphone ne sait pas faire, ou si quoi que ce soit échoue, on rend null :
// la vidéo d'origine est alors envoyée telle quelle. Compresser ne doit
// jamais empêcher de publier.

export const COTE_CIBLE = 720            // pixels, sur le petit côté
export const DEBIT_VIDEO = 2_000_000     // bits par seconde
const IMAGES_PAR_SECONDE_MAX = 30
// En dessous, la vidéo est déjà assez légère : on ne la recompresse pas.
export const SEUIL_SANS_COMPRESSION = 10 * 1024 * 1024
// Garde-fou : au-delà, on abandonne et on envoie l'original.
const DUREE_MAX_COMPRESSION_MS = 3 * 60 * 1000

const pair = (n) => Math.max(2, Math.round(n / 2) * 2)

// Rend un File MP4 compressé, ou null s'il faut envoyer l'original.
// `signal` (AbortSignal) permet d'annuler, par exemple si la personne
// choisit une autre vidéo entre-temps.
export async function compresserVideo(fichier, { onProgression, signal } = {}) {
  if (!fichier || fichier.size <= SEUIL_SANS_COMPRESSION) return null
  if (typeof VideoEncoder === 'undefined' || typeof VideoDecoder === 'undefined') return null

  let conversion = null
  let minuteur = null
  const annuler = () => { conversion?.cancel().catch(() => {}) }
  signal?.addEventListener('abort', annuler)

  try {
    const {
      Input, Output, Conversion, ALL_FORMATS, BlobSource, BufferTarget, Mp4OutputFormat, canEncodeVideo,
    } = await import('mediabunny')
    if (signal?.aborted) return null

    const entree = new Input({ source: new BlobSource(fichier), formats: ALL_FORMATS })
    const piste = await entree.getPrimaryVideoTrack()
    if (!piste) return null

    // Dimensions d'affichage, rotation comprise : une vidéo filmée en
    // portrait reste en portrait.
    const largeur0 = await piste.getDisplayWidth()
    const hauteur0 = await piste.getDisplayHeight()
    const facteur = Math.min(1, COTE_CIBLE / Math.min(largeur0, hauteur0))
    const largeur = pair(largeur0 * facteur)
    const hauteur = pair(hauteur0 * facteur)

    if (!(await canEncodeVideo('avc', { width: largeur, height: hauteur, bitrate: DEBIT_VIDEO }))) return null

    const sortie = new Output({
      // « fastStart » place l'index en tête du fichier : la lecture peut
      // commencer avant la fin du téléchargement.
      format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
      target: new BufferTarget(),
    })
    conversion = await Conversion.init({
      input: entree,
      output: sortie,
      tracks: 'primary',
      video: {
        width: largeur, height: hauteur, fit: 'fill',
        codec: 'avc', bitrate: DEBIT_VIDEO,
        frameRate: IMAGES_PAR_SECONDE_MAX,
        forceTranscode: true,
      },
      // Le son d'un iPhone (AAC) est recopié sans réencodage.
      audio: {},
      showWarnings: false,
    })
    if (!conversion.isValid) return null
    conversion.onProgress = (p) => onProgression?.(Math.min(1, Math.max(0, p)))

    minuteur = setTimeout(annuler, DUREE_MAX_COMPRESSION_MS)
    await conversion.execute()

    const octets = sortie.target.buffer
    if (!octets || octets.byteLength === 0) return null
    // Rien gagné (vidéo déjà très compressée) : autant garder l'original.
    if (octets.byteLength >= fichier.size * 0.9) return null

    const nom = (fichier.name || 'video').replace(/\.[^.]+$/, '') + '.mp4'
    return new File([octets], nom, { type: 'video/mp4' })
  } catch (e) {
    if (!signal?.aborted) console.warn('Compression vidéo impossible, envoi de l\'original :', e)
    return null
  } finally {
    clearTimeout(minuteur)
    signal?.removeEventListener('abort', annuler)
  }
}
