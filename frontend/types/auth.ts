export type LandUnit = "hectares" | "acres";
export type TemperatureUnit = "celsius" | "fahrenheit";
export type FarmingType =
  | "crop"
  | "horticulture"
  | "orchard"
  | "mixed"
  | "livestock"
  | "other";

export interface NotificationPreferences {
  weatherAlerts: boolean;
  diseaseAlerts: boolean;
  taskReminders: boolean;
  treatmentReminders: boolean;
  generalNotifications: boolean;
}

export interface UserPreferences {
  temperatureUnit: TemperatureUnit;
  landUnit: LandUnit;
  notifications: NotificationPreferences;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  avatarPublicId?: string;
  avatarUploadedAt?: string;
  preferences: UserPreferences;
  createdAt: string;
}

export interface FarmProfile {
  id: string;
  name: string;
  location: string;
  region?: string;
  size: number;
  unit: LandUnit;
  farmingType: FarmingType;
  primaryCrops: string[];
  onboardingComplete: boolean;
  totalAreaHa: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthSession {
  user: User;
  farm: FarmProfile | null;
  tokens: AuthTokens;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface FarmSetupPayload {
  name: string;
  location: string;
  size: number;
  unit: LandUnit;
  farmingType: FarmingType;
}

export interface BootstrapPayload {
  fullName: string;
  email: string;
  phone?: string;
  farm?: FarmSetupPayload | null;
  crops?: string[];
  preferences?: Partial<UserPreferences> & {
    notifications?: Partial<NotificationPreferences>;
  };
  skipFarmSetup?: boolean;
}

export interface RegisterPayload extends BootstrapPayload {
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ProfileUpdatePayload {
  fullName?: string;
  phone?: string;
  avatarUrl?: string | null;
  farm?: {
    name?: string;
    location?: string;
    size?: number;
    unit?: LandUnit;
    farmingType?: FarmingType;
  };
  crops?: string[];
  preferences?: Partial<UserPreferences> & {
    notifications?: Partial<NotificationPreferences>;
  };
}

export interface MeResponse {
  user: User;
  farm: FarmProfile | null;
}

export const CROP_OPTIONS = [
  "Wheat",
  "Rice",
  "Corn",
  "Cotton",
  "Sugarcane",
  "Tomato",
  "Potato",
  "Onion",
  "Other",
] as const;

export const FARMING_TYPE_OPTIONS: { value: FarmingType; label: string }[] = [
  { value: "crop", label: "Crop farming" },
  { value: "horticulture", label: "Horticulture / vegetables" },
  { value: "orchard", label: "Orchard / fruit" },
  { value: "mixed", label: "Mixed farming" },
  { value: "livestock", label: "Livestock" },
  { value: "other", label: "Other" },
];

export const DEFAULT_PREFERENCES: UserPreferences = {
  temperatureUnit: "celsius",
  landUnit: "hectares",
  notifications: {
    weatherAlerts: true,
    diseaseAlerts: true,
    taskReminders: true,
    treatmentReminders: true,
    generalNotifications: true,
  },
};
