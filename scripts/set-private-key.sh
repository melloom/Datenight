#!/usr/bin/env bash
set -euo pipefail

echo "=== Setting FIREBASE_PRIVATE_KEY via Netlify API ==="

# Accept private key directly or parse from a service account JSON file.
PRIVATE_KEY_RAW="${FIREBASE_PRIVATE_KEY:-}"
SA_PATH="${FIREBASE_SERVICE_ACCOUNT_FILE:-}"

if [[ -z "${PRIVATE_KEY_RAW}" ]] && [[ -n "${SA_PATH}" ]] && [[ -f "${SA_PATH}" ]]; then
  PRIVATE_KEY_RAW="$(node -e "const fs=require('fs');const sa=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));process.stdout.write(sa.private_key||'');" "${SA_PATH}")"
fi

if [[ -z "${PRIVATE_KEY_RAW}" ]]; then
  echo "Missing private key. Set FIREBASE_PRIVATE_KEY or FIREBASE_SERVICE_ACCOUNT_FILE."
  exit 1
fi

# Convert real newlines to literal \n for env var storage.
PRIVATE_KEY_ESCAPED="$(printf '%s' "${PRIVATE_KEY_RAW}" | sed ':a;N;$!ba;s/\n/\\n/g')"

if ! command -v netlify >/dev/null 2>&1; then
  echo "Installing Netlify CLI..."
  npm install -g netlify-cli
fi

netlify status >/dev/null 2>&1 || netlify login
netlify link >/dev/null 2>&1 || true

# Write to a temp file so we can use --value flag
TMPFILE=$(mktemp)
echo -n "$PRIVATE_KEY_ESCAPED" > "$TMPFILE"

netlify env:set FIREBASE_PRIVATE_KEY "$(cat "$TMPFILE")"

rm -f "$TMPFILE"

echo ""
echo "Now triggering deploy..."
netlify deploy --build --prod
