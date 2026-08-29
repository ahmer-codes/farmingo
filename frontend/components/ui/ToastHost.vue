<template>
  <div
    class="pointer-events-none fixed inset-x-0 top-[calc(var(--header-height)+0.75rem)] z-[60] flex flex-col items-end gap-2 px-4 sm:px-6"
    aria-live="polite"
    aria-relevant="additions"
  >
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="pointer-events-auto w-full max-w-sm rounded-md border px-3.5 py-3 shadow-card"
      :class="shell(toast.tone)"
      role="status"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm font-semibold text-ink">{{ toast.title }}</p>
          <p v-if="toast.message" class="type-helper mt-1">
            {{ toast.message }}
          </p>
        </div>
        <UiAppIconButton
          icon="x"
          aria-label="Dismiss notification"
          title="Dismiss"
          size="md"
          @click="dismiss(toast.id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ToastTone } from "~/composables/useToast";

const { toasts, dismiss } = useToast();

function shell(tone: ToastTone) {
  if (tone === "success") return "border-brand-200 bg-white";
  if (tone === "error") return "border-danger/30 bg-white";
  return "border-line bg-white";
}
</script>
