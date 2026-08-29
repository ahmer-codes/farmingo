<template>
  <div class="space-y-4">
    <UiSectionHeader
      :title="title"
      :description="`Read-only ${title.toLowerCase()} from Firestore`"
    />

    <div v-if="loading" class="surface-card overflow-hidden">
      <div class="border-b border-line bg-canvas px-4 py-3">
        <UiSkeleton height="sm" width="lg" />
      </div>
      <div class="divide-y divide-line/70 p-2">
        <UiTableRowSkeleton v-for="n in 6" :key="n" compact show-meta />
      </div>
    </div>

    <UiErrorState
      v-else-if="error"
      :message="error"
      retry-label="Retry"
      @retry="load(true)"
    />

    <div v-else class="surface-card overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead class="border-b border-line bg-canvas text-left">
          <tr>
            <th
              v-for="col in columns"
              :key="col"
              class="px-4 py-2 font-semibold"
            >
              {{ col }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="String(row.id)"
            class="border-b border-line/70"
          >
            <td v-for="col in columns" :key="col" class="px-4 py-2 align-top">
              {{ formatCell(row[col]) }}
            </td>
          </tr>
        </tbody>
      </table>
      <UiEmptyState
        v-if="!rows.length"
        :title="`No ${title.toLowerCase()} yet`"
        :description="`There are no ${title.toLowerCase()} records to display. Data will appear here as farmers use the platform.`"
      />
    </div>

    <div v-if="hasMore" class="flex justify-center">
      <UiAppButton
        variant="secondary"
        :loading="loadingMore"
        @click="load(false)"
        >Load more</UiAppButton
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { adminService } from "~/services/admin.service";

const props = defineProps<{
  title: string;
  endpoint: "farms" | "crops" | "disease" | "tasks" | "yields";
}>();

const loaders = {
  farms: adminService.listFarms,
  crops: adminService.listCrops,
  disease: adminService.listDisease,
  tasks: adminService.listTasks,
  yields: adminService.listYields,
} as const;

const rows = ref<Array<Record<string, unknown>>>([]);
const loading = ref(true);
const loadingMore = ref(false);
const error = ref("");
const cursor = ref<string | null>(null);
const hasMore = ref(false);

const columns = computed(() => {
  const first = rows.value[0];
  if (!first) return ["id"];
  return Object.keys(first).slice(0, 8);
});

function formatCell(value: unknown) {
  if (value == null) return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

async function load(reset: boolean) {
  if (reset) {
    loading.value = true;
    cursor.value = null;
  } else {
    loadingMore.value = true;
  }
  error.value = "";
  try {
    const data = await loaders[props.endpoint]({
      cursor: reset ? undefined : cursor.value || undefined,
      limit: 25,
    });
    rows.value = reset ? data.items : [...rows.value, ...data.items];
    cursor.value = data.nextCursor;
    hasMore.value = data.hasMore;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unable to load data";
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
}

onMounted(() => load(true));
</script>
