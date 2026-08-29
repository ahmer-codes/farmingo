import {
  cropRepository,
  farmRepository,
  notificationRepository,
  taskRepository,
} from "../repositories";
import { ApiError } from "../utils/ApiError";
import { toFarmProfile } from "./auth.service";
import { resolveTaskStatus } from "./task.service";

function todayIsoDate(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export const farmService = {
  async getOverview(userId: string) {
    const farm = await farmRepository.findByOwnerId(userId);
    if (!farm) {
      throw new ApiError(404, "Farm profile not found");
    }

    const today = todayIsoDate();
    const [crops, tasks, notifications] = await Promise.all([
      cropRepository.listByUser(userId),
      taskRepository.listByUser(userId),
      notificationRepository.findByUserId(userId, { includeDismissed: false }),
    ]);

    const healthyCount = crops.filter(
      (c) => c.healthStatus === "healthy",
    ).length;
    const atRiskCount = crops.filter(
      (c) =>
        c.healthStatus === "at_risk" ||
        c.healthStatus === "critical" ||
        c.healthStatus === "watch",
    ).length;

    const openTasks = tasks.filter((t) => {
      const status = resolveTaskStatus(t, today);
      return status !== "completed" && status !== "skipped";
    });

    const openAlerts = notifications.filter((n) => !n.readAt).length;

    const profile = toFarmProfile(farm);
    return {
      farmId: farm.id,
      farmName: farm.name,
      cropCount: crops.length,
      healthyCount,
      atRiskCount,
      pendingTasks: openTasks.length,
      openAlerts,
      totalAreaHa: profile?.totalAreaHa ?? 0,
      onboardingComplete: farm.onboardingComplete,
    };
  },
};
