let tokenGetter: (() => Promise<string | null>) | null = null;
let authReady: (() => Promise<boolean>) | null = null;

export function setAuthTokenGetter(fn: () => Promise<string | null>) {
  tokenGetter = fn;
}

export function setAuthReadyChecker(fn: () => Promise<boolean>) {
  authReady = fn;
}

export async function resolveAuthToken(
  explicit?: string | null,
): Promise<string | undefined> {
  if (explicit) return explicit;
  if (tokenGetter) {
    const token = await tokenGetter();
    return token || undefined;
  }
  return undefined;
}

/** Ensures Firebase auth is ready, then returns the current ID token. */
export async function getAuthToken(): Promise<string> {
  if (authReady) {
    const ready = await authReady();
    if (!ready) {
      throw new Error("Please sign in again");
    }
  }
  const token = await resolveAuthToken();
  if (!token) {
    throw new Error("Please sign in again");
  }
  return token;
}
