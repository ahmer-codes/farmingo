/**
 * Create a Firebase Auth admin account with a temporary password.
 *
 * Usage:
 *   ADMIN_BOOTSTRAP_EMAILS=admin@example.com npx tsx scripts/create-admin.ts admin@example.com
 *
 * Optional: pass --name "Admin Name"
 */
import { randomBytes } from 'crypto'
import dotenv from 'dotenv'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { ensureAdminProfile } from './ensureAdminProfile'

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

function generateTempPassword(): string {
  const base = randomBytes(12).toString('base64url')
  return `Fm!${base}9`
}

function parseNameArg(): string {
  const idx = process.argv.indexOf('--name')
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1]!
  return 'Farmingo Admin'
}

async function main() {
  const emailArg = process.argv[2]
  if (!emailArg || emailArg.startsWith('--')) {
    console.error('Usage: npx tsx scripts/create-admin.ts <email> [--name "Full Name"]')
    process.exit(1)
  }

  const email = emailArg.toLowerCase().trim()
  const fullName = parseNameArg()

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
  const tempPassword = generateTempPassword()

  let user
  try {
    user = await auth.getUserByEmail(email)
    await auth.setCustomUserClaims(user.uid, { role: 'admin' })
    console.log(`Existing Firebase user found for ${email}. Admin claim applied.`)
    console.log('Password was NOT changed. Use Firebase password reset if needed.')
  } catch {
    user = await auth.createUser({
      email,
      password: tempPassword,
      displayName: fullName,
      emailVerified: true,
    })
    await auth.setCustomUserClaims(user.uid, { role: 'admin' })
  }

  await db.collection('admins').doc(user.uid).set(
    {
      email,
      fullName,
      role: 'admin',
      createdAt: new Date().toISOString(),
    },
    { merge: true },
  )

  await ensureAdminProfile(user.uid, email, fullName)

  console.log('\n=== Farmingo Admin Account ===')
  console.log(`Email: ${email}`)
  if (user.metadata.creationTime === user.metadata.lastSignInTime) {
    console.log(`Temporary password: ${tempPassword}`)
    console.log('\nIMPORTANT: Sign in once and change this password immediately.')
  }
  console.log(`UID: ${user.uid}`)
  console.log('\nSign in at /login — admins are redirected to /admin after authentication.')
  console.log('If the admin claim was just applied, sign out and sign in again to refresh the ID token.')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
