/**
 * Grant admin custom claim to an existing Firebase Auth user.
 *
 * Usage:
 *   ADMIN_BOOTSTRAP_EMAILS=you@example.com npx tsx scripts/grant-admin.ts you@example.com
 */
import dotenv from 'dotenv'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

dotenv.config()

function resolvePrivateKey(raw: string): string {
  return raw.replace(/\\n/g, '\n')
}

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    console.error(`Missing required environment variable: ${name}`)
    process.exit(1)
  }
  return value
}

async function main() {
  const emailArg = process.argv[2]
  if (!emailArg) {
    console.error('Usage: npx tsx scripts/grant-admin.ts <email>')
    process.exit(1)
  }

  const email = emailArg.toLowerCase().trim()
  const allowlist = getEnv('ADMIN_BOOTSTRAP_EMAILS')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  if (!allowlist.includes(email)) {
    console.error(`Email ${email} is not in ADMIN_BOOTSTRAP_EMAILS allowlist.`)
    process.exit(1)
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: getEnv('FIREBASE_PROJECT_ID'),
        clientEmail: getEnv('FIREBASE_CLIENT_EMAIL'),
        privateKey: resolvePrivateKey(getEnv('FIREBASE_PRIVATE_KEY')),
      }),
    })
  }

  const auth = getAuth()
  const db = getFirestore()

  const user = await auth.getUserByEmail(email)
  await auth.setCustomUserClaims(user.uid, { role: 'admin' })

  await db.collection('admins').doc(user.uid).set(
    {
      email,
      role: 'admin',
      grantedAt: new Date().toISOString(),
    },
    { merge: true },
  )

  const { ensureAdminProfile } = await import('./ensureAdminProfile')
  const fullName = user.displayName?.trim() || email.split('@')[0] || 'Farmingo Admin'
  await ensureAdminProfile(user.uid, email, fullName)

  console.log(`Admin role granted to ${email} (uid: ${user.uid})`)
  console.log('Ask the user to sign out and sign in again (or refresh ID token) to pick up the claim.')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
