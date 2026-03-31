#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */
const { cert, getApps, initializeApp } = require('firebase-admin/app')
const { getDatabase } = require('firebase-admin/database')

function parseServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (parsed.private_key) {
        parsed.private_key = String(parsed.private_key).replace(/\\n/g, '\n')
      }
      return parsed
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY must be valid JSON')
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : null

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase Admin credentials. Provide FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.'
    )
  }

  return {
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey,
  }
}

function getDatabaseUrl() {
  const databaseURL = process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
  if (!databaseURL) {
    throw new Error('Missing FIREBASE_DATABASE_URL (or NEXT_PUBLIC_FIREBASE_DATABASE_URL).')
  }
  return databaseURL
}

function getAdminDb() {
  const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert(parseServiceAccount()),
        databaseURL: getDatabaseUrl(),
      })

  return getDatabase(app)
}

function chunk(array, size) {
  const out = []
  for (let i = 0; i < array.length; i += size) {
    out.push(array.slice(i, i + size))
  }
  return out
}

async function main() {
  const apply = process.argv.includes('--yes')

  const db = getAdminDb()
  const usersSnapshot = await db.ref('users').get()
  if (!usersSnapshot.exists()) {
    console.log('No users found at /users. Nothing to update.')
    return
  }

  const userIds = []
  usersSnapshot.forEach((child) => {
    if (child.key) {
      userIds.push(child.key)
    }
  })

  if (userIds.length === 0) {
    console.log('No user ids found under /users. Nothing to update.')
    return
  }

  console.log(`Found ${userIds.length} users.`)

  if (!apply) {
    console.log('Dry run only. Re-run with --yes to apply updates.')
    return
  }

  const now = Date.now()
  const groups = chunk(userIds, 500)

  for (const group of groups) {
    const updates = {}
    for (const uid of group) {
      updates[`users/${uid}/billing/grandfathered`] = true
      updates[`users/${uid}/billing/entitlementActive`] = true
      updates[`users/${uid}/billing/status`] = 'active'
      updates[`users/${uid}/billing/updatedAt`] = now
      updates[`users/${uid}/billing/proGrantedAt`] = now
      updates[`users/${uid}/billing/proGrantReason`] = 'manual_forever_pro_grant'
    }

    await db.ref().update(updates)
  }

  console.log(`Updated ${userIds.length} users to forever Pro.`)
}

main().catch((error) => {
  console.error('Failed to grant forever Pro:', error.message)
  process.exit(1)
})
