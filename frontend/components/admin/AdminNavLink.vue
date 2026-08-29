<template>
  <NuxtLink :to="to" v-bind="$attrs" @pointerdown="onPointerDown">
    <slot />
  </NuxtLink>
</template>

<script setup lang="ts">
import { isAdminNavActive } from "~/constants/adminNav";

defineOptions({ inheritAttrs: false });

const props = defineProps<{ to: string }>();

const route = useRoute();
const { startAdminPageLoading } = useAdminPageLoading();

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0) return;
  if (!props.to.startsWith("/admin")) return;
  if (isAdminNavActive(props.to, route.path)) return;
  startAdminPageLoading();
}
</script>
