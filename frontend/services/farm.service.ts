import type { FarmOverview } from "~/types";
import { apiRequest } from "./apiClient";

/**
 * Farm domain service, overview shell only for this phase.
 */
export const farmService = {
  getOverview(token: string): Promise<FarmOverview> {
    return apiRequest<FarmOverview>("/farm/overview", {
      method: "GET",
      token,
    });
  },
};
