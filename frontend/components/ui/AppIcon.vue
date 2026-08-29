<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    :class="sizeClass"
    aria-hidden="true"
  >
    <!-- plus -->
    <template v-if="name === 'plus'">
      <path d="M12 5v14M5 12h14" />
    </template>
    <!-- pencil / edit -->
    <template v-else-if="name === 'pencil' || name === 'edit'">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </template>
    <!-- trash-2 / delete -->
    <template v-else-if="name === 'trash-2' || name === 'delete'">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" />
      <path d="M10 11v6M14 11v6" />
    </template>
    <!-- x / close -->
    <template v-else-if="name === 'x' || name === 'close'">
      <path d="M18 6 6 18M6 6l12 12" />
    </template>
    <!-- refresh-cw -->
    <template v-else-if="name === 'refresh-cw' || name === 'refresh'">
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </template>
    <!-- upload -->
    <template v-else-if="name === 'upload'">
      <path d="M12 3v12" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 21h14" />
    </template>
    <!-- camera -->
    <template v-else-if="name === 'camera'">
      <path
        d="M4 7h2l2-3h8l2 3h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"
      />
      <circle cx="12" cy="13" r="3.5" />
    </template>
    <!-- menu -->
    <template v-else-if="name === 'menu'">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </template>
    <!-- alert-triangle -->
    <template v-else-if="name === 'alert-triangle'">
      <path
        d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
      />
      <path d="M12 9v4M12 17h.01" />
    </template>
    <!-- check -->
    <template v-else-if="name === 'check'">
      <path d="M20 6 9 17l-5-5" />
    </template>
    <!-- loader / spinner (static arc; animate via parent) -->
    <template v-else-if="name === 'loader' || name === 'spinner'">
      <path d="M12 2a10 10 0 0 1 10 10" />
    </template>
    <!-- search -->
    <template v-else-if="name === 'search'">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </template>
    <!-- filter -->
    <template v-else-if="name === 'filter'">
      <path d="M4 5h16M7 12h10M10 19h4" />
    </template>
    <!-- download -->
    <template v-else-if="name === 'download'">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </template>
    <!-- chevron-down -->
    <template v-else-if="name === 'chevron-down'">
      <path d="m6 9 6 6 6-6" />
    </template>
    <!-- chevron-up -->
    <template v-else-if="name === 'chevron-up'">
      <path d="m18 15-6-6-6 6" />
    </template>
    <!-- chevron-left -->
    <template v-else-if="name === 'chevron-left'">
      <path d="m15 18-6-6 6-6" />
    </template>
    <!-- chevron-right -->
    <template v-else-if="name === 'chevron-right'">
      <path d="m9 18 6-6-6-6" />
    </template>
    <!-- message-circle -->
    <template v-else-if="name === 'message-circle'">
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
      />
    </template>
    <!-- life-buoy / support -->
    <template v-else-if="name === 'life-buoy' || name === 'support'">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <path
        d="M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24"
      />
    </template>
    <!-- send -->
    <template v-else-if="name === 'send'">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </template>
    <!-- more-vertical -->
    <template v-else-if="name === 'more-vertical'">
      <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
    </template>
    <template v-else>
      <circle cx="12" cy="12" r="8" />
    </template>
  </svg>
</template>

<script setup lang="ts">
export type AppIconName =
  | "plus"
  | "pencil"
  | "edit"
  | "trash-2"
  | "delete"
  | "x"
  | "close"
  | "refresh-cw"
  | "refresh"
  | "upload"
  | "camera"
  | "menu"
  | "alert-triangle"
  | "check"
  | "loader"
  | "spinner"
  | "search"
  | "filter"
  | "download"
  | "chevron-down"
  | "chevron-up"
  | "chevron-left"
  | "chevron-right"
  | "message-circle"
  | "life-buoy"
  | "support"
  | "send"
  | "more-vertical";

const props = withDefaults(
  defineProps<{
    name: AppIconName | string;
    size?: "sm" | "md" | "lg";
  }>(),
  { size: "md" },
);

const strokeWidth = 1.75;

const sizeClass = computed(() => {
  const map = {
    sm: "h-4 w-4 shrink-0",
    md: "h-[1.125rem] w-[1.125rem] shrink-0",
    lg: "h-5 w-5 shrink-0",
  } as const;
  return map[props.size];
});
</script>
