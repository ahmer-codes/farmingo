import { getFirebaseAuth } from "~/lib/firebase";

export async function fetchIsAdmin(forceRefresh = false): Promise<boolean> {
  if (!import.meta.client) return false;
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) return false;
  const result = await user.getIdTokenResult(forceRefresh);
  return result.claims.role === "admin";
}

export function useAdminAuth() {
  const isAdmin = ref(false);
  const checking = ref(true);

  async function refresh(force = false) {
    checking.value = true;
    try {
      isAdmin.value = await fetchIsAdmin(force);
    } finally {
      checking.value = false;
    }
  }

  return { isAdmin, checking, refresh };
}
