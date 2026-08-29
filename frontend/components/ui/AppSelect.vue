<template>
  <label class="block space-y-1.5">
    <span v-if="label" class="block text-sm font-medium text-ink">{{
      label
    }}</span>
    <select
      :id="id"
      :value="modelValue"
      :disabled="disabled"
      :required="required"
      class="w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-canvas disabled:opacity-60"
      @change="onChange"
    >
      <option v-if="placeholder" disabled value="">{{ placeholder }}</option>
      <option
        v-for="opt in options"
        :key="String(opt.value)"
        :value="opt.value"
      >
        {{ opt.label }}
      </option>
    </select>
    <span v-if="error" class="block text-xs text-danger">{{ error }}</span>
  </label>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string;
  label?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  options: { value: string; label: string }[];
}>();

const emit = defineEmits<{ "update:modelValue": [value: string] }>();

function onChange(event: Event) {
  emit("update:modelValue", (event.target as HTMLSelectElement).value);
}
</script>
