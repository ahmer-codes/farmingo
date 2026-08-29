/**
 * Registration field persistence test — backend must be running on PORT 4000.
 * Usage: npx tsx scripts/registration-field-test.ts
 */
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env') })
dotenv.config({ path: path.join(__dirname, '../../frontend/.env') })

const API_BASE = `http://localhost:${process.env.PORT || 4000}/api`

async function request(urlPath: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${urlPath}`, options)
  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    body = null
  }
  return { status: res.status, body }
}

async function getIdToken(email: string, password: string): Promise<{ uid: string; idToken: string }> {
  const { adminAuth } = await import('../src/config/firebase-admin')
  const user = await adminAuth.createUser({ email, password, displayName: 'Field Test Farmer' })

  const apiKey = process.env.NUXT_PUBLIC_FIREBASE_API_KEY
  if (!apiKey) {
    throw new Error('NUXT_PUBLIC_FIREBASE_API_KEY required in frontend/.env')
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
    throw new Error(signInBody.error?.message || 'Failed to get ID token')
  }

  return { uid: user.uid, idToken: signInBody.idToken }
}

const bootstrapPayload = {
  fullName: 'Field Test Farmer',
  email: '', // filled at runtime
  farm: {
    name: 'Test Farm',
    location: 'Test Location',
    size: 100,
    unit: 'acres',
    farmingType: 'crop',
  },
  crops: ['Rice'],
  skipFarmSetup: false,
  preferences: {
    temperatureUnit: 'celsius',
    landUnit: 'acres',
  },
}

async function main() {
  const results: { name: string; ok: boolean; detail?: string }[] = []
  const pass = (name: string, detail?: string) => results.push({ name, ok: true, detail })
  const fail = (name: string, detail?: string) => results.push({ name, ok: false, detail })

  const email = `field-test-${Date.now()}@farmingo-test.local`
  const password = 'TestPass123!'
  bootstrapPayload.email = email

  let uid = ''
  let idToken = ''

  try {
    const auth = await getIdToken(email, password)
    uid = auth.uid
    idToken = auth.idToken
    pass('Firebase test user + ID token')
  } catch (err) {
    fail('Firebase auth setup', (err as Error).message)
    printResults(results)
    process.exit(1)
  }

  const headers = {
    Authorization: `Bearer ${idToken}`,
    'Content-Type': 'application/json',
  }

  // First bootstrap
  {
    const { status, body } = await request('/auth/bootstrap', {
      method: 'POST',
      headers,
      body: JSON.stringify(bootstrapPayload),
    })
    status === 201 || status === 200
      ? pass('Bootstrap creates profile', String(status))
      : fail('Bootstrap', JSON.stringify(body))
  }

  const { db } = await import('../src/config/firebase-admin')
  const { adminAuth } = await import('../src/config/firebase-admin')

  // Verify Firestore documents
  const userSnap = await db.collection('users').doc(uid).get()
  userSnap.exists ? pass('users/{uid} exists') : fail('users/{uid} missing')

  const farmsQs = await db.collection('farms').where('ownerId', '==', uid).get()
  if (farmsQs.empty) {
    fail('farms document missing')
  } else {
    const farm = farmsQs.docs[0]!.data()
    pass('farms/{farmId} exists', farmsQs.docs[0]!.id)
    farm.name === 'Test Farm' && farm.size === 100 && farm.unit === 'acres'
      ? pass('Farm data persisted correctly')
      : fail('Farm data', JSON.stringify({ name: farm.name, size: farm.size, unit: farm.unit }))
    Array.isArray(farm.primaryCrops) && farm.primaryCrops.includes('Rice')
      ? pass('farms.primaryCrops contains Rice')
      : fail('primaryCrops', JSON.stringify(farm.primaryCrops))
  }

  const fieldsQs = await db.collection('fields').where('userId', '==', uid).get()
  if (fieldsQs.empty) {
    fail('fields document missing')
  } else {
    const field = fieldsQs.docs[0]!.data()
    const farmId = farmsQs.docs[0]!.id
    field.userId === uid && field.farmId === farmId
      ? pass('Field linked to user and farm')
      : fail('Field relationships', JSON.stringify({ userId: field.userId, farmId: field.farmId }))
    field.name === 'Test Farm — Main Field' && field.area === 100 && field.areaUnit === 'acres'
      ? pass('Initial field data correct')
      : fail('Field data', JSON.stringify({ name: field.name, area: field.area, areaUnit: field.areaUnit }))
  }

  const cropsQs = await db.collection('crops').where('userId', '==', uid).get()
  cropsQs.empty ? pass('No CropRecord created at registration') : fail('Unexpected crops', String(cropsQs.size))

  const fieldCountBefore = fieldsQs.size
  const farmCountBefore = farmsQs.size

  // Idempotent second bootstrap
  {
    const { status } = await request('/auth/bootstrap', {
      method: 'POST',
      headers,
      body: JSON.stringify(bootstrapPayload),
    })
    status === 201 || status === 200 ? pass('Second bootstrap succeeds') : fail('Second bootstrap', String(status))
  }

  const farmsAfter = await db.collection('farms').where('ownerId', '==', uid).get()
  const fieldsAfter = await db.collection('fields').where('userId', '==', uid).get()
  farmsAfter.size === farmCountBefore
    ? pass('No duplicate farm on retry')
    : fail('Duplicate farm', `${farmCountBefore} -> ${farmsAfter.size}`)
  fieldsAfter.size === fieldCountBefore
    ? pass('No duplicate field on retry')
    : fail('Duplicate field', `${fieldCountBefore} -> ${fieldsAfter.size}`)

  // Fields API returns the field
  {
    const { status, body } = await request('/fields', { headers: { Authorization: `Bearer ${idToken}` } })
    const data = (body as { data?: unknown[] })?.data
    if (status === 200 && Array.isArray(data) && data.length > 0) {
      pass('GET /fields returns initial field', `${data.length} field(s)`)
    } else {
      fail('GET /fields', JSON.stringify(body))
    }
  }

  // Cleanup
  try {
    for (const doc of fieldsAfter.docs) await doc.ref.delete()
    for (const doc of farmsAfter.docs) await doc.ref.delete()
    await db.collection('users').doc(uid).delete()
    await adminAuth.deleteUser(uid)
    pass('Test data cleaned up')
  } catch {
    fail('Cleanup')
  }

  printResults(results)
  process.exit(results.some((r) => !r.ok) ? 1 : 0)
}

function printResults(results: { name: string; ok: boolean; detail?: string }[]) {
  console.log('\nRegistration field persistence tests\n')
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
