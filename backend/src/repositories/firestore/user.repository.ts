import type { UserRecord } from "../../models/user";
import type { UserRepository } from "../types";
import { db } from "../../config/firebase-admin";
import {
  COLLECTIONS,
  docToRecord,
  nowIso,
  stripUndefined,
} from "../../utils/firestore";

const col = () => db.collection(COLLECTIONS.users);

function normalizeUserPayload(
  user: Partial<UserRecord> & { fullName?: string; email?: string },
) {
  const payload: Record<string, unknown> = { ...user };
  if (user.email) payload.email = user.email.toLowerCase();
  if (user.fullName) payload.fullNameLower = user.fullName.toLowerCase().trim();
  return payload;
}

export const firestoreUserRepository: UserRepository = {
  async findById(id) {
    const snap = await col().doc(id).get();
    if (!snap.exists) return null;
    return docToRecord<UserRecord>(snap);
  },

  async findByEmail(email) {
    const normalized = email.toLowerCase();
    const qs = await col().where("email", "==", normalized).limit(1).get();
    if (qs.empty) return null;
    return docToRecord<UserRecord>(qs.docs[0]!);
  },

  async listAll() {
    const qs = await col().get();
    return qs.docs.map((d) => docToRecord<UserRecord>(d));
  },

  async create(user) {
    const { id, ...rest } = user;
    await col()
      .doc(id)
      .set(
        stripUndefined(
          normalizeUserPayload({
            ...rest,
            email: user.email.toLowerCase(),
            status: user.status || "active",
          }),
        ),
      );
    return user;
  },

  async update(id, patch) {
    const ref = col().doc(id);
    const existing = await ref.get();
    if (!existing.exists) return null;
    const payload = stripUndefined({
      ...normalizeUserPayload(patch),
      updatedAt: nowIso(),
    });
    await ref.update(payload);
    const updated = await ref.get();
    return docToRecord<UserRecord>(updated);
  },

  async updateFields(id, patch) {
    const ref = col().doc(id);
    const existing = await ref.get();
    if (!existing.exists) return null;
    await ref.update({ ...patch, updatedAt: nowIso() });
    const updated = await ref.get();
    return docToRecord<UserRecord>(updated);
  },
};
