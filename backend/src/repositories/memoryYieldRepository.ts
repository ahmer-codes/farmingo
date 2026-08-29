import type { YieldRecord } from "../models/crop";
import type { YieldRepository } from "./crop.types";
import { memoryStore } from "./memoryStore";

export const memoryYieldRepository: YieldRepository = {
  async listByUser(userId) {
    return memoryStore.yields.filter((y) => y.userId === userId);
  },

  async countByCropId(userId, cropId) {
    return memoryStore.yields.filter(
      (y) => y.userId === userId && y.cropId === cropId,
    ).length;
  },

  async findByIdForUser(id, userId) {
    return (
      memoryStore.yields.find((y) => y.id === id && y.userId === userId) || null
    );
  },

  async create(record) {
    memoryStore.yields.push(record);
    return record;
  },

  async createMany(records) {
    memoryStore.yields.push(...records);
    return records;
  },

  async update(id, userId, patch) {
    const index = memoryStore.yields.findIndex(
      (y) => y.id === id && y.userId === userId,
    );
    if (index < 0) return null;
    const current = memoryStore.yields[index]!;
    const next: YieldRecord = {
      ...current,
      ...patch,
      id: current.id,
      userId: current.userId,
      farmId: current.farmId,
      updatedAt: new Date().toISOString(),
    };
    memoryStore.yields[index] = next;
    return next;
  },

  async delete(id, userId) {
    const index = memoryStore.yields.findIndex(
      (y) => y.id === id && y.userId === userId,
    );
    if (index < 0) return false;
    memoryStore.yields.splice(index, 1);
    return true;
  },
};
