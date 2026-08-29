import type { UserRecord } from "../models/user";
import type { UserRepository } from "./types";
import { memoryStore } from "./memoryStore";

export const memoryUserRepository: UserRepository = {
  async findById(id) {
    return memoryStore.users.find((u) => u.id === id) || null;
  },

  async findByEmail(email) {
    const normalized = email.toLowerCase();
    return memoryStore.users.find((u) => u.email === normalized) || null;
  },

  async listAll() {
    return memoryStore.users.slice();
  },

  async create(user) {
    memoryStore.users.push(user);
    return user;
  },

  async update(id, patch) {
    const index = memoryStore.users.findIndex((u) => u.id === id);
    if (index < 0) return null;
    const current = memoryStore.users[index]!;
    const next: UserRecord = {
      ...current,
      ...patch,
      id: current.id,
      email: patch.email ? patch.email.toLowerCase() : current.email,
      fullNameLower: patch.fullName
        ? patch.fullName.toLowerCase().trim()
        : current.fullNameLower,
      updatedAt: new Date().toISOString(),
    };
    if ("disabledAt" in patch && patch.disabledAt === undefined) {
      delete next.disabledAt;
    }
    memoryStore.users[index] = next;
    return next;
  },

  async updateFields(id, patch) {
    const index = memoryStore.users.findIndex((u) => u.id === id);
    if (index < 0) return null;
    const current = memoryStore.users[index]!;
    const next: UserRecord = {
      ...current,
      ...(patch as Partial<UserRecord>),
      id: current.id,
      updatedAt: new Date().toISOString(),
    };
    memoryStore.users[index] = next;
    return next;
  },
};
