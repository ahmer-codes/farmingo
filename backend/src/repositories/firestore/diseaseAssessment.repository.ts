import type {
  CreateDiseaseAssessmentInput,
  DiseaseAssessmentRecord,
} from "../../models/diseaseAssessment";
import { db } from "../../config/firebase-admin";
import {
  COLLECTIONS,
  docToRecord,
  nowIso,
  stripUndefined,
} from "../../utils/firestore";
import { randomUUID } from "crypto";

export interface DiseaseAssessmentRepository {
  create(input: CreateDiseaseAssessmentInput): Promise<DiseaseAssessmentRecord>;
  findByIdForOwner(
    id: string,
    ownerId: string,
  ): Promise<DiseaseAssessmentRecord | null>;
  listByOwner(ownerId: string): Promise<DiseaseAssessmentRecord[]>;
  countByCropRecordId(ownerId: string, cropRecordId: string): Promise<number>;
}

const col = () => db.collection(COLLECTIONS.diseaseAssessments);

export const diseaseAssessmentRepository: DiseaseAssessmentRepository = {
  async create(input) {
    const id = randomUUID();
    const record: DiseaseAssessmentRecord = {
      id,
      ...input,
      createdAt: nowIso(),
    };
    const { id: docId, ...rest } = record;
    await col().doc(docId).set(stripUndefined(rest));
    return record;
  },

  async findByIdForOwner(id, ownerId) {
    const snap = await col().doc(id).get();
    if (!snap.exists) return null;
    const record = docToRecord<DiseaseAssessmentRecord>(snap);
    return record.ownerId === ownerId ? record : null;
  },

  async listByOwner(ownerId) {
    const qs = await col().where("ownerId", "==", ownerId).get();
    return qs.docs
      .map((d) => docToRecord<DiseaseAssessmentRecord>(d))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async countByCropRecordId(ownerId, cropRecordId) {
    const qs = await col()
      .where("ownerId", "==", ownerId)
      .where("cropRecordId", "==", cropRecordId)
      .limit(1)
      .get();
    return qs.size;
  },
};
