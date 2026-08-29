/**
 * Migration smoke tests — run with backend dev server on PORT 4000.
 * Usage: npx tsx scripts/firebase-migration-test.ts
 */
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env') })
dotenv.config({ path: path.join(__dirname, '../../frontend/.env') })

const API_BASE = `http://localhost:${process.env.PORT || 4000}/api`

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, options)
  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    body = null
  }
  return { status: res.status, body }
}

async function getIdTokenForTestUser(): Promise<{ uid: string; idToken: string }> {
  const { adminAuth } = await import('../src/config/firebase-admin')
  const email = `migration-test-${Date.now()}@farmingo-test.local`
  const password = 'TestPass123!'

  let user
  try {
    user = await adminAuth.createUser({ email, password, displayName: 'Migration Test' })
  } catch (err) {
    throw new Error(`Failed to create Firebase test user: ${(err as Error).message}`)
  }

  const apiKey = process.env.NUXT_PUBLIC_FIREBASE_API_KEY
  if (!apiKey) {
    throw new Error(
      'NUXT_PUBLIC_FIREBASE_API_KEY not set in frontend/.env — required for ID token exchange in tests',
    )
  }

  const signInRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  )
  const signInBody = (await signInRes.json()) as { idToken?: string; error?: { message: string } }
  if (!signInRes.ok || !signInBody.idToken) {
    throw new Error(
      `Failed to obtain ID token: ${signInBody.error?.message || signInRes.status}`,
    )
  }

  return { uid: user.uid, idToken: signInBody.idToken }
}

async function main() {
  const results: { name: string; ok: boolean; detail?: string }[] = []
  const pass = (name: string, detail?: string) => results.push({ name, ok: true, detail })
  const fail = (name: string, detail?: string) => results.push({ name, ok: false, detail })

  console.log('Farmingo Firebase migration smoke tests\n')

  // 1. Unauthenticated /auth/me -> 401
  {
    const { status } = await request('/auth/me')
    status === 401 ? pass('Unauthenticated /auth/me returns 401') : fail('Unauthenticated /auth/me', `got ${status}`)
  }

  // 2. Invalid token -> 401
  {
    const { status } = await request('/auth/me', {
      headers: { Authorization: 'Bearer invalid-token' },
    })
    status === 401 ? pass('Invalid token returns 401') : fail('Invalid token', `got ${status}`)
  }

  let uid = ''
  let idToken = ''

  try {
    const auth = await getIdTokenForTestUser()
    uid = auth.uid
    idToken = auth.idToken
    pass('Firebase test user created and ID token obtained', uid)
  } catch (err) {
    fail('Firebase test user / ID token', (err as Error).message)
    printResults(results)
    process.exit(1)
  }

  // 3. Bootstrap profile
  {
    const { status, body } = await request('/auth/bootstrap', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: 'Migration Test Farmer',
        email: `migration-test-${Date.now()}@farmingo-test.local`,
        skipFarmSetup: true,
      }),
    })
    const ok = status === 201 || status === 200
    ok ? pass('Bootstrap creates Firestore profile', String(status)) : fail('Bootstrap', JSON.stringify(body))
  }

  // 4. Authenticated /auth/me
  {
    const { status, body } = await request('/auth/me', {
      headers: { Authorization: `Bearer ${idToken}` },
    })
    const data = (body as { data?: { user?: { id: string } } })?.data
    if (status === 200 && data?.user?.id === uid) {
      pass('Authenticated /auth/me accepts Firebase token')
    } else {
      fail('Authenticated /auth/me', JSON.stringify(body))
    }
  }

  // 5. Create farm field via API (if farm routes exist)
  {
    const { status, body } = await request('/fields', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Field',
        area: 2,
        areaUnit: 'hectares',
        layoutRow: 0,
        layoutCol: 0,
      }),
    })
    if (status === 201 || status === 200) {
      pass('Create field persists via Firestore', String(status))
    } else {
      fail('Create field', JSON.stringify(body))
    }
  }

  // 6. Re-fetch fields after "restart" simulation (just re-request)
  {
    const { status, body } = await request('/fields', {
      headers: { Authorization: `Bearer ${idToken}` },
    })
    const data = (body as { data?: unknown[] })?.data
    if (status === 200 && Array.isArray(data) && data.length > 0) {
      pass('Fields survive re-fetch (Firestore persistence)', `${data.length} field(s)`)
    } else {
      fail('Fields re-fetch', JSON.stringify(body))
    }
  }

  // Cleanup test user
  try {
    const { adminAuth } = await import('../src/config/firebase-admin')
    await adminAuth.deleteUser(uid)
    pass('Test Firebase user cleaned up')
  } catch {
    fail('Cleanup test user')
  }

  printResults(results)
  const failed = results.filter((r) => !r.ok).length
  process.exit(failed > 0 ? 1 : 0)
}

function printResults(results: { name: string; ok: boolean; detail?: string }[]) {
  console.log('\nResults:')
  for (const r of results) {
    console.log(`${r.ok ? '✓' : '✗'} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`)
  }
  const passed = results.filter((r) => r.ok).length
  console.log(`\n${passed}/${results.length} passed`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
