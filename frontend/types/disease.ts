export type SymptomCategory = "leaf" | "stem" | "fruit" | "general";

export interface DiseaseCrop {
  id: string;
  name: string;
  aliases?: string[];
}

export interface DiseaseSymptom {
  id: string;
  label: string;
  category: SymptomCategory;
  keywords?: string[];
}

export interface SymptomCatalog {
  categories: Array<{ id: string; label: string }>;
  symptoms: DiseaseSymptom[];
}

export interface ImageMeta {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
}

export interface AnalyzeDiseasePayload {
  cropRecordId: string;
  symptomIds: string[];
  image?: ImageMeta | null;
  imageUrl?: string;
  imagePublicId?: string;
}

export type ProblemFraming = "possible_issue" | "likely_condition";
export type SeverityLevel = "low" | "moderate" | "high" | "critical";

export interface CropContextSnapshot {
  cropRecordId: string;
  fieldId: string;
  farmId: string;
  cropName: string;
  fieldName: string;
  variety?: string;
}

export interface DiseaseAnalysisResult {
  analysisId: string;
  engine: string;
  disclaimer: string;
  catalogCropId: string;
  cropContext: CropContextSnapshot;
  assessmentId: string;
  crop: { id: string; name: string };
  possibleProblem: {
    id: string;
    name: string;
    framing: ProblemFraming;
  };
  confidencePercent: number;
  severity: SeverityLevel;
  severityLabel: string;
  summary: string;
  observedSymptoms: Array<{ id: string; label: string; category: string }>;
  recommendedActions: string[];
  prevention: string[];
  expectedRisk: string;
  reassessmentGuidance: string;
  alternatives: Array<{ id: string; name: string; confidencePercent: number }>;
  imageConsidered: boolean;
  imageUrl?: string;
  imagePublicId?: string;
}

export interface DiseaseAssessmentRecord {
  id: string;
  farmId?: string;
  fieldId?: string;
  cropRecordId?: string;
  catalogCropId?: string;
  cropName: string;
  fieldName?: string;
  variety?: string;
  symptoms: string[];
  possibleDisease: string;
  confidence: number;
  severity: string;
  recommendations: string[];
  summary?: string;
  analysisId?: string;
  imageUrl?: string;
  imagePublicId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TreatmentPlanResult {
  planId: string;
  analysisId: string;
  title: string;
  cropName: string;
  problemName: string;
  taskCount: number;
  progress: { completed: number; total: number };
  tasks: import("./task").WorkTask[];
  message: string;
}
