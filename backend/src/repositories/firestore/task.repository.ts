import type { TaskRecord, TreatmentPlanRecord } from "../../models/task";
import type { TaskRepository } from "../task.types";
import { db } from "../../config/firebase-admin";
import {
  COLLECTIONS,
  docToRecord,
  nowIso,
  stripUndefined,
} from "../../utils/firestore";

const tasksCol = () => db.collection(COLLECTIONS.tasks);
const plansCol = () => db.collection(COLLECTIONS.treatmentPlans);

export const firestoreTaskRepository: TaskRepository = {
  async listByUser(userId) {
    const qs = await tasksCol().where("userId", "==", userId).get();
    return qs.docs.map((d) => docToRecord<TaskRecord>(d));
  },

  async listAll() {
    const qs = await tasksCol().get();
    return qs.docs.map((d) => docToRecord<TaskRecord>(d));
  },

  async listDueInRange(startDate, endDate) {
    const qs = await tasksCol()
      .where("dueDate", ">=", startDate)
      .where("dueDate", "<=", endDate)
      .get();
    return qs.docs.map((d) => docToRecord<TaskRecord>(d));
  },

  async listByTreatmentPlanId(userId, treatmentPlanId) {
    const qs = await tasksCol()
      .where("userId", "==", userId)
      .where("treatmentPlanId", "==", treatmentPlanId)
      .get();
    return qs.docs.map((d) => docToRecord<TaskRecord>(d));
  },

  async findByIdForUser(id, userId) {
    const snap = await tasksCol().doc(id).get();
    if (!snap.exists) return null;
    const record = docToRecord<TaskRecord>(snap);
    return record.userId === userId ? record : null;
  },

  async create(task) {
    const { id, ...rest } = task;
    await tasksCol().doc(id).set(stripUndefined(rest));
    return task;
  },

  async createMany(tasks) {
    const batch = db.batch();
    for (const task of tasks) {
      const { id, ...rest } = task;
      batch.set(tasksCol().doc(id), stripUndefined(rest));
    }
    await batch.commit();
    return tasks;
  },

  async update(id, userId, patch) {
    const existing = await this.findByIdForUser(id, userId);
    if (!existing) return null;
    await tasksCol()
      .doc(id)
      .update(stripUndefined({ ...patch, updatedAt: nowIso() }));
    return this.findByIdForUser(id, userId);
  },

  async delete(id, userId) {
    const existing = await this.findByIdForUser(id, userId);
    if (!existing) return false;
    await tasksCol().doc(id).delete();
    return true;
  },

  async createPlan(plan) {
    const { id, ...rest } = plan;
    await plansCol().doc(id).set(stripUndefined(rest));
    return plan;
  },

  async findPlanByIdForUser(id, userId) {
    const snap = await plansCol().doc(id).get();
    if (!snap.exists) return null;
    const record = docToRecord<TreatmentPlanRecord>(snap);
    return record.userId === userId ? record : null;
  },

  async listPlansByUser(userId) {
    const qs = await plansCol().where("userId", "==", userId).get();
    return qs.docs.map((d) => docToRecord<TreatmentPlanRecord>(d));
  },
};
