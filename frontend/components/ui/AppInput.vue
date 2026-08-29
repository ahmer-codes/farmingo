<template>
  <label class="block space-y-1.5">
    <span v-if="label" class="block text-sm font-medium text-ink">{{
      label
    }}</span>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :disabled="disabled"
      :required="required"
      class="w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-canvas"
      @input="onInput"
    />
    <span v-if="hint && !error" class="block type-helper">{{ hint }}</span>
    <span v-if="error" class="block text-xs text-danger">{{ error }}</span>
  </label>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue?: string;
    label?: string;
    type?: string;
    placeholder?: string;
    autocomplete?: string;
    hint?: string;
    error?: string;
    id?: string;
    disabled?: boolean;
    required?: boolean;
  }>(),
  {
    modelValue: "",
    type: "text",
    disabled: false,
    required: false,
  },
);

const emit = defineEmits<{ "update:modelValue": [value: string] }>();

function onInput(event: Event) {
  emit("update:modelValue", (event.target as HTMLInputElement).value);
}
</script>
