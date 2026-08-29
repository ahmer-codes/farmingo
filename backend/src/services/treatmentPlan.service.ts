import { randomUUID } from "crypto";
import type { TaskRecord, TreatmentPlanRecord } from "../models/task";
import type { DiseaseAssessmentRecord } from "../models/diseaseAssessment";
import { diseaseAssessmentRepository, taskRepository } from "../repositories";
import { ApiError } from "../utils/ApiError";
import { resolveLegacyCatalogCropId } from "../utils/catalogCropMapping";
import { resolveCropContext } from "./diseaseContext.service";
import { diseaseAnalysisService } from "./diseaseAnalysis.service";
import type { DiseaseAnalysisResult } from "./diseaseAnalysis.service";
import { notificationService } from "./notifications";
import { taskService, toPublicTask } from "./task.service";

interface PlanStep {
  dayOffset: number;
  title: string;
  description: string;
  instructions: string;
  durationMinutes: number;
  priority: TaskRecord["priority"];
  dueTime: string;
}

function buildPlanSteps(analysis: DiseaseAnalysisResult): PlanStep[] {
  const actions = analysis.recommendedActions;
  const defaults: PlanStep[] = [
    {
      dayOffset: 0,
      title: "Remove affected plant material",
      description:
        actions[0] ||
        "Remove heavily affected leaves and dispose of them away from the field.",
      instructions:
        actions[0] ||
        "Remove heavily affected leaves and dispose of them away from the field.",
      durationMinutes: 45,
      priority: "high",
      dueTime: "07:30",
    },
    {
      dayOffset: 1,
      title: "Inspect neighbouring plants",
      description:
        actions[3] || "Monitor neighbouring plants for similar symptoms.",
      instructions:
        "Walk adjacent rows and note any new spots, yellowing, or wilt.",
      durationMinutes: 30,
      priority: "high",
      dueTime: "07:30",
    },
    {
      dayOffset: 2,
      title: "Check soil moisture & irrigation",
      description:
        actions[2] ||
        "Avoid unnecessary overhead irrigation; water at the base when possible.",
      instructions:
        "Check soil moisture at root depth and adjust irrigation timing.",
      durationMinutes: 25,
      priority: "medium",
      dueTime: "08:00",
    },
    {
      dayOffset: 4,
      title: "Reassess symptoms",
      description: analysis.reassessmentGuidance,
      instructions:
        "Compare current leaf/stem symptoms with the baseline from Day 1 photos or notes.",
      durationMinutes: 30,
      priority: "medium",
      dueTime: "07:45",
    },
    {
      dayOffset: 6,
      title: "Follow-up field inspection",
      description:
        "Perform a follow-up inspection and decide if further treatment is needed.",
      instructions:
        "Confirm whether the likely condition is improving. Escalate to a local agronomist if symptoms are spreading.",
      durationMinutes: 35,
      priority: "medium",
      dueTime: "08:00",
    },
  ];

  return defaults.map((step, index) => {
    if (index < 3 && actions[index]) {
      return {
        ...step,
        description: actions[index]!,
        instructions: actions[index]!,
      };
    }
    return step;
  });
}

function analysisFromAssessment(
  assessment: DiseaseAssessmentRecord,
  context: Awaited<ReturnType<typeof resolveCropContext>>,
): DiseaseAnalysisResult {
  const catalogCropId =
    assessment.catalogCropId ||
    resolveLegacyCatalogCropId(assessment.cropId, assessment.catalogCropId);
  if (!catalogCropId) {
    throw new ApiError(
      400,
      "Assessment is missing disease catalog information",
    );
  }

  const computed = diseaseAnalysisService.analyze(
    {
      catalogCropId,
      symptomIds: assessment.symptoms,
      image: assessment.imageUrl
        ? { fileName: "stored", mimeType: "image/jpeg", sizeBytes: 1 }
        : null,
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

  return {
    ...computed,
    analysisId: assessment.analysisId || computed.analysisId,
    possibleProblem: {
      ...computed.possibleProblem,
      name: assessment.possibleDisease,
    },
    confidencePercent: assessment.confidence,
    severity:
      (assessment.severity as DiseaseAnalysisResult["severity"]) ||
      computed.severity,
    severityLabel: computed.severityLabel,
    summary: assessment.summary || computed.summary,
    recommendedActions: assessment.recommendations.length
      ? assessment.recommendations
      : computed.recommendedActions,
    assessmentId: assessment.id,
    imageUrl: assessment.imageUrl,
    imagePublicId: assessment.imagePublicId,
  };
}

export const treatmentPlanService = {
  async createFromAssessment(userId: string, assessmentId: string) {
    const assessment = await diseaseAssessmentRepository.findByIdForOwner(
      assessmentId,
      userId,
    );
    if (!assessment) throw new ApiError(404, "Assessment not found");
    if (!assessment.cropRecordId) {
      throw new ApiError(400, "Assessment is not linked to a farm crop record");
    }

    const context = await resolveCropContext(
      userId,
      assessment.cropRecordId,
      assessment.fieldId,
    );
    const analysis = analysisFromAssessment(assessment, context);
    return this.createFromAnalysis(userId, analysis);
  },

  async createFromAnalysis(userId: string, analysis: DiseaseAnalysisResult) {
    const now = new Date().toISOString();
    const today = taskService.todayIsoDate();
    const planId = randomUUID();
    const cropName = analysis.cropContext?.cropName || analysis.crop.name;
    const fieldName = analysis.cropContext?.fieldName || "General";
    const title = `${cropName} ${analysis.possibleProblem.name} Management`;
    const steps = buildPlanSteps(analysis);

    const tasks: TaskRecord[] = steps.map((step) => ({
      id: randomUUID(),
      userId,
      farmId: analysis.cropContext?.farmId,
      fieldId: analysis.cropContext?.fieldId,
      cropRecordId: analysis.cropContext?.cropRecordId,
      title: step.title,
      description: step.description,
      crop: cropName,
      field: fieldName,
      priority: step.priority,
      dueDate: taskService.addDays(today, step.dayOffset),
      dueTime: step.dueTime,
      estimatedDurationMinutes: step.durationMinutes,
      status: "pending",
      source: "disease_treatment",
      reason: `Generated from disease assessment (${analysis.possibleProblem.framing.replace(/_/g, " ")}): ${analysis.possibleProblem.name}. ${analysis.summary}`,
      instructions: step.instructions,
      relatedDisease: analysis.possibleProblem.name,
      reminderTime: step.dueTime,
      treatmentPlanId: planId,
      dayOffset: step.dayOffset,
      createdAt: now,
      updatedAt: now,
    }));

    await taskRepository.createMany(tasks);

    const plan: TreatmentPlanRecord = {
      id: planId,
      userId,
      analysisId: analysis.analysisId,
      title,
      cropName,
      fieldName,
      problemName: analysis.possibleProblem.name,
      taskIds: tasks.map((t) => t.id),
      farmId: analysis.cropContext?.farmId,
      fieldId: analysis.cropContext?.fieldId,
      cropRecordId: analysis.cropContext?.cropRecordId,
      diseaseAssessmentId: analysis.assessmentId,
      createdAt: now,
    };
    await taskRepository.createPlan(plan);

    await notificationService.create({
      userId,
      type: "treatment_followup",
      title: `Treatment plan ready: ${analysis.possibleProblem.name}`,
      message: `${title} includes ${tasks.length} follow-up tasks starting ${tasks[0]?.dueDate || today}. First step: ${tasks[0]?.title || "Begin treatment"}.`,
      severity:
        analysis.severity === "critical" || analysis.severity === "high"
          ? "warning"
          : "info",
      dedupeKey: `treatment_plan_created:${planId}`,
      relatedResource: {
        kind: "treatment_plan",
        id: planId,
        label: title,
      },
      action: { label: "Open plan", href: `/tasks?plan=${planId}` },
    });

    const publicTasks = tasks.map((t) => toPublicTask(t, today));

    return {
      planId: plan.id,
      analysisId: analysis.analysisId,
      title: plan.title,
      cropName: plan.cropName,
      problemName: plan.problemName,
      taskCount: publicTasks.length,
      progress: { completed: 0, total: publicTasks.length },
      tasks: publicTasks,
      message: `Created treatment plan “${title}” with ${publicTasks.length} scheduled tasks.`,
    };
  },

  async getPlan(userId: string, planId: string) {
    const plan = await taskRepository.findPlanByIdForUser(planId, userId);
    if (!plan) return null;
    const today = taskService.todayIsoDate();
    const taskRows = await taskRepository.listByTreatmentPlanId(userId, planId);
    const tasks = taskRows
      .map((t) => toPublicTask(t, today))
      .sort((a, b) => (a.dayOffset || 0) - (b.dayOffset || 0));

    const completed = tasks.filter((t) => t.status === "completed").length;
    return {
      id: plan.id,
      analysisId: plan.analysisId,
      title: plan.title,
      cropName: plan.cropName,
      problemName: plan.problemName,
      createdAt: plan.createdAt,
      progress: { completed, total: tasks.length },
      tasks,
    };
  },
};
