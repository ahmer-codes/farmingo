<template>
  <div class="min-h-screen bg-canvas">
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-30 bg-ink/40 lg:hidden"
      @click="ui.closeSidebar()"
    />

    <LayoutAppSidebar :open="sidebarOpen" @navigate="ui.closeSidebar()" />

    <div class="lg:pl-sidebar">
      <LayoutAppHeader
        :title="meta.title"
        :breadcrumb="meta.breadcrumb"
        @toggle-sidebar="ui.toggleSidebar()"
      />

      <main class="relative mx-auto min-h-[calc(100vh-var(--header-height))] max-w-content px-4 py-5 pb-[calc(var(--bottom-nav-height)+1.25rem)] lg:px-6 lg:pb-8">
        <slot />
        <div
          v-if="showDelayedPageLoading"
          class="pointer-events-none fixed inset-x-0 top-[var(--header-height)] z-20 flex justify-center pt-6"
          aria-hidden="true"
        >
          <div class="rounded-full border border-line bg-white px-4 py-2 shadow-card">
            <UiLoadingDots size="sm" />
          </div>
        </div>
      </main>

      <UiToastHost />
      <UiConfirmDialog />

      <SupportMessengerFab />

      <div class="hidden lg:block">
        <LayoutAppFooter />
      </div>

      <LayoutAppBottomNav />
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUiStore } from '~/stores/ui'

const route = useRoute()
const ui = useUiStore()
const { sidebarOpen } = storeToRefs(ui)
const showDelayedPageLoading = useState('delayed-page-loading', () => false)

const pageMeta: Record<string, { title: string; breadcrumb: string[] }> = {
  '/dashboard': { title: 'Dashboard', breadcrumb: ['Farmingo', 'Dashboard'] },
  '/farm': { title: 'Farm', breadcrumb: ['Farmingo', 'Farm'] },
  '/crops': { title: 'Crops', breadcrumb: ['Farmingo', 'Crops'] },
  '/crop-health': { title: 'Crops', breadcrumb: ['Farmingo', 'Crops'] },
  '/disease': { title: 'Crop Health Assessment', breadcrumb: ['Farmingo', 'Crop Health Assessment'] },
  '/disease-detection': { title: 'Crop Health Assessment', breadcrumb: ['Farmingo', 'Crop Health Assessment'] },
  '/disease-detection/history': { title: 'Assessment History', breadcrumb: ['Farmingo', 'Crop Health Assessment', 'History'] },
  '/tasks': { title: 'Tasks', breadcrumb: ['Farmingo', 'Tasks'] },
  '/weather': { title: 'Weather', breadcrumb: ['Farmingo', 'Weather'] },
  '/yield': { title: 'Yield Analytics', breadcrumb: ['Farmingo', 'Yield'] },
  '/notifications': { title: 'Notifications', breadcrumb: ['Farmingo', 'Notifications'] },
  '/profile': { title: 'Profile', breadcrumb: ['Farmingo', 'Profile'] },
  '/settings': { title: 'Settings', breadcrumb: ['Farmingo', 'Settings'] },
}

const meta = computed(
  () => pageMeta[route.path] || { title: 'Farmingo', breadcrumb: ['Farmingo'] },
)
</script>
