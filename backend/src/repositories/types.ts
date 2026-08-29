import type { FarmRecord, UserRecord } from "../models/user";
import type { DocumentData } from "firebase-admin/firestore";

export interface UserRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  listAll(): Promise<UserRecord[]>;
  create(user: UserRecord): Promise<UserRecord>;
  update(id: string, patch: Partial<UserRecord>): Promise<UserRecord | null>;
  updateFields(id: string, patch: DocumentData): Promise<UserRecord | null>;
}

export interface FarmRepository {
  findByOwnerId(ownerId: string): Promise<FarmRecord | null>;
  create(farm: FarmRecord): Promise<FarmRecord>;
  update(id: string, patch: Partial<FarmRecord>): Promise<FarmRecord | null>;
  updateByOwnerId(
    ownerId: string,
    patch: Partial<FarmRecord>,
  ): Promise<FarmRecord | null>;
}
