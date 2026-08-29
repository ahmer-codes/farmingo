import type { TaskRecord, TreatmentPlanRecord } from "../models/task";

export interface TaskRepository {
  listByUser(userId: string): Promise<TaskRecord[]>;
  listAll(): Promise<TaskRecord[]>;
  listDueInRange(startDate: string, endDate: string): Promise<TaskRecord[]>;
  listByTreatmentPlanId(
    userId: string,
    treatmentPlanId: string,
  ): Promise<TaskRecord[]>;
  findByIdForUser(id: string, userId: string): Promise<TaskRecord | null>;
  create(task: TaskRecord): Promise<TaskRecord>;
  createMany(tasks: TaskRecord[]): Promise<TaskRecord[]>;
  update(
    id: string,
    userId: string,
    patch: Partial<TaskRecord>,
  ): Promise<TaskRecord | null>;
  delete(id: string, userId: string): Promise<boolean>;
  createPlan(plan: TreatmentPlanRecord): Promise<TreatmentPlanRecord>;
  findPlanByIdForUser(
    id: string,
    userId: string,
  ): Promise<TreatmentPlanRecord | null>;
  listPlansByUser(userId: string): Promise<TreatmentPlanRecord[]>;
}
