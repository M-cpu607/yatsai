#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════
# Base Scolympia en local.
#
# Lance sur votre machine les cinq services dont l'application a besoin
# (Postgres, PostgREST, GoTrue, Realtime, Storage), avec le schéma exact
# de la production.
#
#   ./scripts/db-local.sh start     démarre et bascule l'app en local
#   ./scripts/db-local.sh stop      arrête et rebascule sur le cloud
#   ./scripts/db-local.sh reset     remet la base à zéro (schéma + jeu d'essai)
#   ./scripts/db-local.sh status    indique où pointe l'application
#   ./scripts/db-local.sh dump      exporte la base dans un fichier .sql
# ══════════════════════════════════════════════════════════════════════
set -euo pipefail

RACINE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RACINE"
ENV_LOCAL="$RACINE/.env.local"
DOSSIER_DUMP="$RACINE/supabase/dumps"

rouge()  { printf '\033[31m%s\033[0m\n' "$*"; }
vert()   { printf '\033[32m%s\033[0m\n' "$*"; }
jaune()  { printf '\033[33m%s\033[0m\n' "$*"; }

sb() {
  if command -v supabase >/dev/null 2>&1; then supabase "$@"; else npx --yes supabase "$@"; fi
}

verifier_prerequis() {
  if ! command -v docker >/dev/null 2>&1; then
    rouge "Docker n'est pas installé."
    echo "  La pile Supabase locale a besoin de Docker pour faire tourner les"
    echo "  cinq services. Installez Docker Desktop : https://docker.com/products/docker-desktop"
    exit 1
  fi
  if ! docker info >/dev/null 2>&1; then
    rouge "Docker est installé mais ne tourne pas."
    echo "  Ouvrez Docker Desktop et attendez que la baleine soit stable, puis relancez."
    exit 1
  fi
}

# Lit une valeur dans la sortie de `supabase status`.
lire_status() {
  sb status 2>/dev/null | grep -i "$1" | head -1 | sed 's/.*:[[:space:]]*//' | tr -d '[:space:]'
}

ecrire_env_local() {
  local url="$1" cle="$2"
  cat > "$ENV_LOCAL" <<EOF
# ══════════════════════════════════════════════════════════════════
# Bascule vers la base LOCALE.
#
# Vite donne la priorité à .env.local sur .env : tant que ce fichier
# existe, l'application parle à votre machine et non au cloud.
# Supprimez-le (ou lancez ./scripts/db-local.sh stop) pour revenir
# à la production.
#
# Généré automatiquement — ne pas modifier à la main.
# ══════════════════════════════════════════════════════════════════
VITE_SUPABASE_URL=$url
VITE_SUPABASE_ANON_KEY=$cle
EOF
}

cmd_start() {
  verifier_prerequis
  jaune "Démarrage de la pile locale (premier lancement : téléchargement de ~2 Go d'images)…"
  sb start

  local url cle
  url="$(lire_status 'API URL')"
  cle="$(lire_status 'anon key')"

  if [ -z "$url" ] || [ -z "$cle" ]; then
    rouge "Impossible de lire l'URL ou la clé depuis 'supabase status'."
    echo "  Lancez 'supabase status' et reportez les valeurs à la main dans .env.local"
    exit 1
  fi

  ecrire_env_local "$url" "$cle"
  vert "✓ Pile locale démarrée, application basculée en local."
  echo
  echo "  API        $url"
  echo "  Studio     http://127.0.0.1:54323      (parcourir et modifier les données)"
  echo "  E-mails    http://127.0.0.1:54324      (tous les envois de l'app atterrissent ici)"
  echo "  Postgres   postgresql://postgres:postgres@127.0.0.1:54322/postgres"
  echo
  echo "  Comptes d'essai — mot de passe : scolympia"
  echo "    kylian@scolympia.local     athlète"
  echo "    aminata@scolympia.local    athlète"
  echo "    marc@scolympia.local       recruteur"
  echo "    admin@scolympia.local      administrateur"
  echo
  jaune "  Relancez 'npm run dev' pour que Vite relise la configuration."
}

cmd_stop() {
  sb stop || true
  rm -f "$ENV_LOCAL"
  vert "✓ Pile locale arrêtée, application rebasculée sur le cloud."
  jaune "  Relancez 'npm run dev' pour que Vite relise la configuration."
}

cmd_reset() {
  verifier_prerequis
  jaune "Remise à zéro : rejoue les migrations puis le jeu d'essai…"
  sb db reset
  vert "✓ Base réinitialisée."
}

cmd_status() {
  echo "Application :"
  if [ -f "$ENV_LOCAL" ]; then
    vert "  → base LOCALE   ($(grep VITE_SUPABASE_URL "$ENV_LOCAL" | cut -d= -f2-))"
    echo "     (.env.local présent, il prime sur .env)"
  else
    jaune "  → base CLOUD    ($(grep VITE_SUPABASE_URL .env 2>/dev/null | cut -d= -f2- || echo 'indéterminée'))"
  fi
  echo
  echo "Pile locale :"
  if docker info >/dev/null 2>&1 && sb status >/dev/null 2>&1; then
    sb status 2>/dev/null | sed 's/^/  /'
  else
    echo "  arrêtée"
  fi
}

cmd_dump() {
  verifier_prerequis
  mkdir -p "$DOSSIER_DUMP"
  local horodatage fichier
  horodatage="$(date +%Y%m%d-%H%M%S)"
  fichier="$DOSSIER_DUMP/scolympia-$horodatage.sql"

  # pg_dump depuis le conteneur : garantit une version alignée sur le
  # serveur, alors qu'un pg_dump local plus ancien refuserait de tourner.
  docker exec "$(docker ps --filter 'name=supabase_db' --format '{{.Names}}' | head -1)" \
    pg_dump -U postgres --data-only --schema=public --schema=auth --schema=storage postgres \
    > "$fichier"

  vert "✓ Base exportée : $fichier  ($(du -h "$fichier" | cut -f1))"
  echo "  Restauration : psql 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' -f $fichier"
}

case "${1:-}" in
  start)  cmd_start  ;;
  stop)   cmd_stop   ;;
  reset)  cmd_reset  ;;
  status) cmd_status ;;
  dump)   cmd_dump   ;;
  *)
    sed -n '2,16p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
    exit 1
    ;;
esac
