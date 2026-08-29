/** Runs `load` once Firebase auth is ready (avoids idle pages before token is available). */
export function useAuthReadyLoad(load: () => void | Promise<void>) {
  const { isReady } = useAuth();

  watch(
    isReady,
    (ready) => {
      if (ready) void load();
    },
    { immediate: true },
  );
}
