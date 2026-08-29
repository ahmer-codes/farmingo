import type { FieldRecord } from "../models/crop";
import type { FieldRepository } from "./crop.types";
import { memoryStore } from "./memoryStore";

export const memoryFieldRepository: FieldRepository = {
  async listByUser(userId) {
    return memoryStore.fields.filter((f) => f.userId === userId);
  },

  async findByIdForUser(id, userId) {
    return (
      memoryStore.fields.find((f) => f.id === id && f.userId === userId) || null
    );
  },

  async create(field) {
    memoryStore.fields.push(field);
    return field;
  },

  async createMany(fields) {
    memoryStore.fields.push(...fields);
    return fields;
  },

  async update(id, userId, patch) {
    const index = memoryStore.fields.findIndex(
      (f) => f.id === id && f.userId === userId,
    );
    if (index < 0) return null;
    const current = memoryStore.fields[index]!;
    const next: FieldRecord = {
      ...current,
      ...patch,
      id: current.id,
      userId: current.userId,
      farmId: current.farmId,
      updatedAt: new Date().toISOString(),
    };
    memoryStore.fields[index] = next;
    return next;
  },

  async delete(id, userId) {
    const index = memoryStore.fields.findIndex(
      (f) => f.id === id && f.userId === userId,
    );
    if (index < 0) return false;
    memoryStore.fields.splice(index, 1);
    return true;
  },
};
