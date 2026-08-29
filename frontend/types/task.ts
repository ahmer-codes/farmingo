export type WorkTaskPriority = "low" | "medium" | "high";
export type WorkTaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "overdue"
  | "skipped";
export type WorkTaskSource =
  | "disease_treatment"
  | "weather_precaution"
  | "farmer_created"
  | "seasonal_recommendation";

export type TaskListFilter =
  | "all"
  | "today"
  | "upcoming"
  | "completed"
  | "overdue"
  | "disease_treatment"
  | "weather_precaution"
  | "farmer_created"
  | "seasonal_recommendation";

export interface WorkTask {
  id: string;
  title: string;
  description: string;
  crop: string;
  field: string;
  priority: WorkTaskPriority;
  dueDate: string;
  dueTime: string;
  estimatedDurationMinutes: number;
  status: WorkTaskStatus;
  source: WorkTaskSource;
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

export interface TaskListResponse {
  tasks: WorkTask[];
  summary: {
    today: number;
    upcoming: number;
    overdue: number;
    completed: number;
  };
}

export interface CreateWorkTaskPayload {
  title: string;
  description: string;
  crop: string;
  field?: string;
  priority: WorkTaskPriority;
  dueDate: string;
  dueTime?: string;
  estimatedDurationMinutes?: number;
  source?: WorkTaskSource;
  reason?: string;
  instructions?: string;
  relatedDisease?: string;
  reminderTime?: string;
}

export interface UpdateWorkTaskPayload {
  title?: string;
  description?: string;
  crop?: string;
  field?: string;
  priority?: WorkTaskPriority;
  dueDate?: string;
  dueTime?: string;
  estimatedDurationMinutes?: number;
  status?: Exclude<WorkTaskStatus, "overdue">;
  reason?: string;
  instructions?: string;
  relatedDisease?: string;
  reminderTime?: string;
}

export interface TreatmentPlan {
  id: string;
  analysisId: string;
  title: string;
  cropName: string;
  problemName: string;
  createdAt: string;
  progress: { completed: number; total: number };
  tasks: WorkTask[];
}

export const TASK_SOURCE_LABELS: Record<WorkTaskSource, string> = {
  disease_treatment: "Disease treatment",
  weather_precaution: "Weather precaution",
  farmer_created: "Farmer-created",
  seasonal_recommendation: "Seasonal recommendation",
};

export const TASK_STATUS_LABELS: Record<WorkTaskStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
  skipped: "Skipped",
};
