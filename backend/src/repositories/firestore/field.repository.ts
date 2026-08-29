import type { FieldRecord } from "../../models/crop";
import type { FieldRepository } from "../crop.types";
import { db } from "../../config/firebase-admin";
import {
  COLLECTIONS,
  docToRecord,
  nowIso,
  stripUndefined,
} from "../../utils/firestore";

const col = () => db.collection(COLLECTIONS.fields);

export const firestoreFieldRepository: FieldRepository = {
  async listByUser(userId) {
    const qs = await col().where("userId", "==", userId).get();
    return qs.docs.map((d) => docToRecord<FieldRecord>(d));
  },

  async findByIdForUser(id, userId) {
    const snap = await col().doc(id).get();
    if (!snap.exists) return null;
    const record = docToRecord<FieldRecord>(snap);
    return record.userId === userId ? record : null;
  },

  async create(field) {
    const { id, ...rest } = field;
    await col().doc(id).set(stripUndefined(rest));
    return field;
  },

  async createMany(fields) {
    const batch = db.batch();
    for (const field of fields) {
      const { id, ...rest } = field;
      batch.set(col().doc(id), stripUndefined(rest));
    }
    await batch.commit();
    return fields;
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
