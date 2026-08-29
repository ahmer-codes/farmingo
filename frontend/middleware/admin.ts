export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return

  const auth = useAuthStore()
  await auth.initialize()

  if (!auth.isAuthenticated) {
    return navigateTo({ path: '/login', query: { admin: '1', redirect: '/admin' } })
  }

  const isAdmin = await fetchIsAdmin(false)
  if (!isAdmin) {
    return navigateTo('/dashboard')
  }
})
