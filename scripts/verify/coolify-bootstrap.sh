#!/usr/bin/env bash
# One-shot bootstrap for the edd-app-template production resource.
#
# Creates the Postgres, wires the app's environment, and deploys. Run it once,
# by hand. Every id below was resolved by name against the live API, not stored.
#
#   bash scripts/verify/coolify-bootstrap.sh
set -euo pipefail

ENVF=/Users/edd/Projects/ai-os/dev-env/env-config/.env
API=$(grep -m1 '^COOLIFY_API_URL=' "$ENVF" | cut -d= -f2- | tr -d '\r')
TOKEN=$(grep -m1 '^COOLIFY_API_TOKEN_WRITE=' "$ENVF" | cut -d= -f2- | tr -d '\r')

APP_UUID=feres95vsd11rnop470un6ss
PROJECT_UUID=azrrxo4r5i0b45sfpcc9dayq
SERVER_UUID=y711krrsfpdsjs72iyqi2xjc
ENV_UUID=fez5k2960ups4ha5wmgyyx5i
DOMAIN=https://edd-starter.eduardoinerarte.dk

api() { curl -sS --max-time 90 -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' "$@"; }

echo "==> 1/4  Postgres"
# No pipeline: `... | head -c 32` makes head close the pipe, the writer dies of
# SIGPIPE, and `set -o pipefail` turns that into a non-zero status that `set -e`
# then treats as a fatal error — the script exited here having printed nothing.
PGPASS=$(openssl rand -hex 16)
DB_JSON=$(api -X POST "$API/api/v1/databases/postgresql" -d "$(cat <<JSON
{"project_uuid":"$PROJECT_UUID","server_uuid":"$SERVER_UUID",
 "environment_name":"production","environment_uuid":"$ENV_UUID",
 "name":"edd-app-template-db","postgres_user":"edd_app",
 "postgres_password":"$PGPASS","postgres_db":"edd_app_template",
 "image":"postgres:15-alpine","instant_deploy":true}
JSON
)")
echo "$DB_JSON"
DB_UUID=$(echo "$DB_JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("uuid",""))')
[ -n "$DB_UUID" ] || { echo "no database uuid — stopping"; exit 1; }

# The app reaches it over the Coolify network by the database's uuid on 5432,
# which is how every other app in this Coolify addresses its own.
DATABASE_URL="postgresql://edd_app:$PGPASS@$DB_UUID:5432/edd_app_template"

echo "==> 2/4  environment"
# Secrets generated here and never printed: read them back from Coolify if needed.
# `is_buildtime` is not optional here. Vite inlines VITE_* at build time, so a
# variable that is only present at runtime never reaches the bundle and the
# deployed client keeps the localhost defaults it was built with — a working
# deploy that points at nothing. The fleet sets both flags on every variable;
# a non-VITE secret at build time is not exposed, since Vite only inlines the
# VITE_ prefix.
put_env() {
  api -X POST "$API/api/v1/applications/$APP_UUID/envs" \
    -d "{\"key\":\"$1\",\"value\":$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$2"),\"is_buildtime\":true,\"is_runtime\":true,\"is_preview\":false}" >/dev/null
  echo "    $1"
}
put_env NODE_ENV production
put_env PORT 2999
put_env APP_URL "$DOMAIN"
put_env BETTER_AUTH_URL "$DOMAIN"
put_env VITE_BETTER_AUTH_URL "$DOMAIN"
put_env AUTH_MODE local
put_env VITE_AUTH_MODE local
put_env DATABASE_URL "$DATABASE_URL"
put_env BETTER_AUTH_SECRET "$(openssl rand -base64 32)"
put_env DB_CONFIG_SECRET "$(openssl rand -base64 32)"

echo "==> 3/4  deploy"
DEPLOY=$(api "$API/api/v1/deploy?uuid=$APP_UUID&force=false")
echo "$DEPLOY"
DEPLOY_UUID=$(echo "$DEPLOY" | python3 -c 'import json,sys; d=json.load(sys.stdin).get("deployments",[{}])[0]; print(d.get("deployment_uuid",""))')
# Optional here, mandatory in CI: no id means nothing was queued.
[ -n "$DEPLOY_UUID" ] || { echo "Coolify queued nothing — check the app in the UI"; exit 1; }

echo "==> 4/4  waiting"
for _ in $(seq 1 120); do
  STATUS=$(api "$API/api/v1/deployments/$DEPLOY_UUID" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("status","unknown"))')
  case "$STATUS" in
    finished) echo "    finished"; break ;;
    failed|cancelled-by-user) echo "    $STATUS — read the log in Coolify"; exit 1 ;;
    *) echo "    $STATUS"; sleep 10 ;;
  esac
done

echo
echo "Now run the migrations once, from the app container's terminal in Coolify:"
echo "    pnpm db:migrate && pnpm db:seed:admin"
echo
curl -sS -o /dev/null -w "$DOMAIN/api/health -> HTTP %{http_code}\n" "$DOMAIN/api/health" || true
