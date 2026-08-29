import type { SeverityLevel } from "../data/diseaseRules";

export interface DiseaseAssessmentRecord {
  id: string;
  ownerId: string;
  /** @deprecated Legacy catalog slug, use catalogCropId on new records */
  cropId?: string;
  farmId?: string;
  fieldId?: string;
  cropRecordId?: string;
  catalogCropId?: string;
  cropName?: string;
  fieldName?: string;
  variety?: string;
  imageUrl?: string;
  imagePublicId?: string;
  symptoms: string[];
  possibleDisease: string;
  confidence: number;
  severity: SeverityLevel | string;
  recommendations: string[];
  analysisId?: string;
  summary?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateDiseaseAssessmentInput {
  ownerId: string;
  farmId: string;
  fieldId: string;
  cropRecordId: string;
  catalogCropId: string;
  cropName: string;
  fieldName: string;
  variety?: string;
  imageUrl?: string;
  imagePublicId?: string;
  symptoms: string[];
  possibleDisease: string;
  confidence: number;
  severity: SeverityLevel | string;
  recommendations: string[];
  analysisId?: string;
  summary?: string;
}

export interface PublicDiseaseAssessment {
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
