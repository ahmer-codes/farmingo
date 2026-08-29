<template>
  <Teleport to="body">
    <div
      class="overlay-scrim flex bg-ink/40"
      :class="
        variant === 'drawer'
          ? 'justify-end'
          : 'items-end justify-center p-4 sm:items-center'
      "
      role="presentation"
      @click.self="$emit('close')"
    >
      <slot />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: "dialog" | "drawer";
  }>(),
  { variant: "dialog" },
);

defineEmits<{ close: [] }>();

onMounted(() => {
  document.body.style.overflow = "hidden";
});

onBeforeUnmount(() => {
  document.body.style.overflow = "";
});
</script>
