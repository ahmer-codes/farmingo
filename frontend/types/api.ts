/** Shared API envelope used by frontend services and backend responses. */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export type AsyncState = "idle" | "loading" | "success" | "empty" | "error";
