import type {
  AnalyzeDiseasePayload,
  DiseaseAnalysisResult,
  DiseaseAssessmentRecord,
  DiseaseCrop,
  SymptomCatalog,
  TreatmentPlanResult,
} from "~/types";
import { apiRequest } from "./apiClient";

export const diseaseService = {
  listCrops(token: string): Promise<DiseaseCrop[]> {
    return apiRequest<DiseaseCrop[]>("/disease/crops", { token });
  },

  listSymptoms(token: string): Promise<SymptomCatalog> {
    return apiRequest<SymptomCatalog>("/disease/symptoms", { token });
  },

  listAssessments(token: string): Promise<DiseaseAssessmentRecord[]> {
    return apiRequest<DiseaseAssessmentRecord[]>("/disease/assessments", {
      token,
    });
  },

  getAssessment(token: string, id: string): Promise<DiseaseAssessmentRecord> {
    return apiRequest<DiseaseAssessmentRecord>(`/disease/assessments/${id}`, {
      token,
    });
  },

  analyze(
    token: string,
    payload: AnalyzeDiseasePayload,
  ): Promise<DiseaseAnalysisResult> {
    return apiRequest<DiseaseAnalysisResult>("/disease/analyze", {
      method: "POST",
      token,
      body: payload,
    });
  },

  createTreatmentPlan(
    token: string,
    assessmentId: string,
  ): Promise<TreatmentPlanResult> {
    return apiRequest<TreatmentPlanResult>("/disease/treatment-plan", {
      method: "POST",
      token,
      body: { assessmentId },
    });
  },
};
