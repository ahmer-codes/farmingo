import { storeToRefs } from "pinia";
import { useAuthStore } from "~/stores/auth";

export function useAuth() {
  const authStore = useAuthStore();
  const {
    user,
    farm,
    accessToken,
    status,
    error,
    initialized,
    hydrating,
    profileMissing,
    isAuthenticated,
    hasFirebaseSession,
    isHydrating,
    isReady,
    displayName,
    needsOnboarding,
  } = storeToRefs(authStore);

  return {
    user,
    farm,
    accessToken,
    status,
    error,
    initialized,
    hydrating,
    profileMissing,
    isAuthenticated,
    hasFirebaseSession,
    isHydrating,
    isReady,
    displayName,
    needsOnboarding,
    login: authStore.login,
    register: authStore.register,
    logout: authStore.logout,
    fetchMe: authStore.fetchMe,
    initialize: authStore.initialize,
    ensureReady: authStore.ensureReady,
    updateProfile: authStore.updateProfile,
    uploadProfileImage: authStore.uploadProfileImage,
    clearSession: authStore.clearSession,
    resetPassword: authStore.resetPassword,
  };
}
