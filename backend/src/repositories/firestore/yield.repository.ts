import type { YieldRecord } from "../../models/crop";
import type { YieldRepository } from "../crop.types";
import { db } from "../../config/firebase-admin";
import {
  COLLECTIONS,
  docToRecord,
  nowIso,
  stripUndefined,
} from "../../utils/firestore";

const col = () => db.collection(COLLECTIONS.yieldRecords);

export const firestoreYieldRepository: YieldRepository = {
  async listByUser(userId) {
    const qs = await col().where("userId", "==", userId).get();
    return qs.docs.map((d) => docToRecord<YieldRecord>(d));
  },

  async countByCropId(userId, cropId) {
    const qs = await col()
      .where("userId", "==", userId)
      .where("cropId", "==", cropId)
      .limit(1)
      .get();
    return qs.size;
  },

  async findByIdForUser(id, userId) {
    const snap = await col().doc(id).get();
    if (!snap.exists) return null;
    const record = docToRecord<YieldRecord>(snap);
    return record.userId === userId ? record : null;
  },

  async create(record) {
    const { id, ...rest } = record;
    await col().doc(id).set(stripUndefined(rest));
    return record;
  },

  async createMany(records) {
    const batch = db.batch();
    for (const record of records) {
      const { id, ...rest } = record;
      batch.set(col().doc(id), stripUndefined(rest));
    }
    await batch.commit();
    return records;
  },

  async update(id, userId, patch) {
    const existing = await this.findByIdForUser(id, userId);
    if (!existing) return null;
    await col()
      .doc(id)
      .update(stripUndefined({ ...patch, updatedAt: nowIso() }));
    return this.findByIdForUser(id, userId);
  },

  async delete(id, userId) {
    const existing = await this.findByIdForUser(id, userId);
    if (!existing) return false;
    await col().doc(id).delete();
    return true;
  },
};
