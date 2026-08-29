import { randomUUID } from "crypto";
import type { FieldGeoMeta } from "../models/crop";
import {
  DEFAULT_PREFERENCES,
  type FarmProfile,
  type FarmRecord,
  type FarmingType,
  type LandUnit,
  type PublicUser,
  type AccountType,
  type UserPreferences,
  type UserRecord,
} from "../models/user";
import {
  farmRepository,
  fieldRepository,
  userRepository,
} from "../repositories";
import { ApiError } from "../utils/ApiError";

export interface BootstrapInput {
  fullName: string;
  email: string;
  /** Metadata only, not used for authorization. */
  accountType?: AccountType;
  phone?: string;
  farm?: {
    name: string;
    location: string;
    size: number;
    unit: LandUnit;
    farmingType: FarmingType;
  } | null;
  crops?: string[];
  preferences?: Partial<UserPreferences> & {
    notifications?: Partial<UserPreferences["notifications"]>;
  };
  skipFarmSetup?: boolean;
}

export interface AuthProfile {
  user: PublicUser;
  farm: FarmProfile | null;
}

function toHectares(size: number, unit: LandUnit): number {
  if (unit === "acres") return Number((size * 0.404686).toFixed(3));
  return size;
}

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    avatarPublicId: user.avatarPublicId,
    avatarUploadedAt: user.avatarUploadedAt,
    preferences: user.preferences,
    createdAt: user.createdAt,
  };
}

export function toFarmProfile(farm: FarmRecord | null): FarmProfile | null {
  if (!farm) return null;
  return {
    id: farm.id,
    name: farm.name,
    location: farm.location,
    region: farm.region,
    size: farm.size,
    unit: farm.unit,
    farmingType: farm.farmingType,
    primaryCrops: farm.primaryCrops,
    onboardingComplete: farm.onboardingComplete,
    totalAreaHa: toHectares(farm.size, farm.unit),
  };
}

function mergePreferences(
  base: UserPreferences,
  patch?: BootstrapInput["preferences"],
): UserPreferences {
  if (!patch) return base;
  return {
    temperatureUnit: patch.temperatureUnit || base.temperatureUnit,
    landUnit: patch.landUnit || base.landUnit,
    notifications: {
      ...base.notifications,
      ...(patch.notifications || {}),
    },
  };
}

function emptyGeo(): FieldGeoMeta {
  return {
    referencePoint: null,
    boundaryGeoJson: null,
    imageryReady: false,
    coordinateSystem: null,
    source: null,
  };
}

function initialFieldName(farmName: string): string {
  return `${farmName.trim()}, Main Field`;
}

async function buildProfile(user: UserRecord): Promise<AuthProfile> {
  const farm = await farmRepository.findByOwnerId(user.id);
  return {
    user: toPublicUser(user),
    farm: toFarmProfile(farm),
  };
}

async function ensureInitialField(
  userId: string,
  farm: FarmRecord,
  farmInput: NonNullable<BootstrapInput["farm"]>,
): Promise<void> {
  const existingFields = await fieldRepository.listByUser(userId);
  const farmFields = existingFields.filter((field) => field.farmId === farm.id);
  if (farmFields.length > 0) return;

  const now = new Date().toISOString();
  await fieldRepository.create({
    id: randomUUID(),
    userId,
    farmId: farm.id,
    name: initialFieldName(farmInput.name),
    area: farmInput.size,
    areaUnit: farmInput.unit,
    layoutRow: 0,
    layoutCol: 0,
    layoutSpan: 1,
    geo: emptyGeo(),
    createdAt: now,
    updatedAt: now,
  });
}

async function ensureFarm(
  userId: string,
  input: BootstrapInput,
  preferences: UserPreferences,
  crops: string[],
  skipFarm: boolean,
  now: string,
): Promise<FarmRecord> {
  let farm = await farmRepository.findByOwnerId(userId);

  if (farm) {
    if (!skipFarm && input.farm && !farm.onboardingComplete) {
      const updated = await farmRepository.update(farm.id, {
        name: input.farm.name.trim(),
        location: input.farm.location.trim(),
        size: input.farm.size,
        unit: input.farm.unit,
        farmingType: input.farm.farmingType,
        primaryCrops: crops.length ? crops : farm.primaryCrops,
        onboardingComplete: true,
      });
      if (updated) farm = updated;
    }
    return farm;
  }

  if (!skipFarm && input.farm) {
    return farmRepository.create({
      id: randomUUID(),
      ownerId: userId,
      name: input.farm.name.trim(),
      location: input.farm.location.trim(),
      size: input.farm.size,
      unit: input.farm.unit,
      farmingType: input.farm.farmingType,
      primaryCrops: crops,
      onboardingComplete: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  return farmRepository.create({
    id: randomUUID(),
    ownerId: userId,
    name: `${input.fullName.trim().split(/\s+/)[0] || "My"}'s Farm`,
    location: "",
    size: 0,
    unit: preferences.landUnit,
    farmingType: "crop",
    primaryCrops: crops,
    onboardingComplete: false,
    createdAt: now,
    updatedAt: now,
  });
}

export const authService = {
  /** Creates Firestore profile + farm (+ initial field when farm setup completed). Idempotent. */
  async bootstrap(
    userId: string,
    email: string,
    input: BootstrapInput,
  ): Promise<AuthProfile> {
    const now = new Date().toISOString();
    const skipFarm = Boolean(input.skipFarmSetup) || !input.farm;
    const crops = (input.crops || []).filter(Boolean);
    const preferences = mergePreferences(DEFAULT_PREFERENCES, {
      ...input.preferences,
      landUnit:
        input.farm?.unit ||
        input.preferences?.landUnit ||
        DEFAULT_PREFERENCES.landUnit,
    });

    let user = await userRepository.findById(userId);

    if (!user) {
      const emailTaken = await userRepository.findByEmail(input.email);
      if (emailTaken && emailTaken.id !== userId) {
        throw new ApiError(409, "An account with this email already exists");
      }

      user = await userRepository.create({
        id: userId,
        email: email.toLowerCase().trim(),
        fullName: input.fullName.trim(),
        fullNameLower: input.fullName.toLowerCase().trim(),
        accountType: input.accountType,
        status: "active",
        phone: input.phone?.trim() || undefined,
        preferences,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      const patch: Partial<typeof user> = { updatedAt: now };
      if (input.fullName?.trim()) {
        patch.fullName = input.fullName.trim();
        patch.fullNameLower = input.fullName.toLowerCase().trim();
      }
      if (input.accountType) patch.accountType = input.accountType;
      if (input.phone !== undefined)
        patch.phone = input.phone.trim() || undefined;
      if (input.preferences) {
        patch.preferences = mergePreferences(
          user.preferences,
          input.preferences,
        );
      }
      const updated = await userRepository.update(userId, patch);
      if (updated) user = updated;
    }

    if (input.accountType !== "admin") {
      const farm = await ensureFarm(
        userId,
        input,
        preferences,
        crops,
        skipFarm,
        now,
      );

      if (!skipFarm && input.farm) {
        await ensureInitialField(userId, farm, input.farm);
      }
    }

    return buildProfile(user);
  },

  async me(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user)
      throw new ApiError(
        404,
        "User profile not found. Complete registration bootstrap.",
      );
    return buildProfile(user);
  },

  async logout() {
    return { message: "Signed out" };
  },
};
