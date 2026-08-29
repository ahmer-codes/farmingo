<template>
  <label class="flex cursor-pointer items-start gap-3">
    <input
      type="checkbox"
      class="mt-0.5 h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
      :checked="modelValue"
      :disabled="disabled"
      @change="onChange"
    />
    <span class="min-w-0">
      <span class="block text-sm font-medium text-ink">{{ label }}</span>
      <span v-if="description" class="type-helper mt-0.5 block">{{
        description
      }}</span>
    </span>
  </label>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  label: string;
  description?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();

function onChange(event: Event) {
  emit("update:modelValue", (event.target as HTMLInputElement).checked);
}
</script>
