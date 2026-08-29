/**
 * Ensures a minimal Firestore users/{uid} profile exists for admin sign-in (/auth/me).
 * Does not create placeholder farms — authorization uses Firebase custom claims only.
 */
export async function ensureAdminProfile(userId: string, email: string, fullName: string) {
  const { userRepository } = await import('../src/repositories')
  const { authService } = await import('../src/services/auth.service')

  const existing = await userRepository.findById(userId)
  if (existing) {
    if (existing.accountType !== 'admin') {
      await userRepository.update(userId, {
        accountType: 'admin',
        updatedAt: new Date().toISOString(),
      })
      console.log('Updated existing profile with accountType: admin.')
    } else {
      console.log('Firestore admin profile already exists.')
    }
    return
  }

  await authService.bootstrap(userId, email, {
    fullName,
    email,
    accountType: 'admin',
    skipFarmSetup: true,
  })
  console.log('Firestore admin profile bootstrapped (admin can sign in).')
}
