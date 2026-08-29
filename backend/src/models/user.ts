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

export type AccountType = "farmer" | "admin";
export type UserStatus = "active" | "disabled";

export interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  /** Lowercased copy for Firestore prefix search, not for display. */
  fullNameLower?: string;
  /** Metadata only, authorization uses Firebase custom claims, not this field. */
  accountType?: AccountType;
  /** Account lifecycle, defaults to active when unset on legacy profiles. */
  status?: UserStatus;
  lastLoginAt?: string;
  lastActiveAt?: string;
  disabledAt?: string;
  phone?: string;
  /** Legacy field, not used with Firebase Authentication. */
  passwordHash?: string;
  /** Cloudinary secure URL (or legacy data URL during migration). */
  avatarUrl?: string;
  /** Cloudinary public_id, used when replacing/deleting profile images. */
  avatarPublicId?: string;
  avatarUploadedAt?: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface FarmRecord {
  id: string;
  ownerId: string;
  name: string;
  location: string;
  region?: string;
  size: number;
  unit: LandUnit;
  farmingType: FarmingType;
  primaryCrops: string[];
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUser {
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
  /** Normalized hectares for analytics */
  totalAreaHa: number;
}

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
