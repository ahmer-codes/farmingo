export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "overdue"
  | "skipped";
export type TaskSource =
  | "disease_treatment"
  | "weather_precaution"
  | "farmer_created"
  | "seasonal_recommendation";

export interface TaskRecord {
  id: string;
  userId: string;
  farmId?: string;
  fieldId?: string;
  cropRecordId?: string;
  title: string;
  description: string;
  crop: string;
  field: string;
  priority: TaskPriority;
  dueDate: string;
  dueTime: string;
  estimatedDurationMinutes: number;
  status: TaskStatus;
  source: TaskSource;
  reason?: string;
  instructions?: string;
  relatedDisease?: string;
  reminderTime?: string;
  treatmentPlanId?: string;
  dayOffset?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface TreatmentPlanRecord {
  id: string;
  userId: string;
  analysisId: string;
  title: string;
  cropName: string;
  fieldName?: string;
  problemName: string;
  taskIds: string[];
  farmId?: string;
  fieldId?: string;
  cropRecordId?: string;
  diseaseAssessmentId?: string;
  createdAt: string;
}

export interface PublicTask {
  id: string;
  title: string;
  description: string;
  crop: string;
  field: string;
  priority: TaskPriority;
  dueDate: string;
  dueTime: string;
  estimatedDurationMinutes: number;
  status: TaskStatus;
  source: TaskSource;
  reason?: string;
  instructions?: string;
  relatedDisease?: string;
  reminderTime?: string;
  treatmentPlanId?: string;
  dayOffset?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface PublicTreatmentPlan {
  id: string;
  analysisId: string;
  title: string;
  cropName: string;
  problemName: string;
  createdAt: string;
  progress: {
    completed: number;
    total: number;
  };
  tasks: PublicTask[];
}
