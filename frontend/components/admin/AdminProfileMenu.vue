<template>
  <div ref="rootRef" class="relative">
    <button
      type="button"
      class="admin-profile-trigger flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      :class="
        variant === 'chrome'
          ? 'admin-profile-trigger--chrome'
          : 'border border-line bg-white hover:bg-canvas focus-visible:outline-brand-600'
      "
      :aria-expanded="open"
      aria-haspopup="menu"
      @click="toggle"
    >
      <span
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800"
        aria-hidden="true"
      >
        {{ initials }}
      </span>
      <span class="hidden min-w-0 sm:block">
        <span
          class="block truncate text-sm font-medium"
          :class="variant === 'chrome' ? 'text-white' : 'text-ink'"
          >{{ name }}</span
        >
        <span
          class="block truncate text-[11px]"
          :class="
            variant === 'chrome' ? 'text-white/70' : 'text-ink-muted'
          "
          >Administrator</span
        >
      </span>
      <UiAppIcon
        name="chevron-down"
        class="hidden h-4 w-4 sm:block"
        :class="variant === 'chrome' ? 'text-white/70' : 'text-ink-muted'"
        aria-hidden="true"
      />
    </button>

    <div
      v-if="open"
      role="menu"
      class="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border border-line bg-white shadow-lg"
    >
      <div class="border-b border-line bg-canvas/60 px-4 py-3">
        <p class="truncate text-sm font-semibold text-ink">{{ name }}</p>
        <p class="truncate text-xs text-ink-secondary">{{ email }}</p>
        <UiStatusBadge tone="neutral" compact class="mt-2"
          >Administrator</UiStatusBadge
        >
      </div>

      <div class="p-1">
        <NuxtLink
          to="/dashboard"
          role="menuitem"
          class="admin-profile-item"
          @click="close"
        >
          Return to farmer app
        </NuxtLink>
        <button
          type="button"
          role="menuitem"
          class="admin-profile-item admin-profile-item--danger"
          @click="onLogout"
        >
          Sign out
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    name: string;
    email: string;
    variant?: "default" | "chrome";
  }>(),
  { variant: "default" },
);

const emit = defineEmits<{ logout: [] }>();

const open = ref(false);
const rootRef = ref<HTMLElement | null>(null);

const initials = computed(() => {
  const parts = props.name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.slice(0, 2) || "AD").toUpperCase();
});

function toggle() {
  open.value = !open.value;
}

function close() {
  open.value = false;
}

function onLogout() {
  close();
  emit("logout");
}

function handleDocumentClick(event: MouseEvent) {
  if (!open.value) return;
  const target = event.target as Node;
  if (rootRef.value && !rootRef.value.contains(target)) {
    close();
  }
}

useOverlayEscape({
  active: () => open.value,
  onClose: close,
});

onMounted(() => {
  document.addEventListener("click", handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
});
</script>

<style scoped>
.admin-profile-item {
  display: block;
  width: 100%;
  border-radius: calc(var(--radius-md) - 2px);
  padding: 0.625rem 0.75rem;
  text-align: left;
  font-size: 0.875rem;
  color: var(--color-ink);
  transition: background 0.15s ease;
}

.admin-profile-item:hover {
  background: var(--color-canvas);
}

.admin-profile-item--danger {
  color: var(--color-danger);
}

.admin-profile-item:focus-visible,
.admin-profile-trigger:focus-visible {
  outline: 2px solid var(--color-brand-600);
  outline-offset: 2px;
}

.admin-profile-trigger--chrome {
  border: 1px solid rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(10px);
}

.admin-profile-trigger--chrome:hover {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.55);
}

.admin-profile-trigger--chrome:focus-visible {
  outline-color: #fff;
}
</style>
