import type { FarmRecord, UserRecord } from "../models/user";
import type { TaskRecord, TreatmentPlanRecord } from "../models/task";
import type { NotificationRecord } from "../models/notification";
import type { CropRecord, FieldRecord, YieldRecord } from "../models/crop";

/**
 * In-memory development store.
 * Swap repository implementations for PostgreSQL/MongoDB later
 * without changing service or controller contracts.
 */
class MemoryStore {
  users: UserRecord[] = [];
  farms: FarmRecord[] = [];
  tasks: TaskRecord[] = [];
  treatmentPlans: TreatmentPlanRecord[] = [];
  notifications: NotificationRecord[] = [];
  fields: FieldRecord[] = [];
  crops: CropRecord[] = [];
  yields: YieldRecord[] = [];
  seeded = false;
}

export const memoryStore = new MemoryStore();
