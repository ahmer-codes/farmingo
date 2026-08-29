import { onBeforeUnmount, toValue, watch, type MaybeRefOrGetter } from "vue";

export function useOverlayEscape(options: {
  active: MaybeRefOrGetter<boolean>;
  onClose: () => void;
  blocked?: MaybeRefOrGetter<boolean>;
}) {
  function onKeydown(event: KeyboardEvent) {
    if (event.key !== "Escape") return;
    if (!toValue(options.active)) return;
    if (toValue(options.blocked ?? false)) return;
    event.preventDefault();
    options.onClose();
  }

  watch(
    () => toValue(options.active),
    (active) => {
      if (active) {
        document.addEventListener("keydown", onKeydown);
      } else {
        document.removeEventListener("keydown", onKeydown);
      }
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    document.removeEventListener("keydown", onKeydown);
  });
}
