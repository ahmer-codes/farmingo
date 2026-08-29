<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 p-4 sm:items-center"
    role="presentation"
    @click.self="onCancel"
  >
    <div
      ref="dialogEl"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      class="w-full max-w-md rounded-md border border-line bg-white p-5 shadow-card"
      tabindex="-1"
      @keydown.esc.prevent="onCancel"
    >
      <h3 :id="titleId" class="text-lg font-semibold text-ink">{{ title }}</h3>
      <p class="type-body mt-2">{{ message }}</p>
      <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <UiAppButton
          type="button"
          variant="secondary"
          class="w-full sm:w-auto"
          @click="onCancel"
        >
          {{ cancelLabel }}
        </UiAppButton>
        <UiAppButton
          type="button"
          :variant="destructive ? 'destructive' : 'primary'"
          class="w-full sm:w-auto"
          @click="onConfirm"
        >
          {{ confirmLabel }}
        </UiAppButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const open = useState("farmingo-confirm-open", () => false);
const title = useState("farmingo-confirm-title", () => "Are you sure?");
const message = useState("farmingo-confirm-message", () => "");
const confirmLabel = useState("farmingo-confirm-ok", () => "Confirm");
const cancelLabel = useState("farmingo-confirm-cancel", () => "Cancel");
const destructive = useState("farmingo-confirm-destructive", () => false);

const resolver = useState<((value: boolean) => void) | null>(
  "farmingo-confirm-resolver",
  () => null,
);

const titleId = "farmingo-confirm-title";
const dialogEl = ref<HTMLElement | null>(null);

watch(open, async (isOpen) => {
  if (isOpen) {
    await nextTick();
    dialogEl.value?.focus();
  }
});

function finish(value: boolean) {
  open.value = false;
  resolver.value?.(value);
  resolver.value = null;
}

function onConfirm() {
  finish(true);
}

function onCancel() {
  finish(false);
}
</script>
