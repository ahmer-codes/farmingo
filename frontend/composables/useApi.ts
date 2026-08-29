import {
  authService,
  farmService,
  dashboardService,
  diseaseService,
  taskService,
} from "~/services";

/**
 * Prefer this composable in pages/composables instead of importing services ad hoc.
 */
export function useApi() {
  return {
    auth: authService,
    farm: farmService,
    dashboard: dashboardService,
    disease: diseaseService,
    tasks: taskService,
  };
}
