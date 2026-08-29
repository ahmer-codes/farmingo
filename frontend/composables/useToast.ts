export type ToastTone = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  tone: ToastTone;
}

let toastSeq = 0;

export function useToast() {
  const toasts = useState<ToastItem[]>("farmingo-toasts", () => []);

  function dismiss(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  function push(input: {
    title: string;
    message?: string;
    tone?: ToastTone;
    durationMs?: number;
  }) {
    const id = `toast-${++toastSeq}`;
    const item: ToastItem = {
      id,
      title: input.title,
      message: input.message,
      tone: input.tone || "info",
    };
    toasts.value = [...toasts.value, item];
    const duration = input.durationMs ?? 3200;
    if (duration > 0) {
      window.setTimeout(() => dismiss(id), duration);
    }
    return id;
  }

  return {
    toasts,
    push,
    dismiss,
    success: (title: string, message?: string) =>
      push({ title, message, tone: "success" }),
    error: (title: string, message?: string) =>
      push({ title, message, tone: "error" }),
    info: (title: string, message?: string) =>
      push({ title, message, tone: "info" }),
  };
}
