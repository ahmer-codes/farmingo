import type { Ref } from "vue";

const DEFAULT_MAX_ROWS = 3;

export function useAutoGrowTextarea(
  element: Ref<HTMLTextAreaElement | null>,
  getValue: () => string,
  options?: { minRows?: number; maxRows?: number },
) {
  const minRows = options?.minRows ?? 1;
  const maxRows = options?.maxRows ?? DEFAULT_MAX_ROWS;
  const isScrollable = ref(false);

  function resize() {
    const el = element.value;
    if (!el) return;

    el.style.height = "0px";
    el.style.overflowY = "hidden";

    const style = getComputedStyle(el);
    const lineHeight = parseFloat(style.lineHeight) || 20;
    const verticalExtras =
      parseFloat(style.paddingTop) +
      parseFloat(style.paddingBottom) +
      parseFloat(style.borderTopWidth) +
      parseFloat(style.borderBottomWidth);

    const contentLines = Math.max(
      1,
      Math.ceil((el.scrollHeight - verticalExtras) / lineHeight),
    );
    const visibleRows = Math.min(maxRows, Math.max(minRows, contentLines));
    const nextHeight = lineHeight * visibleRows + verticalExtras;

    el.style.height = `${nextHeight}px`;
    isScrollable.value = contentLines > maxRows;
    el.style.overflowY =
      isScrollable.value || minRows === maxRows ? "auto" : "hidden";
  }

  function scheduleResize() {
    void nextTick(resize);
  }

  watch(() => getValue(), scheduleResize);

  onMounted(scheduleResize);

  return { resize, scheduleResize, isScrollable };
}
