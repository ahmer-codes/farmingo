<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useSupportChatStore } from "~/stores/supportChat";

const store = useSupportChatStore();
const { open, unreadCount } = storeToRefs(store);

const auth = useAuthStore();
const fabRef = ref<HTMLButtonElement | null>(null);

const showPulse = computed(() => unreadCount.value > 0 && !open.value);

watch(
  () => auth.isAuthenticated,
  (authed) => {
    if (authed) {
      void store.bootstrapUnread();
    } else {
      store.reset();
    }
  },
  { immediate: true },
);

function togglePanel() {
  if (open.value) {
    store.closePanel();
  } else {
    void store.openPanel();
  }
}

onBeforeUnmount(() => {
  store.closePanel();
});
</script>

<template>
  <div class="support-messenger">
    <Teleport to="body">
      <Transition name="support-backdrop">
        <button
          v-if="open"
          type="button"
          class="support-backdrop lg:hidden"
          aria-label="Close support chat"
          @click="store.closePanel()"
        />
      </Transition>

      <Transition name="support-panel">
        <SupportChatPanel
          v-if="open"
          :return-focus="fabRef"
          @close="store.closePanel()"
        />
      </Transition>
    </Teleport>

    <button
      ref="fabRef"
      type="button"
      class="support-fab"
      :class="{ 'support-fab--pulse': showPulse, 'support-fab--open': open }"
      :aria-label="
        open ? 'Close Farmingo support chat' : 'Open Farmingo support chat'
      "
      :aria-expanded="open"
      aria-haspopup="dialog"
      @click="togglePanel"
    >
      <UiAppIcon :name="open ? 'x' : 'life-buoy'" class="h-5 w-5" />
      <span
        v-if="unreadCount > 0 && !open"
        class="support-fab__badge"
        :aria-label="`${unreadCount} unread support message${unreadCount === 1 ? '' : 's'}`"
      >
        {{ unreadCount > 9 ? "9+" : unreadCount }}
      </span>
    </button>
  </div>
</template>

<style scoped>
.support-messenger {
  position: fixed;
  right: 1rem;
  bottom: calc(var(--bottom-nav-height) + 1rem);
  z-index: 45;
}

@media (min-width: 1024px) {
  .support-messenger {
    bottom: 1.5rem;
    right: 1.5rem;
  }
}

.support-backdrop {
  position: fixed;
  inset: 0;
  z-index: 44;
  border: 0;
  background: rgba(15, 23, 20, 0.42);
  backdrop-filter: blur(2px);
  cursor: default;
}

.support-fab {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: linear-gradient(145deg, #1a4d2e 0%, #143d24 100%);
  color: #fff;
  box-shadow:
    0 10px 28px rgba(26, 77, 46, 0.38),
    0 2px 6px rgba(15, 36, 24, 0.18);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}

.support-fab:hover {
  transform: translateY(-2px);
  box-shadow:
    0 14px 32px rgba(26, 77, 46, 0.44),
    0 4px 10px rgba(15, 36, 24, 0.2);
}

.support-fab:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 3px;
}

.support-fab--open {
  background: linear-gradient(145deg, #2d5a40 0%, #1a4d2e 100%);
}

@media (max-width: 1023px) {
  .support-fab--open {
    display: none;
  }
}

.support-fab--pulse::before {
  content: "";
  position: absolute;
  inset: -4px;
  border-radius: inherit;
  border: 2px solid rgba(180, 35, 24, 0.55);
  animation: support-fab-pulse 2.4s ease-out infinite;
  pointer-events: none;
}

.support-fab__badge {
  position: absolute;
  top: -0.2rem;
  right: -0.2rem;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.3rem;
  border-radius: 9999px;
  background: #b42318;
  color: #fff;
  font-size: 0.6875rem;
  font-weight: 700;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(180, 35, 24, 0.45);
}

.support-backdrop-enter-active,
.support-backdrop-leave-active,
.support-panel-enter-active,
.support-panel-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.support-backdrop-enter-from,
.support-backdrop-leave-to {
  opacity: 0;
}

.support-panel-enter-from,
.support-panel-leave-to {
  opacity: 0;
  transform: translateY(1rem);
}

@media (min-width: 1024px) {
  .support-panel-enter-from,
  .support-panel-leave-to {
    transform: translateY(0.75rem) scale(0.98);
  }
}

@keyframes support-fab-pulse {
  0% {
    transform: scale(1);
    opacity: 0.85;
  }
  70% {
    transform: scale(1.18);
    opacity: 0;
  }
  100% {
    transform: scale(1.18);
    opacity: 0;
  }
}
</style>
