/**
 * Post-authentication navigation based on Firebase custom claims (not Firestore roles).
 */
export async function navigateAfterLogin() {
  const route = useRoute();
  const redirect =
    typeof route.query.redirect === "string" &&
    route.query.redirect.startsWith("/")
      ? route.query.redirect
      : null;

  const isAdmin = await fetchIsAdmin(true);

  if (redirect?.startsWith("/admin")) {
    await navigateTo(isAdmin ? redirect : "/dashboard");
    return;
  }

  await navigateTo(isAdmin ? "/admin" : "/dashboard");
}
