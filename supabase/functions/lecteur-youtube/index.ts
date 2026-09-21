import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Sert une page HTML minimale qui héberge le lecteur YouTube.
//
// Pourquoi elle existe : dans l'application iOS empaquetée, la page tourne
// sous le schéma `capacitor://localhost`. WKWebView réserve http et https,
// Capacitor interdit donc de les donner à `iosScheme`, et YouTube — qui
// refuse les intégrations sans référent http(s) valide — répond « erreur
// 153 ». Cette fonction, elle, est servie depuis
// https://<projet>.supabase.co : le lecteur qu'elle contient présente donc
// à YouTube un référent que YouTube accepte.
//
// Aucun JWT n'est exigé, pour deux raisons : une balise <iframe> ne peut pas
// porter d'en-tête Authorization, et la fonction ne lit ni n'écrit aucune
// donnée — elle ne renvoie que du HTML public construit à partir d'un
// identifiant de vidéo YouTube, lui-même déjà public.

const ID_VALIDE = /^[A-Za-z0-9_-]{11}$/;

const page = (id: string) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Lecteur</title>
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #000; overflow: hidden; }
  iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
</style>
</head>
<body>
<iframe
  src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&amp;playsinline=1&amp;rel=0"
  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen></iframe>
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
