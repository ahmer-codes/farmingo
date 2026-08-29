import type { CropRecord } from "../models/crop";
import type { CropRepository } from "./crop.types";
import { memoryStore } from "./memoryStore";

export const memoryCropRepository: CropRepository = {
  async listByUser(userId) {
    return memoryStore.crops.filter((c) => c.userId === userId);
  },

  async findByIdForUser(id, userId) {
    return (
      memoryStore.crops.find((c) => c.id === id && c.userId === userId) || null
    );
  },

  async findByFieldId(fieldId, userId) {
    return memoryStore.crops.filter(
      (c) => c.fieldId === fieldId && c.userId === userId,
    );
  },

  async create(crop) {
    memoryStore.crops.push(crop);
    return crop;
  },

  async createMany(crops) {
    memoryStore.crops.push(...crops);
    return crops;
  },

  async update(id, userId, patch) {
    const index = memoryStore.crops.findIndex(
      (c) => c.id === id && c.userId === userId,
    );
    if (index < 0) return null;
    const current = memoryStore.crops[index]!;
    const next: CropRecord = {
      ...current,
      ...patch,
      id: current.id,
      userId: current.userId,
      farmId: current.farmId,
      updatedAt: new Date().toISOString(),
    };
    memoryStore.crops[index] = next;
    return next;
  },

  async delete(id, userId) {
    const index = memoryStore.crops.findIndex(
      (c) => c.id === id && c.userId === userId,
    );
    if (index < 0) return false;
    memoryStore.crops.splice(index, 1);
    return true;
  },
};
