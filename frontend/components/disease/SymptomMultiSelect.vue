<template>
  <div class="space-y-3">
    <div
      class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <label class="text-sm font-medium text-ink">{{ label }}</label>
      <input
        v-model="query"
        type="search"
        class="w-full rounded-md border border-line bg-white px-3 py-2 text-sm sm:max-w-xs"
        placeholder="Search symptoms…"
      />
    </div>

    <div v-if="selectedSymptoms.length" class="flex flex-wrap gap-2">
      <button
        v-for="symptom in selectedSymptoms"
        :key="symptom.id"
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-800"
        @click="toggle(symptom.id)"
      >
        {{ symptom.label }}
        <span aria-hidden="true">×</span>
      </button>
    </div>

    <div
      class="max-h-72 space-y-4 overflow-y-auto rounded-md border border-line bg-white p-3"
    >
      <div v-for="category in visibleCategories" :key="category.id">
        <p class="type-label mb-2">{{ category.label }}</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="symptom in symptomsFor(category.id)"
            :key="symptom.id"
            type="button"
            class="rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors"
            :class="
              modelValue.includes(symptom.id)
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-line bg-canvas text-ink hover:bg-surface-muted'
            "
            @click="toggle(symptom.id)"
          >
            {{ symptom.label }}
          </button>
        </div>
      </div>
      <p v-if="!visibleCategories.length" class="type-helper">
        No symptoms match your search.
      </p>
    </div>
    <p v-if="error" class="text-xs text-danger">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import type { DiseaseSymptom, SymptomCatalog } from "~/types";

const props = defineProps<{
  modelValue: string[];
  catalog: SymptomCatalog;
  label?: string;
  error?: string;
}>();

const emit = defineEmits<{ "update:modelValue": [value: string[]] }>();

const query = ref("");

const selectedSymptoms = computed(() =>
  props.catalog.symptoms.filter((s) => props.modelValue.includes(s.id)),
);

function matchesQuery(symptom: DiseaseSymptom) {
  const q = query.value.trim().toLowerCase();
  if (!q) return true;
  const hay =
    `${symptom.label} ${(symptom.keywords || []).join(" ")}`.toLowerCase();
  return hay.includes(q);
}

function symptomsFor(categoryId: string) {
  return props.catalog.symptoms.filter(
    (s) => s.category === categoryId && matchesQuery(s),
  );
}

const visibleCategories = computed(() =>
  props.catalog.categories.filter((c) => symptomsFor(c.id).length > 0),
);

function toggle(id: string) {
  if (props.modelValue.includes(id)) {
    emit(
      "update:modelValue",
      props.modelValue.filter((x) => x !== id),
    );
  } else {
    emit("update:modelValue", [...props.modelValue, id]);
  }
}
</script>
