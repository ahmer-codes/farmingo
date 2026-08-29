import type {
  CreateCropPayload,
  CreateFieldPayload,
  FarmCrop,
  FarmField,
  UpdateCropPayload,
  YieldAnalytics,
  YieldAnalyticsFilter,
  YieldObservation,
} from "~/types/crop";
import { apiRequest } from "./apiClient";

export const fieldService = {
  list(token: string): Promise<FarmField[]> {
    return apiRequest<FarmField[]>("/fields", { token });
  },

  get(token: string, id: string): Promise<FarmField> {
    return apiRequest<FarmField>(`/fields/${id}`, { token });
  },

  create(token: string, payload: CreateFieldPayload): Promise<FarmField> {
    return apiRequest<FarmField>("/fields", {
      method: "POST",
      token,
      body: payload,
    });
  },

  update(
    token: string,
    id: string,
    payload: Partial<CreateFieldPayload>,
  ): Promise<FarmField> {
    return apiRequest<FarmField>(`/fields/${id}`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },

  remove(token: string, id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/fields/${id}`, {
      method: "DELETE",
      token,
    });
  },
};

export const cropService = {
  list(token: string): Promise<FarmCrop[]> {
    return apiRequest<FarmCrop[]>("/crops", { token });
  },

  get(token: string, id: string): Promise<FarmCrop> {
    return apiRequest<FarmCrop>(`/crops/${id}`, { token });
  },

  create(token: string, payload: CreateCropPayload): Promise<FarmCrop> {
    return apiRequest<FarmCrop>("/crops", {
      method: "POST",
      token,
      body: payload,
    });
  },

  update(
    token: string,
    id: string,
    payload: UpdateCropPayload,
  ): Promise<FarmCrop> {
    return apiRequest<FarmCrop>(`/crops/${id}`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },

  remove(token: string, id: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/crops/${id}`, {
      method: "DELETE",
      token,
    });
  },
};

export const yieldService = {
  analytics(
    token: string,
    filter: YieldAnalyticsFilter = {},
  ): Promise<YieldAnalytics> {
    return apiRequest<YieldAnalytics>("/yields/analytics", {
      token,
      query: {
        crop: filter.crop,
        field: filter.field,
        season: filter.season,
        year: filter.year,
      },
    });
  },

  list(
    token: string,
    filter: YieldAnalyticsFilter = {},
  ): Promise<YieldObservation[]> {
    return apiRequest<YieldObservation[]>("/yields", {
      token,
      query: {
        crop: filter.crop,
        field: filter.field,
        season: filter.season,
        year: filter.year,
      },
    });
  },
};
