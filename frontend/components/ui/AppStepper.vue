<template>
  <ol
    class="mb-6 flex items-center gap-1 sm:gap-2"
    aria-label="Registration progress"
  >
    <li
      v-for="(step, index) in steps"
      :key="step"
      class="flex flex-1 items-center gap-1 sm:gap-2"
    >
      <div class="flex min-w-0 flex-1 flex-col items-center gap-1">
        <span
          class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
          :class="
            index + 1 <= current
              ? 'bg-brand-600 text-white'
              : 'bg-surface-muted text-ink-muted'
          "
        >
          {{ index + 1 }}
        </span>
        <span
          class="hidden truncate text-[11px] font-medium sm:block"
          :class="index + 1 === current ? 'text-ink' : 'text-ink-muted'"
        >
          {{ step }}
        </span>
      </div>
      <div
        v-if="index < steps.length - 1"
        class="mb-4 hidden h-px flex-1 sm:block"
        :class="index + 1 < current ? 'bg-brand-400' : 'bg-line'"
        aria-hidden="true"
      />
    </li>
  </ol>
</template>

<script setup lang="ts">
defineProps<{
  steps: string[];
  current: number;
}>();
</script>
