/**
 * Foundation for future proactive farm recommendations.
 * Combines weather, crop stage, field context, disease signals, and tasks
 * to generate notification payloads, no fake AI or mock recommendations.
 */
import type { CreateNotificationInput } from "../../models/notification";

export interface ProactiveContext {
  userId: string;
  farmId?: string;
  fieldId?: string;
  cropRecordId?: string;
  cropName?: string;
  growthStage?: string;
  weatherSummary?: string;
  humidity?: number;
  rainHoursAhead?: number;
}

export interface ProactiveRecommendationDraft {
  notification: Omit<CreateNotificationInput, "userId">;
  rationale: string[];
  linkedAssessmentId?: string;
}

export const proactiveRecommendationService = {
  /**
   * Placeholder for rules-engine driven recommendations.
   * Implement when weather + crop stage rules are defined.
   */
  async evaluate(
    _context: ProactiveContext,
  ): Promise<ProactiveRecommendationDraft[]> {
    return [];
  },
};
