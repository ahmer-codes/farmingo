import {
  DEFAULT_PREFERENCES,
  type FarmingType,
  type LandUnit,
  type UserPreferences,
} from "../models/user";
import { farmRepository, userRepository } from "../repositories";
import { supportConversationRepository } from "../repositories/firestore/supportConversation.repository";
import { ApiError } from "../utils/ApiError";
import { toFarmProfile, toPublicUser } from "./auth.service";

export interface ProfileUpdateInput {
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
    notifications?: Partial<UserPreferences["notifications"]>;
  };
}

export const profileService = {
  async update(userId: string, input: ProfileUpdateInput) {
    const user = await userRepository.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    let preferences = user.preferences;
    if (input.preferences) {
      preferences = {
        temperatureUnit:
          input.preferences.temperatureUnit || user.preferences.temperatureUnit,
        landUnit: input.preferences.landUnit || user.preferences.landUnit,
        notifications: {
          ...user.preferences.notifications,
          ...(input.preferences.notifications || {}),
        },
      };
    }

    const nextFullName = input.fullName?.trim() || user.fullName;

    const updatedUser = await userRepository.update(userId, {
      fullName: nextFullName,
      fullNameLower: nextFullName.toLowerCase().trim(),
      phone:
        input.phone !== undefined
          ? input.phone.trim() || undefined
          : user.phone,
      avatarUrl:
        input.avatarUrl === null
          ? undefined
          : input.avatarUrl !== undefined
            ? input.avatarUrl
            : user.avatarUrl,
      ...(input.avatarUrl === null
        ? { avatarPublicId: undefined, avatarUploadedAt: undefined }
        : {}),
      preferences,
    });

    if (!updatedUser) throw new ApiError(404, "User not found");

    const conversation =
      await supportConversationRepository.getCurrentConversation(userId);
    if (conversation) {
      await supportConversationRepository.updateConversation(conversation.id, {
        userEmail: updatedUser.email.toLowerCase(),
        userName: updatedUser.fullName.trim(),
      });
    }

    let farm = await farmRepository.findByOwnerId(userId);
    if (farm && (input.farm || input.crops)) {
      const nextSize = input.farm?.size ?? farm.size;
      const nextUnit = input.farm?.unit ?? farm.unit;
      const nextName = input.farm?.name?.trim() ?? farm.name;
      const nextLocation = input.farm?.location?.trim() ?? farm.location;
      const nextType = input.farm?.farmingType ?? farm.farmingType;
      const nextCrops = input.crops ?? farm.primaryCrops;

      const complete =
        Boolean(nextName) && Boolean(nextLocation) && nextSize > 0;

      farm = await farmRepository.update(farm.id, {
        name: nextName,
        location: nextLocation,
        size: nextSize,
        unit: nextUnit,
        farmingType: nextType,
        primaryCrops: nextCrops,
        onboardingComplete: complete,
      });
    }

    // Keep preferred land unit in sync when farm unit changes
    if (
      input.farm?.unit &&
      updatedUser.preferences.landUnit !== input.farm.unit
    ) {
      await userRepository.update(userId, {
        preferences: {
          ...updatedUser.preferences,
          landUnit: input.farm.unit,
        },
      });
      const refreshed = await userRepository.findById(userId);
      if (refreshed) {
        return {
          user: toPublicUser(refreshed),
          farm: toFarmProfile(farm),
        };
      }
    }

    return {
      user: toPublicUser(updatedUser),
      farm: toFarmProfile(farm),
    };
  },

  defaultPreferences() {
    return DEFAULT_PREFERENCES;
  },
};
