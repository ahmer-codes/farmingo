import type { FarmRecord } from "../models/user";
import type { FarmRepository } from "./types";
import { memoryStore } from "./memoryStore";

export const memoryFarmRepository: FarmRepository = {
  async findByOwnerId(ownerId) {
    return memoryStore.farms.find((f) => f.ownerId === ownerId) || null;
  },

  async create(farm) {
    memoryStore.farms.push(farm);
    return farm;
  },

  async update(id, patch) {
    const index = memoryStore.farms.findIndex((f) => f.id === id);
    if (index < 0) return null;
    const current = memoryStore.farms[index]!;
    const next: FarmRecord = {
      ...current,
      ...patch,
      id: current.id,
      ownerId: current.ownerId,
      updatedAt: new Date().toISOString(),
    };
    memoryStore.farms[index] = next;
    return next;
  },

  async updateByOwnerId(ownerId, patch) {
    const farm = await this.findByOwnerId(ownerId);
    if (!farm) return null;
    return this.update(farm.id, patch);
  },
};
