<template>
  <div class="relative min-h-screen overflow-hidden bg-canvas">
    <div
      class="pointer-events-none absolute inset-0 bg-cover bg-center opacity-20"
      :style="{ backgroundImage: `url(${headerBg})` }"
      aria-hidden="true"
    />
    <div class="pointer-events-none absolute inset-0 bg-canvas/90" aria-hidden="true" />

    <div class="relative z-10 border-b border-line/60 bg-white/80 backdrop-blur">
      <div
        class="mx-auto flex items-center justify-between px-4 py-3"
        :class="wide ? 'max-w-xl' : 'max-w-md'"
      >
        <NuxtLink
          :to="backTo"
          class="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 transition hover:text-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <UiAppIcon name="chevron-left" size="sm" />
          {{ backLabel }}
        </NuxtLink>

        <NuxtLink
          v-if="isAdminLogin"
          to="/login"
          class="text-sm font-medium text-ink-secondary transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Farmer sign in
        </NuxtLink>
      </div>
    </div>

    <div
      class="relative mx-auto flex min-h-[calc(100vh-3.25rem)] flex-col justify-center px-4 py-10"
      :class="wide ? 'max-w-xl' : 'max-w-md'"
    >
      <div class="mb-8 text-center">
        <img :src="logoSrc" alt="Farmingo" class="mx-auto h-16 w-16 rounded-full object-cover" />
        <h1 class="mt-4 text-2xl font-semibold tracking-tight text-brand-700">Farmingo</h1>
        <p v-if="isAdminLogin" class="mt-2 text-sm font-medium text-brand-800">Administration</p>
        <p class="mt-2 text-sm text-ink-secondary">
          {{ isAdminLogin ? 'Sign in to the operations console.' : 'Monitor fields. Protect crops. Plan with clarity.' }}
        </p>
      </div>

      <div class="surface-card p-6 sm:p-8">
        <slot />
      </div>

      <p class="mt-6 text-center type-helper">
        {{ isAdminLogin ? 'Authorized personnel only' : 'Farmer assistant' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import logoUrl from '~/assets/Logo.png'
import headerBgUrl from '~/assets/header-bg.jpg'

const route = useRoute()
const logoSrc = logoUrl
const headerBg = headerBgUrl
const wide = computed(() => route.path.startsWith('/register'))

const isAdminLogin = computed(
  () => route.query.admin === '1' || route.query.redirect === '/admin',
)

const backTo = computed(() => (isAdminLogin.value ? '/dashboard' : '/'))
const backLabel = computed(() => (isAdminLogin.value ? 'Back to farmer app' : 'Back to home'))
</script>
