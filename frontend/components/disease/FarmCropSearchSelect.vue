<template>
  <div ref="root" class="relative">
    <label v-if="label" class="mb-1.5 block text-sm font-medium text-ink">{{
      label
    }}</label>
    <div class="relative">
      <input
        v-model="query"
        type="search"
        class="w-full rounded-md border border-line bg-white px-3 py-2.5 pr-14 text-sm text-ink placeholder:text-ink-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        :placeholder="placeholder"
        :disabled="disabled"
        autocomplete="off"
        @focus="open = true"
        @keydown.escape="open = false"
      />
      <button
        v-if="modelValue"
        type="button"
        class="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-muted hover:text-ink"
        @click="clear"
      >
        Clear
      </button>
    </div>

    <ul
      v-if="open && filtered.length"
      class="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-line bg-white py-1 shadow-card"
      role="listbox"
    >
      <li
        v-for="option in filtered"
        :key="option.id"
        role="option"
        class="cursor-pointer px-3 py-2 text-sm hover:bg-canvas"
        :class="
          option.id === modelValue
            ? 'bg-brand-50 font-semibold text-brand-800'
            : 'text-ink'
        "
        @mousedown.prevent="select(option.id)"
      >
        <span>{{ option.name }}</span>
        <span class="text-ink-muted"> · {{ option.fieldName }}</span>
        <span v-if="option.variety" class="type-helper">
          ({{ option.variety }})</span
        >
      </li>
    </ul>
    <p v-else-if="open && query && !filtered.length" class="type-helper mt-2">
      No crops match “{{ query }}”.
    </p>
    <p v-if="error" class="mt-1 text-xs text-danger">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import type { FarmCrop } from "~/types/crop";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    options: FarmCrop[];
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
  }>(),
  {
    placeholder: "Search your crops…",
    disabled: false,
  },
);

const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const root = ref<HTMLElement | null>(null);
const query = ref("");
const open = ref(false);

function displayLabel(crop: FarmCrop) {
  const variety = crop.variety ? ` (${crop.variety})` : "";
  return `${crop.name}${variety} · ${crop.fieldName}`;
}

watch(
  () => props.modelValue,
  (id) => {
    const match = props.options.find((o) => o.id === id);
    if (match) query.value = displayLabel(match);
    if (!id) query.value = "";
  },
  { immediate: true },
);

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return props.options;
  return props.options.filter((crop) => {
    const hay =
      `${crop.name} ${crop.fieldName} ${crop.variety || ""}`.toLowerCase();
    return hay.includes(q);
  });
});

function select(id: string) {
  emit("update:modelValue", id);
  open.value = false;
}

function clear() {
  emit("update:modelValue", "");
  query.value = "";
  open.value = true;
}

function onDocClick(event: MouseEvent) {
  if (!root.value?.contains(event.target as Node)) open.value = false;
}

onMounted(() => document.addEventListener("click", onDocClick));
onBeforeUnmount(() => document.removeEventListener("click", onDocClick));
</script>
