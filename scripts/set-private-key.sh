#!/usr/bin/env bash
set -euo pipefail

echo "=== Setting FIREBASE_PRIVATE_KEY via Netlify API ==="

# Extract the private key as a single line with literal \n (not real newlines)
# This is what firebase-admin.ts expects — it does .replace(/\\n/g, '\n')
PRIVATE_KEY_ESCAPED=$(node -e "
  const key = require('./datenight-a2dbb-firebase-adminsdk-fbsvc-ed26340acb.json').private_key;
  // Convert real newlines to literal \\n for env var storage
  process.stdout.write(key.replace(/\n/g, '\\\\n'));
")

# Write to a temp file so we can use --value flag
TMPFILE=$(mktemp)
echo -n "$PRIVATE_KEY_ESCAPED" > "$TMPFILE"

# Use the Netlify CLI with stdin approach
netlify env:set FIREBASE_PRIVATE_KEY "$(cat "$TMPFILE")" --force 2>/dev/null \
  || netlify env:import <(echo "FIREBASE_PRIVATE_KEY=$(cat "$TMPFILE")") 2>/dev/null \
  || {
    # Last resort: use the Netlify API directly
    echo "CLI failed, using Netlify API directly..."
    
    # Get site ID and token
    SITE_ID=$(netlify status --json 2>/dev/null | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).siteData.id)}catch{console.log('')}})" 2>/dev/null || echo "")
    TOKEN=$(cat ~/.netlify/config.json 2>/dev/null | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j.users?.[Object.keys(j.users)[0]]?.auth?.token||'')}catch{console.log('')}})" 2>/dev/null || echo "")
    
    if [ -n "$SITE_ID" ] && [ -n "$TOKEN" ]; then
      KEY_VALUE=$(cat "$TMPFILE")
      curl -s -X PATCH "https://api.netlify.com/api/v1/accounts/$(netlify status --json | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).siteData.account_slug))")/env/FIREBASE_PRIVATE_KEY" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"context\":\"all\",\"value\":\"$KEY_VALUE\"}" && echo "Set via API!" || echo "API method also failed."
    else
      echo ""
      echo "========================================================"
      echo "MANUAL STEP NEEDED"
      echo "========================================================"
      echo "Copy this value and paste it into Netlify UI as FIREBASE_PRIVATE_KEY:"
      echo ""
      cat "$TMPFILE"
      echo ""
      echo "========================================================"
    fi
  }

rm -f "$TMPFILE"

echo ""
echo "Now triggering deploy..."
netlify deploy --build --prod
