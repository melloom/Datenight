#!/usr/bin/env bash
set -euo pipefail

# Install Netlify CLI if not present
if ! command -v netlify &>/dev/null; then
  echo "Installing Netlify CLI..."
  npm install -g netlify-cli
fi

# Check login status
netlify status || netlify login

# Link site if not already linked
netlify link || true

# Read the service account JSON as a single line
SA_KEY=$(cat /workspaces/Datenight/datenight-a2dbb-firebase-adminsdk-fbsvc-ed26340acb.json | tr -d '\n')

echo "Setting FIREBASE_SERVICE_ACCOUNT_KEY..."
netlify env:set FIREBASE_SERVICE_ACCOUNT_KEY "$SA_KEY"

echo "Setting FIREBASE_DATABASE_URL..."
netlify env:set FIREBASE_DATABASE_URL "https://datenight-a2dbb-default-rtdb.firebaseio.com"

echo "Setting FOREVER_PRO_UIDS..."
netlify env:set FOREVER_PRO_UIDS "1UAubwQWrNMstulNOeoyDZBiP7x2"

echo "Setting FOREVER_PRO_EMAILS..."
netlify env:set FOREVER_PRO_EMAILS "melvin.a.p.cruz@gmail.com"

echo ""
echo "All environment variables set! Triggering a new deploy..."
netlify deploy --build --prod

echo "Done! Check https://dat3night.com/api/stripe/status after deploy completes."
