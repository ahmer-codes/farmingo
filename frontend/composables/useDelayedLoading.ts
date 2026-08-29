import { type MaybeRefOrGetter, toValue, watch, onBeforeUnmount } from "vue";

/** Shows true only after `delayMs` of continuous loading, avoids flash on fast loads. */
export function useDelayedLoading(
  source: MaybeRefOrGetter<boolean>,
  delayMs = 500,
) {
  const show = ref(false);
  let timer: ReturnType<typeof setTimeout> | null = null;

  function clearTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  watch(
    () => toValue(source),
    (loading) => {
      clearTimer();
      if (loading) {
        timer = setTimeout(() => {
          show.value = true;
        }, delayMs);
      } else {
        show.value = false;
      }
    },
    { immediate: true },
  );

  onBeforeUnmount(clearTimer);

  return show;
}
