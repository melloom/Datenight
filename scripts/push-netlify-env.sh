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

# Read service account JSON from env var or provided file.
SA_KEY="${FIREBASE_SERVICE_ACCOUNT_KEY:-}"
SA_PATH="${FIREBASE_SERVICE_ACCOUNT_FILE:-}"

if [[ -z "${SA_KEY}" ]] && [[ -n "${SA_PATH}" ]] && [[ -f "${SA_PATH}" ]]; then
  SA_KEY="$(tr -d '\n' < "${SA_PATH}")"
fi

if [[ -z "${SA_KEY}" ]]; then
  echo "Missing service account key. Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_SERVICE_ACCOUNT_FILE."
  exit 1
fi

PROJECT_ID="${FIREBASE_PROJECT_ID:-datenight-a2dbb}"
DATABASE_URL="${FIREBASE_DATABASE_URL:-https://${PROJECT_ID}-default-rtdb.firebaseio.com}"

echo "Setting FIREBASE_SERVICE_ACCOUNT_KEY..."
netlify env:set FIREBASE_SERVICE_ACCOUNT_KEY "$SA_KEY"

echo "Setting FIREBASE_DATABASE_URL..."
netlify env:set FIREBASE_DATABASE_URL "${DATABASE_URL}"

if [[ -n "${FOREVER_PRO_UIDS:-}" ]]; then
  echo "Setting FOREVER_PRO_UIDS..."
  netlify env:set FOREVER_PRO_UIDS "${FOREVER_PRO_UIDS}"
fi

if [[ -n "${FOREVER_PRO_EMAILS:-}" ]]; then
  echo "Setting FOREVER_PRO_EMAILS..."
  netlify env:set FOREVER_PRO_EMAILS "${FOREVER_PRO_EMAILS}"
fi

echo ""
echo "All environment variables set! Triggering a new deploy..."
netlify deploy --build --prod

echo "Done! Check https://dat3night.com/api/stripe/status after deploy completes."
