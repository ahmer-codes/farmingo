import { DISEASE_CROPS } from "../data/crops";
import { DISEASE_RULES, type SeverityLevel } from "../data/diseaseRules";
import { SYMPTOM_CATALOG, SYMPTOM_CATEGORY_LABELS } from "../data/symptoms";
import { ApiError } from "../utils/ApiError";

export interface ImageMetaInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
}

export interface AnalyzeDiseaseInput {
  catalogCropId: string;
  symptomIds: string[];
  image?: ImageMetaInput | null;
}

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
  engine: "mock-rules-v1";
  disclaimer: string;
  catalogCropId: string;
  cropContext: CropContextSnapshot;
  assessmentId?: string;
  crop: {
    id: string;
    name: string;
  };
  possibleProblem: {
    id: string;
    name: string;
    framing: "possible_issue" | "likely_condition";
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

const SEVERITY_LABEL: Record<SeverityLevel, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  critical: "Critical",
};

const DISCLAIMER =
  "This AI-assisted assessment is educational decision support, not a definitive diagnosis. For severe or spreading crop problems, verify findings with a qualified agricultural professional or local extension service.";

function scoreRule(
  rule: (typeof DISEASE_RULES)[number],
  symptomIds: string[],
  cropId: string,
) {
  if (!rule.cropIds.includes(cropId)) return 0;

  let score = 0;
  let matchedWeight = 0;
  for (const symptomId of symptomIds) {
    const weight = rule.symptomWeights[symptomId];
    if (weight) {
      score += weight;
      matchedWeight += weight;
    }
  }

  // Soft bonus when several supporting symptoms are present
  const matchedCount = symptomIds.filter(
    (id) => rule.symptomWeights[id],
  ).length;
  if (matchedCount >= 3) score += 1.5;
  if (matchedCount >= 5) score += 1;

  // Prefer rules that actually matched something
  if (matchedWeight === 0) return 0;
  return score;
}

function confidenceFromScore(score: number, symptomCount: number): number {
  // Deterministic mapping into a readable % band
  const base = Math.min(92, 48 + score * 7 + Math.min(symptomCount, 4) * 2);
  return Math.round(Math.max(35, Math.min(92, base)));
}

function framingForConfidence(
  confidence: number,
): "possible_issue" | "likely_condition" {
  return confidence >= 75 ? "likely_condition" : "possible_issue";
}

export const diseaseAnalysisService = {
  listCrops() {
    return DISEASE_CROPS;
  },

  listSymptoms() {
    return {
      categories: Object.entries(SYMPTOM_CATEGORY_LABELS).map(
        ([id, label]) => ({
          id,
          label,
        }),
      ),
      symptoms: SYMPTOM_CATALOG,
    };
  },

  analyze(
    input: AnalyzeDiseaseInput,
    cropContext: CropContextSnapshot,
  ): DiseaseAnalysisResult {
    const crop = DISEASE_CROPS.find((c) => c.id === input.catalogCropId);
    if (!crop) throw new ApiError(400, "Unknown crop catalog entry");

    const uniqueSymptoms = [...new Set(input.symptomIds)];
    if (!uniqueSymptoms.length) {
      throw new ApiError(400, "Select at least one symptom");
    }

    const invalid = uniqueSymptoms.filter(
      (id) => !SYMPTOM_CATALOG.some((s) => s.id === id),
    );
    if (invalid.length) {
      throw new ApiError(400, `Unknown symptoms: ${invalid.join(", ")}`);
    }

    // Optional image metadata nudges confidence slightly (still mock / deterministic)
    let imageBoost = 0;
    let imageConsidered = false;
    if (input.image?.mimeType?.startsWith("image/")) {
      imageConsidered = true;
      if ((input.image.width || 0) >= 400 && (input.image.height || 0) >= 400) {
        imageBoost = 2;
      } else {
        imageBoost = 1;
      }
    }

    const ranked = DISEASE_RULES.map((rule) => ({
      rule,
      score: scoreRule(rule, uniqueSymptoms, crop.id),
    }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score);

    const top = ranked[0];
    const fallback = DISEASE_RULES.find(
      (r) => r.id === "generic-nutrient-stress",
    )!;

    const chosen = top?.rule || fallback;
    const rawScore = (top?.score || 2) + imageBoost;
    const confidencePercent = confidenceFromScore(
      rawScore,
      uniqueSymptoms.length,
    );
    const framing = framingForConfidence(confidencePercent);

    const observedSymptoms = uniqueSymptoms.map((id) => {
      const symptom = SYMPTOM_CATALOG.find((s) => s.id === id)!;
      return {
        id: symptom.id,
        label: symptom.label,
        category: SYMPTOM_CATEGORY_LABELS[symptom.category],
      };
    });

    const alternatives = ranked.slice(1, 3).map((row) => ({
      id: row.rule.id,
      name: row.rule.name,
      confidencePercent: confidenceFromScore(
        row.score + imageBoost * 0.5,
        uniqueSymptoms.length,
      ),
    }));

    return {
      analysisId: `ana_${crop.id}_${uniqueSymptoms.slice().sort().join("-").slice(0, 48)}_${confidencePercent}`,
      engine: "mock-rules-v1",
      disclaimer: DISCLAIMER,
      catalogCropId: crop.id,
      cropContext,
      crop: { id: crop.id, name: crop.name },
      possibleProblem: {
        id: chosen.id,
        name: chosen.name,
        framing,
      },
      confidencePercent,
      severity: chosen.severity,
      severityLabel: SEVERITY_LABEL[chosen.severity],
      summary: chosen.summary,
      observedSymptoms,
      recommendedActions: chosen.recommendedActions,
      prevention: chosen.prevention,
      expectedRisk: chosen.expectedRisk,
      reassessmentGuidance: chosen.reassessmentGuidance,
      alternatives,
      imageConsidered,
    };
  },
};
