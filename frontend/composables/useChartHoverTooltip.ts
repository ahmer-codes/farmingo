import type { Ref } from "vue";

export interface ChartTooltipState {
  text: string;
  x: number;
  y: number;
}

export function formatChartValue(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

export function useChartHoverTooltip(containerRef: Ref<HTMLElement | null>) {
  const tooltip = ref<ChartTooltipState | null>(null);

  function show(event: MouseEvent, text: string) {
    const container = containerRef.value;
    if (!container) return;
    const bounds = container.getBoundingClientRect();
    tooltip.value = {
      text,
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top - 10,
    };
  }

  function hide() {
    tooltip.value = null;
  }

  return { tooltip, show, hide };
}
