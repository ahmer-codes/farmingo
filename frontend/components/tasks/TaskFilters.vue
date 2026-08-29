<template>
  <div
    class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] md:flex-wrap md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="inline-flex h-10 shrink-0 items-center rounded-md border px-3 text-xs font-semibold transition-colors md:h-auto md:py-1.5"
      :class="
        modelValue === option.value
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-line bg-white text-ink hover:bg-canvas'
      "
      @click="$emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { TaskListFilter } from "~/types";

defineProps<{ modelValue: TaskListFilter }>();
defineEmits<{ "update:modelValue": [value: TaskListFilter] }>();

const options: Array<{ value: TaskListFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "overdue", label: "Overdue" },
  { value: "disease_treatment", label: "Disease treatment" },
  { value: "weather_precaution", label: "Weather" },
  { value: "farmer_created", label: "Custom" },
  { value: "seasonal_recommendation", label: "Seasonal" },
];
</script>
