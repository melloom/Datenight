#!/usr/bin/env bash
set -euo pipefail

echo "=== Building .env file for Netlify import ==="

# Accept either a service account JSON file or explicit environment variables.
SA_PATH="${FIREBASE_SERVICE_ACCOUNT_FILE:-}"

if [[ -n "${SA_PATH}" ]] && [[ -f "${SA_PATH}" ]]; then
  FIREBASE_PROJECT_ID="$(node -e "const fs=require('fs');const sa=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));process.stdout.write(sa.project_id||'');" "${SA_PATH}")"
  FIREBASE_CLIENT_EMAIL="$(node -e "const fs=require('fs');const sa=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));process.stdout.write(sa.client_email||'');" "${SA_PATH}")"
  FIREBASE_PRIVATE_KEY_RAW="$(node -e "const fs=require('fs');const sa=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));process.stdout.write(sa.private_key||'');" "${SA_PATH}")"
else
  FIREBASE_PROJECT_ID="${FIREBASE_PROJECT_ID:-}"
  FIREBASE_CLIENT_EMAIL="${FIREBASE_CLIENT_EMAIL:-}"
  FIREBASE_PRIVATE_KEY_RAW="${FIREBASE_PRIVATE_KEY:-}"
fi

if [[ -z "${FIREBASE_PROJECT_ID}" ]] || [[ -z "${FIREBASE_CLIENT_EMAIL}" ]] || [[ -z "${FIREBASE_PRIVATE_KEY_RAW}" ]]; then
  echo "Missing Firebase credentials."
  echo "Provide FIREBASE_SERVICE_ACCOUNT_FILE or all of FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY."
  exit 1
fi

PRIVATE_KEY="$(printf '%s' "${FIREBASE_PRIVATE_KEY_RAW}" | sed ':a;N;$!ba;s/\n/\\n/g')"
FIREBASE_DATABASE_URL="${FIREBASE_DATABASE_URL:-https://${FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com}"

# Write a .env file for import
cat > /tmp/netlify-env-import.env <<ENVEOF
FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}
FIREBASE_PRIVATE_KEY="${PRIVATE_KEY}"
FIREBASE_DATABASE_URL=${FIREBASE_DATABASE_URL}
FOREVER_PRO_UIDS=${FOREVER_PRO_UIDS:-}
FOREVER_PRO_EMAILS=${FOREVER_PRO_EMAILS:-}
ENVEOF

echo "Importing env vars into Netlify..."
netlify env:import /tmp/netlify-env-import.env --replace-existing

rm -f /tmp/netlify-env-import.env

echo ""
echo "=== Env vars imported. Deploying... ==="
netlify deploy --build --prod

echo ""
echo "Done! Check https://dat3night.com/api/stripe/status"
