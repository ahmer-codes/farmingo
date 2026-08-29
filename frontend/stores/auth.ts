import { defineStore } from "pinia";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  onIdTokenChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import type {
  FarmProfile,
  LoginPayload,
  ProfileUpdatePayload,
  RegisterPayload,
  User,
} from "~/types";
import { authService } from "~/services";
import { ApiClientError } from "~/services/apiClient";
import { uploadService } from "~/services/upload.service";
import { getFirebaseAuth, waitForAuthReady } from "~/lib/firebase";
import { clearUserSessionCaches } from "~/utils/sessionCache";
import { useWeatherStore } from "~/stores/weather";

interface AuthState {
  user: User | null;
  farm: FarmProfile | null;
  accessToken: string | null;
  firebaseUser: FirebaseUser | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated" | "error";
  initialized: boolean;
  hydrating: boolean;
  profileMissing: boolean;
  error: string | null;
  listenerBound: boolean;
  bootstrapping: boolean;
  tokenListenerBound: boolean;
}

let initPromise: Promise<void> | null = null;
let hydratePromise: Promise<{
  user: User;
  farm: FarmProfile | null;
} | null> | null = null;

function mapFirebaseError(err: unknown, fallback: string): string {
  const code = (err as { code?: string })?.code;
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists";
    case "auth/invalid-email":
      return "Enter a valid email address";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password";
    case "auth/weak-password":
      return "Password must be at least 6 characters";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    default:
      return err instanceof Error ? err.message : fallback;
  }
}

function isTransientMeError(err: unknown): boolean {
  if (!(err instanceof ApiClientError)) return false;
  return err.status === 0 || err.status >= 500;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    user: null,
    farm: null,
    accessToken: null,
    firebaseUser: null,
    status: "idle",
    initialized: false,
    hydrating: false,
    profileMissing: false,
    error: null,
    listenerBound: false,
    bootstrapping: false,
    tokenListenerBound: false,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.firebaseUser && state.user),
    hasFirebaseSession: (state) => Boolean(state.firebaseUser),
    isHydrating: (state) => state.hydrating,
    isReady: (state) => state.initialized && !state.hydrating,
    displayName: (state) => state.user?.fullName || "Farmer",
    needsOnboarding: (state) =>
      Boolean(state.farm && !state.farm.onboardingComplete),
  },

  actions: {
    bindAuthListener() {
      if (!import.meta.client || this.listenerBound) return;
      this.listenerBound = true;
      const auth = getFirebaseAuth();

      onAuthStateChanged(auth, async (firebaseUser) => {
        const previousUid = this.firebaseUser?.uid;
        this.firebaseUser = firebaseUser;

        if (!firebaseUser) {
          if (previousUid) clearUserSessionCaches(previousUid);
          useWeatherStore().clear();
          this.clearSession();
          return;
        }

        try {
          this.accessToken = await firebaseUser.getIdToken();
        } catch {
          // Token sync can retry on the next request.
        }

        if (this.bootstrapping) return;

        // Post-initialization sign-in or token restore with missing profile.
        if (this.initialized && !this.user && !this.hydrating) {
          await this.hydrateProfile().catch(() => undefined);
        } else if (this.initialized && this.user) {
          this.status = "authenticated";
        }
      });

      if (!this.tokenListenerBound) {
        this.tokenListenerBound = true;
        onIdTokenChanged(auth, async (firebaseUser) => {
          if (!firebaseUser) return;
          try {
            this.accessToken = await firebaseUser.getIdToken();
          } catch {
            // Ignore transient token refresh errors.
          }
        });
      }
    },

    applyProfile(data: { user: User; farm: FarmProfile | null }) {
      this.user = data.user;
      this.farm = data.farm;
      this.profileMissing = false;
      this.status = "authenticated";
      this.error = null;
      this.initialized = true;
    },

    clearSession() {
      this.user = null;
      this.farm = null;
      this.accessToken = null;
      this.firebaseUser = null;
      this.profileMissing = false;
      this.status = "unauthenticated";
      this.error = null;
      this.hydrating = false;
      this.initialized = true;
    },

    async refreshAccessToken(force = false) {
      if (!this.firebaseUser) {
        this.accessToken = null;
        return null;
      }
      this.accessToken = await this.firebaseUser.getIdToken(force);
      return this.accessToken;
    },

    async initialize() {
      if (!import.meta.client) return;
      if (initPromise) return initPromise;

      initPromise = (async () => {
        this.bindAuthListener();
        this.hydrating = true;

        try {
          const firebaseUser = await waitForAuthReady();
          this.firebaseUser = firebaseUser;

          if (firebaseUser) {
            try {
              this.accessToken = await firebaseUser.getIdToken();
            } catch {
              // Continue, profile fetch may still succeed after token refresh.
            }
            await this.hydrateProfile();
          } else {
            this.status = "unauthenticated";
          }
        } finally {
          this.hydrating = false;
          this.initialized = true;
        }
      })();

      try {
        await initPromise;
      } finally {
        initPromise = null;
      }
    },

    /** Wait until Firebase + backend profile hydration has finished. Safe to call repeatedly. */
    async ensureReady(): Promise<boolean> {
      if (!import.meta.client) return false;
      await this.initialize();
      return this.isAuthenticated;
    },

    async hydrateProfile() {
      if (!this.firebaseUser) {
        this.clearSession();
        return null;
      }
      if (hydratePromise) return hydratePromise;

      hydratePromise = this._hydrateProfileInternal().finally(() => {
        hydratePromise = null;
      });
      return hydratePromise;
    },

    async _hydrateProfileInternal() {
      if (!this.firebaseUser) {
        this.clearSession();
        return null;
      }

      this.hydrating = true;
      this.profileMissing = false;
      this.status = "loading";
      this.error = null;

      try {
        await this.refreshAccessToken();
        const data = await authService.me();
        this.applyProfile(data);
        return data;
      } catch (err) {
        return this._handleHydrationError(err);
      } finally {
        this.hydrating = false;
        this.initialized = true;
      }
    },

    async _handleHydrationError(err: unknown) {
      if (!this.firebaseUser) {
        this.clearSession();
        throw err;
      }

      const apiErr = err instanceof ApiClientError ? err : null;

      if (apiErr?.status === 401) {
        try {
          await this.refreshAccessToken(true);
          const data = await authService.me();
          this.applyProfile(data);
          return data;
        } catch (retryErr) {
          this.error =
            retryErr instanceof Error
              ? retryErr.message
              : "Unable to verify session";
          this.status = this.user ? "authenticated" : "loading";
          throw retryErr;
        }
      }

      if (
        apiErr?.status === 403 &&
        apiErr.message.toLowerCase().includes("disabled")
      ) {
        this.error =
          "This account has been disabled. Contact support if you need access.";
        await this.logout();
        return null;
      }

      if (apiErr?.status === 404) {
        this.profileMissing = true;
        this.user = null;
        this.farm = null;
        this.status = "unauthenticated";
        this.error =
          apiErr.message ||
          "Profile not found. Complete registration to continue.";
        return null;
      }

      if (isTransientMeError(err)) {
        this.error =
          apiErr?.message || "Unable to reach the server. Try again shortly.";
        if (this.user) {
          this.status = "authenticated";
        }
        throw err;
      }

      this.error =
        err instanceof Error ? err.message : "Unable to load profile";
      if (this.user) {
        this.status = "authenticated";
      }
      throw err;
    },

    async fetchMe() {
      return this.hydrateProfile();
    },

    async login(payload: LoginPayload) {
      this.status = "loading";
      this.error = null;
      try {
        const auth = getFirebaseAuth();
        const credential = await signInWithEmailAndPassword(
          auth,
          payload.email.trim(),
          payload.password,
        );
        this.firebaseUser = credential.user;
        this.accessToken = await credential.user.getIdToken();
        const data = await authService.me();
        this.applyProfile(data);
        if (import.meta.client)
          sessionStorage.removeItem("farmingo-session-started");
        return data;
      } catch (err) {
        this.status = "error";
        this.error = mapFirebaseError(err, "Unable to sign in");
        throw new Error(this.error);
      }
    },

    async register(payload: RegisterPayload) {
      this.status = "loading";
      this.error = null;
      this.bootstrapping = true;
      try {
        const auth = getFirebaseAuth();
        const credential = await createUserWithEmailAndPassword(
          auth,
          payload.email.trim(),
          payload.password,
        );
        this.firebaseUser = credential.user;
        this.accessToken = await credential.user.getIdToken();

        const { password: _password, ...bootstrapPayload } = payload;
        const data = await authService.bootstrap(bootstrapPayload);
        this.applyProfile(data);
        return data;
      } catch (err) {
        this.status = "error";
        this.error = mapFirebaseError(err, "Unable to register");
        throw new Error(this.error);
      } finally {
        this.bootstrapping = false;
      }
    },

    async resetPassword(email: string) {
      this.error = null;
      try {
        const auth = getFirebaseAuth();
        await sendPasswordResetEmail(auth, email.trim());
        return {
          message:
            "If an account exists for that email, password reset instructions have been sent.",
        };
      } catch (err) {
        this.error = mapFirebaseError(err, "Unable to send reset email");
        throw new Error(this.error);
      }
    },

    async updateProfile(payload: ProfileUpdatePayload) {
      if (!this.firebaseUser) throw new Error("Not authenticated");
      this.error = null;
      try {
        await this.refreshAccessToken();
        const data = await authService.updateProfile(payload);
        this.applyProfile(data);
        return data;
      } catch (err) {
        this.error =
          err instanceof Error ? err.message : "Unable to update profile";
        throw err;
      }
    },

    async uploadProfileImage(
      file: File,
      onUploadProgress?: (percent: number) => void,
    ) {
      if (!this.firebaseUser) throw new Error("Not authenticated");
      this.error = null;
      try {
        await this.refreshAccessToken();
        const data = await uploadService.uploadProfileImage(
          file,
          onUploadProgress,
        );
        this.applyProfile({ user: data.user, farm: data.farm });
        return data;
      } catch (err) {
        this.error =
          err instanceof Error ? err.message : "Unable to upload profile image";
        throw err;
      }
    },

    async logout() {
      const uid = this.firebaseUser?.uid;
      try {
        if (this.firebaseUser) {
          await this.refreshAccessToken();
          await authService.logout().catch(() => undefined);
        }
      } finally {
        clearUserSessionCaches(uid);
        useWeatherStore().clear();
        await signOut(getFirebaseAuth()).catch(() => undefined);
        this.clearSession();
      }
    },
  },
});
