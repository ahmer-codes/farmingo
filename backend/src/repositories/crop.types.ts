import type { FieldRecord, CropRecord, YieldRecord } from "../models/crop";

export interface FieldRepository {
  listByUser(userId: string): Promise<FieldRecord[]>;
  findByIdForUser(id: string, userId: string): Promise<FieldRecord | null>;
  create(field: FieldRecord): Promise<FieldRecord>;
  createMany(fields: FieldRecord[]): Promise<FieldRecord[]>;
  update(
    id: string,
    userId: string,
    patch: Partial<FieldRecord>,
  ): Promise<FieldRecord | null>;
  delete(id: string, userId: string): Promise<boolean>;
}

export interface CropRepository {
  listByUser(userId: string): Promise<CropRecord[]>;
  findByIdForUser(id: string, userId: string): Promise<CropRecord | null>;
  findByFieldId(fieldId: string, userId: string): Promise<CropRecord[]>;
  create(crop: CropRecord): Promise<CropRecord>;
  createMany(crops: CropRecord[]): Promise<CropRecord[]>;
  update(
    id: string,
    userId: string,
    patch: Partial<CropRecord>,
  ): Promise<CropRecord | null>;
  delete(id: string, userId: string): Promise<boolean>;
}

export interface YieldRepository {
  listByUser(userId: string): Promise<YieldRecord[]>;
  countByCropId(userId: string, cropId: string): Promise<number>;
  findByIdForUser(id: string, userId: string): Promise<YieldRecord | null>;
  create(record: YieldRecord): Promise<YieldRecord>;
  createMany(records: YieldRecord[]): Promise<YieldRecord[]>;
  update(
    id: string,
    userId: string,
    patch: Partial<YieldRecord>,
  ): Promise<YieldRecord | null>;
  delete(id: string, userId: string): Promise<boolean>;
}
