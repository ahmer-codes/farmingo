<template>
  <div class="space-y-6" aria-busy="true" aria-label="Loading dashboard">
    <div
      class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
    >
      <div class="space-y-2">
        <UiSkeleton height="sm" width="md" />
        <UiSkeleton height="xs" width="lg" />
      </div>
      <div class="flex flex-wrap gap-2">
        <UiSkeleton
          v-for="n in 5"
          :key="n"
          height="md"
          width="sm"
          class="!w-16"
        />
      </div>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
      <UiStatCardSkeleton v-for="n in 8" :key="n" />
    </div>

    <div class="grid gap-4 xl:grid-cols-2">
      <AdminAdminChartSkeleton v-for="n in 2" :key="`row1-${n}`" tall />
    </div>

    <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <AdminAdminChartSkeleton v-for="n in 3" :key="`row2-${n}`" />
    </div>

    <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <AdminAdminChartSkeleton v-for="n in 3" :key="`row3-${n}`" />
    </div>

    <div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
      <AdminAdminChartSkeleton v-for="n in 4" :key="`row4-${n}`" />
    </div>
  </div>
</template>

<script setup lang="ts"></script>
