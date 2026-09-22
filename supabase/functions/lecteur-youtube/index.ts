import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Page HTML minimale qui héberge le lecteur YouTube, servie en https.
//
// Pourquoi elle existe : dans l'application empaquetée, la page tourne sous
// le schéma `capacitor://localhost`. WKWebView réserve http et https,
// Capacitor interdit donc de les donner à `iosScheme`, et l'intégration
// YouTube — qui exige un référent http(s) valide — peut la refuser.
// Cette page, elle, est servie depuis https://<projet>.supabase.co : le
// lecteur qu'elle contient présente donc un référent que YouTube accepte.
//
// Elle ne pose pas une simple <iframe> : elle passe par l'API officielle du
// lecteur, seule voie qui remonte un *code d'erreur*. Ce code est renvoyé à
// l'application par postMessage, ce qui permet de distinguer « cette vidéo
// interdit l'intégration » de « notre origine est refusée » — deux causes
// qui produisent le même écran noir, et appellent deux réponses opposées.
//
// Aucun JWT n'est exigé, pour deux raisons : une balise <iframe> ne peut pas
// porter d'en-tête Authorization, et la fonction ne lit ni n'écrit aucune
// donnée — elle ne renvoie que du HTML public construit à partir d'un
// identifiant de vidéo YouTube, lui-même déjà public.

const ID_VALIDE = /^[A-Za-z0-9_-]{11}$/;

// Délai au-delà duquel on considère que le lecteur ne démarrera pas. L'API
// n'émet rien quand elle se charge sans jamais s'initialiser : sans ce
// garde-fou, l'application resterait sur un écran noir. Il doit rester
// sous le délai de secours côté application, pour que ce soit cette page
// qui explique, plutôt que l'application qui conclue à son silence.
const DELAI_SANS_REPONSE_MS = 6000;

const page = (id: string) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Lecteur</title>
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #000; overflow: hidden; }
  #lecteur, iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
</style>
</head>
<body>
<div id="lecteur"></div>
<script>
(function () {
  var ID = ${JSON.stringify(id)};
  var repondu = false;

  function versApp(message) {
    message.source = 'lecteur-youtube';
    try { parent.postMessage(message, '*'); } catch (e) { /* sans parent */ }
  }

  function signaler(message) {
    if (repondu) return;
    repondu = true;
    versApp(message);
  }

  // L'API n'émet aucun événement quand elle n'arrive pas à se charger :
  // sans ce délai, l'application attendrait indéfiniment.
  setTimeout(function () { signaler({ type: 'silence' }); }, ${DELAI_SANS_REPONSE_MS});

  window.onYouTubeIframeAPIReady = function () {
    new YT.Player('lecteur', {
      videoId: ID,
      playerVars: {
        autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1,
        // iOS refuse le démarrage automatique d'une vidéo sonore : sans
        // cela, le lecteur reste sur une image noire, sans erreur, sans
        // rien. Le son se rallume depuis les commandes du lecteur.
        mute: 1,
        // Doit désigner la page qui héberge le lecteur — donc celle-ci,
        // et non l'application qui l'englobe.
        origin: location.origin
      },
      events: {
        onReady: function () { signaler({ type: 'pret' }); },
        // État réel du lecteur : -1 non démarré, 0 terminé, 1 lecture,
        // 2 pause, 3 tampon, 5 en file. « Prêt » ne veut pas dire « joue ».
        onStateChange: function (e) { versApp({ type: 'etat', valeur: e && e.data }); },
        onError: function (e) { signaler({ type: 'erreur', code: e && e.data }); }
      }
    });
  };

  var s = document.createElement('script');
  s.src = 'https://www.youtube.com/iframe_api';
  s.onerror = function () { signaler({ type: 'api-injoignable' }); };
  document.head.appendChild(s);
})();
</script>
</body>
</html>`;

Deno.serve((req: Request) => {
  const id = new URL(req.url).searchParams.get("v") ?? "";

  // On ne réinjecte jamais la valeur reçue dans la réponse : elle
  // atterrirait dans du HTML.
  if (!ID_VALIDE.test(id)) {
    return new Response("Identifiant de vidéo invalide.", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(page(id), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      // Autorise explicitement l'inclusion dans une iframe. Quand cette
      // directive est présente, les navigateurs ignorent X-Frame-Options.
      "Content-Security-Policy": "frame-ancestors *",
    },
  });
});
