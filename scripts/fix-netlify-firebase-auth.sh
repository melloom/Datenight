#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SA_PATH="${1:-${FIREBASE_SERVICE_ACCOUNT_FILE:-}}"
TEMP_SA_PATH=""

if [[ -z "${SA_PATH}" ]] && [[ -n "${FIREBASE_SERVICE_ACCOUNT_KEY:-}" ]]; then
  TEMP_SA_PATH="$(mktemp)"
  printf '%s' "${FIREBASE_SERVICE_ACCOUNT_KEY}" > "${TEMP_SA_PATH}"
  SA_PATH="${TEMP_SA_PATH}"
fi

cleanup() {
  if [[ -n "${TEMP_SA_PATH}" ]] && [[ -f "${TEMP_SA_PATH}" ]]; then
    rm -f "${TEMP_SA_PATH}"
  fi
}
trap cleanup EXIT

if [[ ! -f "${SA_PATH}" ]]; then
  echo "Service account JSON not found."
  echo "Provide one of:"
  echo "  1) FIREBASE_SERVICE_ACCOUNT_FILE=/absolute/path/to/service-account.json"
  echo "  2) FIREBASE_SERVICE_ACCOUNT_KEY='{...json...}'"
  echo "  3) First script argument: ./scripts/fix-netlify-firebase-auth.sh /path/to/service-account.json"
  exit 1
fi

if ! command -v netlify >/dev/null 2>&1; then
  echo "Installing Netlify CLI..."
  npm install -g netlify-cli
fi

echo "Checking Netlify auth/session..."
netlify status >/dev/null 2>&1 || netlify login

echo "Linking Netlify site (if needed)..."
netlify link >/dev/null 2>&1 || true

echo "Reading Firebase service account and web app config..."
TMP_ENV_FILE="$(mktemp)"

node - <<'NODE' "${SA_PATH}" "${TMP_ENV_FILE}"
const fs = require('fs')
const path = process.argv[2]
const outPath = process.argv[3]
const crypto = require('crypto')

async function main() {
  const sa = JSON.parse(fs.readFileSync(path, 'utf8'))

  const projectId = sa.project_id
  const clientEmail = sa.client_email
  const privateKey = String(sa.private_key || '').replace(/\\n/g, '\n')
  const databaseUrl = `https://${projectId}-default-rtdb.firebaseio.com`

  const now = Math.floor(Date.now() / 1000)
  const base64url = (value) => Buffer.from(value).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify({
    iss: clientEmail,
    sub: clientEmail,
    aud: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/firebase',
    iat: now,
    exp: now + 3600,
  }))

  const unsigned = `${header}.${payload}`
  const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(privateKey, 'base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  })

  if (!tokenRes.ok) {
    throw new Error(`OAuth token request failed: ${tokenRes.status}`)
  }

  const tokenJson = await tokenRes.json()
  const accessToken = tokenJson.access_token
  if (!accessToken) {
    throw new Error('OAuth token response missing access_token')
  }

  const appsRes = await fetch(`https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!appsRes.ok) {
    throw new Error(`Failed to list Firebase web apps: ${appsRes.status}`)
  }

  const appsJson = await appsRes.json()
  const appId = appsJson?.apps?.[0]?.appId
  if (!appId) {
    throw new Error('No Firebase web app found. Create a Web App in Firebase Console first.')
  }

  const configRes = await fetch(`https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps/${encodeURIComponent(appId)}/config`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!configRes.ok) {
    throw new Error(`Failed to fetch Firebase web config: ${configRes.status}`)
  }

  const cfg = await configRes.json()
  const authDomain = cfg.authDomain || `${projectId}.firebaseapp.com`

  const escapedPrivateKey = privateKey.replace(/\n/g, '\\n')
  const saRawSingleLine = JSON.stringify({ ...sa, private_key: escapedPrivateKey })

  const lines = [
    `FIREBASE_PROJECT_ID=${projectId}`,
    `FIREBASE_CLIENT_EMAIL=${clientEmail}`,
    `FIREBASE_PRIVATE_KEY=${escapedPrivateKey}`,
    `FIREBASE_DATABASE_URL=${databaseUrl}`,
    `FIREBASE_SERVICE_ACCOUNT_KEY=${saRawSingleLine}`,
    `NEXT_PUBLIC_FIREBASE_API_KEY=${cfg.apiKey || ''}`,
    `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${authDomain}`,
    `NEXT_PUBLIC_FIREBASE_DATABASE_URL=${databaseUrl}`,
    `NEXT_PUBLIC_FIREBASE_PROJECT_ID=${projectId}`,
    `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${cfg.storageBucket || ''}`,
    `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${cfg.messagingSenderId || ''}`,
    `NEXT_PUBLIC_FIREBASE_APP_ID=${cfg.appId || appId}`,
    `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=${cfg.measurementId || ''}`,
  ]

  for (const line of lines) {
    if (line.endsWith('=')) {
      console.warn(`Warning: empty value for ${line.slice(0, -1)}`)
    }
  }

  fs.writeFileSync(outPath, lines.join('\n') + '\n')
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
NODE

echo "Setting Netlify environment variables..."
while IFS='=' read -r key value; do
  if [[ -z "${key}" ]]; then
    continue
  fi
  netlify env:set -- "${key}" "${value}" >/dev/null
  echo "Set ${key}"
done < "${TMP_ENV_FILE}"

rm -f "${TMP_ENV_FILE}"

echo "Deploying to production..."
netlify deploy --build --prod

echo "Done. Verify: https://dat3night.com/api/firebase/config"