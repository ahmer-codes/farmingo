import type {
  BootstrapPayload,
  MeResponse,
  ProfileUpdatePayload,
} from "~/types";
import { apiRequest } from "./apiClient";

export const authService = {
  bootstrap(payload: BootstrapPayload): Promise<MeResponse> {
    return apiRequest<MeResponse>("/auth/bootstrap", {
      method: "POST",
      body: payload,
    });
  },

  me(): Promise<MeResponse> {
    return apiRequest<MeResponse>("/auth/me", {
      method: "GET",
    });
  },

  sessionStart(): Promise<{ recorded: boolean }> {
    return apiRequest<{ recorded: boolean }>("/auth/session-start", {
      method: "POST",
    });
  },

  recordActivity(): Promise<{ recorded: boolean }> {
    return apiRequest<{ recorded: boolean }>("/auth/activity", {
      method: "POST",
    });
  },

  updateProfile(payload: ProfileUpdatePayload): Promise<MeResponse> {
    return apiRequest<MeResponse>("/auth/profile", {
      method: "PATCH",
      body: payload,
    });
  },

  logout(): Promise<{ message: string }> {
    return apiRequest<{ message: string }>("/auth/logout", {
      method: "POST",
    });
  },
};
