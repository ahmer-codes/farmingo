import { validateImageFile } from "~/services/upload.service";

/**
 * Reusable image-selection + preview state for Cloudinary uploads via Express.
 * Does not talk to Cloudinary directly, callers use uploadService with the selected file.
 */
export function useImageUpload() {
  const file = ref<File | null>(null);
  const previewUrl = ref<string | null>(null);
  const progress = ref(0);
  const uploading = ref(false);
  const error = ref<string | null>(null);
  const success = ref(false);

  function revokePreview() {
    if (previewUrl.value?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl.value);
    }
    previewUrl.value = null;
  }

  function clear() {
    revokePreview();
    file.value = null;
    progress.value = 0;
    uploading.value = false;
    error.value = null;
    success.value = false;
  }

  function selectFile(next: File | null) {
    error.value = null;
    success.value = false;
    progress.value = 0;
    revokePreview();
    file.value = null;
    if (!next) return;
    const validation = validateImageFile(next);
    if (validation) {
      error.value = validation;
      return;
    }
    file.value = next;
    previewUrl.value = URL.createObjectURL(next);
  }

  function onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const selected = input.files?.[0] || null;
    selectFile(selected);
    // allow re-selecting the same file
    input.value = "";
  }

  function setProgress(percent: number) {
    progress.value = Math.min(100, Math.max(0, percent));
  }

  function beginUpload() {
    uploading.value = true;
    error.value = null;
    success.value = false;
    progress.value = 0;
  }

  function finishUpload(ok: boolean, message?: string) {
    uploading.value = false;
    success.value = ok;
    if (!ok) {
      error.value = message || "Upload failed";
    } else {
      progress.value = 100;
      error.value = null;
    }
  }

  onBeforeUnmount(() => {
    revokePreview();
  });

  return {
    file,
    previewUrl,
    progress,
    uploading,
    error,
    success,
    selectFile,
    onInputChange,
    clear,
    setProgress,
    beginUpload,
    finishUpload,
  };
}
