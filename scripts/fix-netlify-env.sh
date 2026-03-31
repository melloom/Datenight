#!/usr/bin/env bash
set -euo pipefail

echo "=== Building .env file for Netlify import ==="

# Extract private key as single line with literal \n
PRIVATE_KEY=$(node -e "
  const key = require('./datenight-a2dbb-firebase-adminsdk-fbsvc-ed26340acb.json').private_key;
  process.stdout.write(key.replace(/\n/g, '\\\\n'));
")

# Write a .env file for import
cat > /tmp/netlify-env-import.env <<ENVEOF
FIREBASE_PROJECT_ID=datenight-a2dbb
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@datenight-a2dbb.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="${PRIVATE_KEY}"
FIREBASE_DATABASE_URL=https://datenight-a2dbb-default-rtdb.firebaseio.com
FOREVER_PRO_UIDS=1UAubwQWrNMstulNOeoyDZBiP7x2
FOREVER_PRO_EMAILS=melvin.a.p.cruz@gmail.com
ENVEOF

echo "Importing env vars into Netlify..."
netlify env:import /tmp/netlify-env-import.env --replace-existing

rm -f /tmp/netlify-env-import.env

echo ""
echo "=== Env vars imported. Deploying... ==="
netlify deploy --build --prod

echo ""
echo "Done! Check https://dat3night.com/api/stripe/status"
