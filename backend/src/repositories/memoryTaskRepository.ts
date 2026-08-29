import type { TaskRecord, TreatmentPlanRecord } from "../models/task";
import type { TaskRepository } from "./task.types";
import { memoryStore } from "./memoryStore";

export const memoryTaskRepository: TaskRepository = {
  async listByUser(userId) {
    return memoryStore.tasks.filter((t) => t.userId === userId);
  },

  async listAll() {
    return memoryStore.tasks.slice();
  },

  async listDueInRange(startDate, endDate) {
    return memoryStore.tasks.filter(
      (t) => t.dueDate >= startDate && t.dueDate <= endDate,
    );
  },

  async listByTreatmentPlanId(userId, treatmentPlanId) {
    return memoryStore.tasks.filter(
      (t) => t.userId === userId && t.treatmentPlanId === treatmentPlanId,
    );
  },

  async findByIdForUser(id, userId) {
    return (
      memoryStore.tasks.find((t) => t.id === id && t.userId === userId) || null
    );
  },

  async create(task) {
    memoryStore.tasks.push(task);
    return task;
  },

  async createMany(tasks) {
    memoryStore.tasks.push(...tasks);
    return tasks;
  },

  async update(id, userId, patch) {
    const index = memoryStore.tasks.findIndex(
      (t) => t.id === id && t.userId === userId,
    );
    if (index < 0) return null;
    const current = memoryStore.tasks[index]!;
    const next: TaskRecord = {
      ...current,
      ...patch,
      id: current.id,
      userId: current.userId,
      updatedAt: new Date().toISOString(),
    };
    memoryStore.tasks[index] = next;
    return next;
  },

  async delete(id, userId) {
    const index = memoryStore.tasks.findIndex(
      (t) => t.id === id && t.userId === userId,
    );
    if (index < 0) return false;
    memoryStore.tasks.splice(index, 1);
    return true;
  },

  async createPlan(plan) {
    memoryStore.treatmentPlans.push(plan);
    return plan;
  },

  async findPlanByIdForUser(id, userId) {
    return (
      memoryStore.treatmentPlans.find(
        (p) => p.id === id && p.userId === userId,
      ) || null
    );
  },

  async listPlansByUser(userId) {
    return memoryStore.treatmentPlans.filter((p) => p.userId === userId);
  },
};
