<template>
  <textarea
    :id="id"
    ref="textareaRef"
    :value="modelValue"
    :rows="fixedRows ?? 1"
    class="chat-composer-textarea"
    :class="[
      variant === 'admin'
        ? 'chat-composer-textarea--admin'
        : 'chat-composer-textarea--fab',
      {
        'chat-composer-textarea--scrollable': isScrollable || fixedRows,
        'chat-composer-textarea--fixed': fixedRows,
      },
    ]"
    :placeholder="placeholder"
    :disabled="disabled"
    :aria-label="ariaLabel"
    @input="onInput"
    @keydown="$emit('keydown', $event)"
  />
</template>

<script setup lang="ts">
import { useAutoGrowTextarea } from "~/composables/useAutoGrowTextarea";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    disabled?: boolean;
    id?: string;
    ariaLabel?: string;
    variant?: "admin" | "fab";
    /** When set, keeps a fixed row height and scrolls overflow inside the textarea. */
    fixedRows?: number;
  }>(),
  {
    placeholder: "",
    disabled: false,
    variant: "fab",
    ariaLabel: "Message",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  keydown: [event: KeyboardEvent];
}>();

const textareaRef = ref<HTMLTextAreaElement | null>(null);

const { scheduleResize, isScrollable } = useAutoGrowTextarea(
  textareaRef,
  () => props.modelValue,
  props.fixedRows
    ? { minRows: props.fixedRows, maxRows: props.fixedRows }
    : undefined,
);

function onInput(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  emit("update:modelValue", target.value);
  if (!props.fixedRows) {
    scheduleResize();
  }
}

function focus() {
  textareaRef.value?.focus();
}

defineExpose({ focus });
</script>

<style scoped>
.chat-composer-textarea {
  resize: none;
  font: inherit;
  line-height: 1.45;
  color: var(--color-ink);
  background: #fff;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.chat-composer-textarea--admin {
  flex: 1;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.chat-composer-textarea--fab {
  flex: 1;
  border: 1px solid var(--color-border);
  border-radius: 0.875rem;
  padding: 0.625rem 0.875rem;
}

.chat-composer-textarea--fixed {
  overflow-y: auto;
}

.chat-composer-textarea:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 1px;
  border-color: #a8cbb5;
  box-shadow: 0 0 0 3px rgba(26, 77, 46, 0.1);
}

.chat-composer-textarea:disabled {
  cursor: not-allowed;
  opacity: 0.65;
  background: var(--color-canvas);
}

.chat-composer-textarea--scrollable {
  scrollbar-width: thin;
  scrollbar-color: rgba(26, 77, 46, 0.5) transparent;
}

.chat-composer-textarea--scrollable::-webkit-scrollbar {
  width: 5px;
}

.chat-composer-textarea--scrollable::-webkit-scrollbar-track {
  margin: 6px 0;
  background: transparent;
}

.chat-composer-textarea--scrollable::-webkit-scrollbar-thumb {
  background: linear-gradient(
    180deg,
    rgba(95, 138, 106, 0.55),
    rgba(26, 77, 46, 0.75)
  );
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.45);
}

.chat-composer-textarea--scrollable::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(
    180deg,
    rgba(95, 138, 106, 0.75),
    rgba(26, 77, 46, 0.9)
  );
}
</style>
