import type { CropRecord } from "../../models/crop";
import type { CropRepository } from "../crop.types";
import { db } from "../../config/firebase-admin";
import {
  COLLECTIONS,
  docToRecord,
  nowIso,
  stripUndefined,
} from "../../utils/firestore";

const col = () => db.collection(COLLECTIONS.crops);

export const firestoreCropRepository: CropRepository = {
  async listByUser(userId) {
    const qs = await col().where("userId", "==", userId).get();
    return qs.docs.map((d) => docToRecord<CropRecord>(d));
  },

  async findByIdForUser(id, userId) {
    const snap = await col().doc(id).get();
    if (!snap.exists) return null;
    const record = docToRecord<CropRecord>(snap);
    return record.userId === userId ? record : null;
  },

  async findByFieldId(fieldId, userId) {
    const qs = await col()
      .where("fieldId", "==", fieldId)
      .where("userId", "==", userId)
      .get();
    return qs.docs.map((d) => docToRecord<CropRecord>(d));
  },

  async create(crop) {
    const { id, ...rest } = crop;
    await col().doc(id).set(stripUndefined(rest));
    return crop;
  },

  async createMany(crops) {
    const batch = db.batch();
    for (const crop of crops) {
      const { id, ...rest } = crop;
      batch.set(col().doc(id), stripUndefined(rest));
    }
    await batch.commit();
    return crops;
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
