export function useConfirm() {
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

  function confirm(options: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
  }): Promise<boolean> {
    title.value = options.title;
    message.value = options.message;
    confirmLabel.value = options.confirmLabel || "Confirm";
    cancelLabel.value = options.cancelLabel || "Cancel";
    destructive.value = Boolean(options.destructive);
    open.value = true;

    return new Promise((resolve) => {
      resolver.value = resolve;
    });
  }

  return { confirm };
}
