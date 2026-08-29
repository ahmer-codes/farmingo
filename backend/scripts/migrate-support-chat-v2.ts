/**
 * Migrate support chat v1 (supportConversations/{userId}) to v2 (supportConversations/{conversationId}).
 *
 * Usage (dry-run):
 *   npx tsx scripts/migrate-support-chat-v2.ts --dry-run
 *
 * Apply migration:
 *   npx tsx scripts/migrate-support-chat-v2.ts
 *
 * Do NOT run against production without a backup and explicit approval.
 */
import dotenv from 'dotenv'
import { randomUUID } from 'crypto'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
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

function isV1Conversation(docId: string, data: FirebaseFirestore.DocumentData): boolean {
  if (data.migratedToV2) return false
  if (typeof data.isCurrent === 'boolean') return false
  return typeof data.userId === 'string' && data.userId === docId
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: getEnv('FIREBASE_PROJECT_ID'),
        clientEmail: getEnv('FIREBASE_CLIENT_EMAIL'),
        privateKey: resolvePrivateKey(getEnv('FIREBASE_PRIVATE_KEY')),
      }),
    })
  }

  const db = getFirestore()
  const col = db.collection('supportConversations')
  const snap = await col.get()

  let scanned = 0
  let migrated = 0
  let skipped = 0

  for (const doc of snap.docs) {
    scanned += 1
    const data = doc.data()

    if (!isV1Conversation(doc.id, data)) {
      skipped += 1
      continue
    }

    const v1UserId = doc.id
    const newConversationId = randomUUID()
    const now = new Date().toISOString()

    console.log(`\n[v1] ${v1UserId} → [v2] ${newConversationId}`)
    console.log(`  messages subcollection will be copied`)

    if (dryRun) {
      const msgSnap = await col.doc(v1UserId).collection('messages').count().get()
      console.log(`  dry-run: ${msgSnap.data().count} messages`)
      migrated += 1
      continue
    }

    const v2Record = {
      userId: data.userId,
      userEmail: String(data.userEmail || '').toLowerCase(),
      userName: String(data.userName || 'Farmer'),
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
      lastMessageText: data.lastMessageText || '',
      lastMessageAt: data.lastMessageAt || data.createdAt || now,
      lastSenderType: data.lastSenderType || 'user',
      unreadCountUser: data.unreadCountUser ?? 0,
      unreadCountAdmin: data.unreadCountAdmin ?? 0,
      status: data.status || 'open',
      priority: data.priority || 'normal',
      assignedAdminId: data.assignedAdminId,
      lastAdminId: data.lastAdminId,
      isCurrent: true,
      migratedFromV1UserId: v1UserId,
      metadata: data.metadata,
    }

    await db.runTransaction(async (tx) => {
      const existingCurrent = await col
        .where('userId', '==', data.userId)
        .where('isCurrent', '==', true)
        .limit(1)
        .get()

      for (const existing of existingCurrent.docs) {
        if (existing.id !== newConversationId) {
          tx.update(existing.ref, { isCurrent: false, updatedAt: now })
        }
      }

      tx.set(col.doc(newConversationId), v2Record)
      tx.update(col.doc(v1UserId), {
        isCurrent: false,
        archivedAt: now,
        migratedToV2: newConversationId,
        migratedAt: now,
        updatedAt: now,
      })
    })

    const sourceMessages = await col.doc(v1UserId).collection('messages').orderBy('createdAt', 'asc').get()
    let batch = db.batch()
    let ops = 0
    for (const msgDoc of sourceMessages.docs) {
      const msgData = msgDoc.data()
      batch.set(col.doc(newConversationId).collection('messages').doc(msgDoc.id), {
        ...msgData,
        conversationId: newConversationId,
      })
      ops += 1
      if (ops >= 400) {
        await batch.commit()
        batch = db.batch()
        ops = 0
      }
    }
    if (ops > 0) await batch.commit()

    console.log(`  migrated ${sourceMessages.size} messages`)
    migrated += 1
  }

  console.log('\n=== Support Chat v2 Migration Summary ===')
  console.log(`Scanned: ${scanned}`)
  console.log(`Migrated: ${migrated}`)
  console.log(`Skipped: ${skipped}`)
  console.log(dryRun ? 'DRY RUN — no writes performed' : 'Migration complete')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
