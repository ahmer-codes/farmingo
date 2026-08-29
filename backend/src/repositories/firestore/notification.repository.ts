import type { NotificationRecord } from "../../models/notification";
import type { NotificationRepository } from "../notification.types";
import { db } from "../../config/firebase-admin";
import {
  COLLECTIONS,
  docToRecord,
  nowIso,
  stripUndefined,
} from "../../utils/firestore";

const col = () => db.collection(COLLECTIONS.notifications);

export const firestoreNotificationRepository: NotificationRepository = {
  async findByUserId(userId, options) {
    const qs = await col().where("userId", "==", userId).get();
    let records = qs.docs.map((d) => docToRecord<NotificationRecord>(d));
    if (!options?.includeDismissed) {
      records = records.filter((n) => !n.dismissedAt);
    }
    return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async findById(id) {
    const snap = await col().doc(id).get();
    if (!snap.exists) return null;
    return docToRecord<NotificationRecord>(snap);
  },

  async findByDedupeKey(userId, dedupeKey) {
    const qs = await col()
      .where("userId", "==", userId)
      .where("dedupeKey", "==", dedupeKey)
      .limit(1)
      .get();
    if (qs.empty) return null;
    return docToRecord<NotificationRecord>(qs.docs[0]!);
  },

  async create(record) {
    const { id, ...rest } = record;
    await col().doc(id).set(stripUndefined(rest));
    return record;
  },

  async update(id, patch) {
    const ref = col().doc(id);
    const existing = await ref.get();
    if (!existing.exists) return null;
    await ref.update(stripUndefined(patch));
    const updated = await ref.get();
    return docToRecord<NotificationRecord>(updated);
  },

  async delete(id) {
    const ref = col().doc(id);
    const existing = await ref.get();
    if (!existing.exists) return false;
    await ref.delete();
    return true;
  },

  async markAllRead(userId) {
    const qs = await col().where("userId", "==", userId).get();
    const batch = db.batch();
    let count = 0;
    const ts = nowIso();
    for (const doc of qs.docs) {
      const data = doc.data();
      if (!data.readAt) {
        batch.update(doc.ref, { readAt: ts });
        count++;
      }
    }
    if (count > 0) await batch.commit();
    return count;
  },

  async countUnread(userId) {
    const snap = await col()
      .where("userId", "==", userId)
      .where("readAt", "==", null)
      .where("dismissedAt", "==", null)
      .count()
      .get();
    return snap.data().count;
  },
};
