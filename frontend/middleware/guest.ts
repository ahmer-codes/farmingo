export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return

  const auth = useAuthStore()
  if (!auth.initialized) {
    await auth.initialize()
  }

  if (auth.isAuthenticated) {
    await navigateAfterLogin()
  }
})
