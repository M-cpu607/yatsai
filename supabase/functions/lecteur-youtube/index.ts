import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Collecteur de balises du lecteur YouTube.
//
// La page relais qui héberge le lecteur vit sur un hébergeur statique
// (voir public/lecteur-youtube/, servie par Vercel) : Supabase réécrit en text/plain tout
// HTML servi par ses fonctions Edge comme par son Storage, le script n'y
// s'exécuterait jamais. Cette fonction ne sert donc plus de page.
//
// Elle reçoit les étapes que la page signale — page chargée, API chargée,
// prêt, état du lecteur, code d'erreur — sous la forme
// `?v=<id>&journal=<étape>`. Chaque appel apparaît dans les journaux du
// projet : c'est ce qui permet de voir, à distance, ce qui se passe dans
// la WebView d'un téléphone.
//
// Aucun JWT : `navigator.sendBeacon` ne peut pas porter d'en-tête
// Authorization. En contrepartie la fonction ne lit ni n'écrit aucune
// donnée et ne renvoie jamais de contenu.

Deno.serve((req: Request) => {
  const url = new URL(req.url);
  if (url.searchParams.has("journal")) {
    return new Response(null, {
      status: 204,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
  return new Response(null, { status: 404 });
});
