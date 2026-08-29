import type {
  CreateWorkTaskPayload,
  TaskListFilter,
  TaskListResponse,
  TreatmentPlan,
  UpdateWorkTaskPayload,
  WorkTask,
} from "~/types";
import type { DiseaseAnalysisResult, TreatmentPlanResult } from "~/types";
import { apiRequest } from "./apiClient";

export const taskService = {
  list(
    token: string,
    filter: TaskListFilter = "all",
  ): Promise<TaskListResponse> {
    return apiRequest<TaskListResponse>("/tasks", {
      token,
      query: { filter },
    });
  },

  get(token: string, id: string): Promise<WorkTask> {
    return apiRequest<WorkTask>(`/tasks/${id}`, { token });
  },

  create(token: string, payload: CreateWorkTaskPayload): Promise<WorkTask> {
    return apiRequest<WorkTask>("/tasks", {
      method: "POST",
      token,
      body: payload,
    });
  },

  update(
    token: string,
    id: string,
    payload: UpdateWorkTaskPayload,
  ): Promise<WorkTask> {
    return apiRequest<WorkTask>(`/tasks/${id}`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },

  complete(token: string, id: string): Promise<WorkTask> {
    return apiRequest<WorkTask>(`/tasks/${id}/complete`, {
      method: "POST",
      token,
    });
  },

  remove(token: string, id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/tasks/${id}`, {
      method: "DELETE",
      token,
    });
  },

  getPlan(token: string, planId: string): Promise<TreatmentPlan> {
    return apiRequest<TreatmentPlan>(`/tasks/plans/${planId}`, { token });
  },
};

/** Disease service still owns analyze; treatment plan creation stays on disease route. */
export type { TreatmentPlanResult, DiseaseAnalysisResult };
