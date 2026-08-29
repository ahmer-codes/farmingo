export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return

  const auth = useAuthStore()
  await auth.initialize()

  if (auth.hasFirebaseSession && auth.profileMissing) {
    return navigateTo('/register')
  }

  if (!auth.isAuthenticated) {
    return navigateTo('/login')
  }
})
