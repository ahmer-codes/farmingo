import type { FarmRepository, UserRepository } from "./types";
import { firestoreFarmRepository } from "./firestore/farm.repository";
import { firestoreUserRepository } from "./firestore/user.repository";
import { firestoreTaskRepository } from "./firestore/task.repository";
import { firestoreNotificationRepository } from "./firestore/notification.repository";
import { firestoreFieldRepository } from "./firestore/field.repository";
import { firestoreCropRepository } from "./firestore/crop.repository";
import { firestoreYieldRepository } from "./firestore/yield.repository";
import type { TaskRepository } from "./task.types";
import type { NotificationRepository } from "./notification.types";
import type {
  CropRepository,
  FieldRepository,
  YieldRepository,
} from "./crop.types";

export { diseaseAssessmentRepository } from "./firestore/diseaseAssessment.repository";

/** Firestore-backed repositories (production data source). */
export const userRepository: UserRepository = firestoreUserRepository;
export const farmRepository: FarmRepository = firestoreFarmRepository;
export const taskRepository: TaskRepository = firestoreTaskRepository;
export const notificationRepository: NotificationRepository =
  firestoreNotificationRepository;
export const fieldRepository: FieldRepository = firestoreFieldRepository;
export const cropRepository: CropRepository = firestoreCropRepository;
export const yieldRepository: YieldRepository = firestoreYieldRepository;
