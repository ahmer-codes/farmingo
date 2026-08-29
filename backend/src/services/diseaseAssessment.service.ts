import type {
  DiseaseAssessmentRecord,
  PublicDiseaseAssessment,
} from "../models/diseaseAssessment";
import { diseaseAssessmentRepository } from "../repositories";
import { ApiError } from "../utils/ApiError";
import { resolveLegacyCatalogCropId } from "../utils/catalogCropMapping";
import { resolveCropContext } from "./diseaseContext.service";
import {
  diseaseAnalysisService,
  type ImageMetaInput,
} from "./diseaseAnalysis.service";
import { notificationService } from "./notifications";

export interface AnalyzeAndPersistInput {
  cropRecordId: string;
  symptomIds: string[];
  image?: ImageMetaInput | null;
  imageUrl?: string;
  imagePublicId?: string;
}

function assertDiseaseImageOwnership(userId: string, publicId: string) {
  const prefix = `farmingo/users/${userId}/disease-assessments`;
  if (!publicId.startsWith(prefix)) {
    throw new ApiError(400, "Invalid disease image reference for this account");
  }
}

function toPublic(record: DiseaseAssessmentRecord): PublicDiseaseAssessment {
  const catalogCropId = resolveLegacyCatalogCropId(
    record.cropId,
    record.catalogCropId,
  );
  return {
    id: record.id,
    farmId: record.farmId,
    fieldId: record.fieldId,
    cropRecordId: record.cropRecordId,
    catalogCropId,
    cropName: record.cropName || "Unknown crop",
    fieldName: record.fieldName,
    variety: record.variety,
    symptoms: record.symptoms,
    possibleDisease: record.possibleDisease,
    confidence: record.confidence,
    severity: String(record.severity),
    recommendations: record.recommendations,
    summary: record.summary,
    analysisId: record.analysisId,
    imageUrl: record.imageUrl,
    imagePublicId: record.imagePublicId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export const diseaseAssessmentService = {
  async listForUser(userId: string): Promise<PublicDiseaseAssessment[]> {
    const records = await diseaseAssessmentRepository.listByOwner(userId);
    return records.map(toPublic);
  },

  async getForUser(
    userId: string,
    id: string,
  ): Promise<PublicDiseaseAssessment> {
    const record = await diseaseAssessmentRepository.findByIdForOwner(
      id,
      userId,
    );
    if (!record) throw new ApiError(404, "Assessment not found");
    return toPublic(record);
  },

  async analyzeAndPersist(userId: string, input: AnalyzeAndPersistInput) {
    if (
      (input.imageUrl && !input.imagePublicId) ||
      (!input.imageUrl && input.imagePublicId)
    ) {
      throw new ApiError(
        400,
        "imageUrl and imagePublicId must be provided together",
      );
    }

    if (input.imagePublicId) {
      assertDiseaseImageOwnership(userId, input.imagePublicId);
    }

    const context = await resolveCropContext(userId, input.cropRecordId);

    const analysis = diseaseAnalysisService.analyze(
      {
        catalogCropId: context.catalogCropId,
        symptomIds: input.symptomIds,
        image: input.image,
      },
      {
        cropRecordId: context.cropRecordId,
        fieldId: context.fieldId,
        farmId: context.farmId,
        cropName: context.cropName,
        fieldName: context.fieldName,
        variety: context.variety,
      },
    );

    const assessment = await diseaseAssessmentRepository.create({
      ownerId: userId,
      farmId: context.farmId,
      fieldId: context.fieldId,
      cropRecordId: context.cropRecordId,
      catalogCropId: context.catalogCropId,
      cropName: context.cropName,
      fieldName: context.fieldName,
      variety: context.variety,
      imageUrl: input.imageUrl,
      imagePublicId: input.imagePublicId,
      symptoms: input.symptomIds,
      possibleDisease: analysis.possibleProblem.name,
      confidence: analysis.confidencePercent,
      severity: analysis.severity,
      recommendations: analysis.recommendedActions,
      analysisId: analysis.analysisId,
      summary: analysis.summary,
    });

    const severity =
      analysis.severity === "critical" || analysis.severity === "high"
        ? "critical"
        : analysis.severity === "moderate"
          ? "warning"
          : "info";

    await notificationService.create({
      userId,
      type: "disease_alert",
      title: `Possible ${analysis.possibleProblem.name}`,
      message: `${analysis.summary} Confidence ${analysis.confidencePercent}%. ${analysis.expectedRisk}`,
      severity,
      dedupeKey: `disease_alert:${userId}:${assessment.id}`,
      relatedResource: {
        kind: "disease",
        id: assessment.id,
        label: analysis.possibleProblem.name,
      },
      action: {
        label: "View assessment",
        href: `/disease-detection/history/${assessment.id}`,
      },
    });

    return {
      ...analysis,
      assessmentId: assessment.id,
      imageUrl: input.imageUrl,
      imagePublicId: input.imagePublicId,
    };
  },
};
