import type { FarmRecord } from "../../models/user";
import type { FarmRepository } from "../types";
import { db } from "../../config/firebase-admin";
import {
  COLLECTIONS,
  docToRecord,
  nowIso,
  stripUndefined,
} from "../../utils/firestore";

const col = () => db.collection(COLLECTIONS.farms);

export const firestoreFarmRepository: FarmRepository = {
  async findByOwnerId(ownerId) {
    const qs = await col().where("ownerId", "==", ownerId).limit(1).get();
    if (qs.empty) return null;
    return docToRecord<FarmRecord>(qs.docs[0]!);
  },

  async create(farm) {
    const { id, ...rest } = farm;
    await col().doc(id).set(stripUndefined(rest));
    return farm;
  },

  async update(id, patch) {
    const ref = col().doc(id);
    const existing = await ref.get();
    if (!existing.exists) return null;
    const current = docToRecord<FarmRecord>(existing);
    await ref.update(
      stripUndefined({
        ...patch,
        updatedAt: nowIso(),
      }),
    );
    const updated = await ref.get();
    const next = docToRecord<FarmRecord>(updated);
    return { ...next, id: current.id, ownerId: current.ownerId };
  },

  async updateByOwnerId(ownerId, patch) {
    const farm = await this.findByOwnerId(ownerId);
    if (!farm) return null;
    return this.update(farm.id, patch);
  },
};
