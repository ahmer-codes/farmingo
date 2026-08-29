<template>
  <div class="space-y-3">
    <div
      class="relative rounded-md border border-dashed px-4 py-8 text-center transition-colors"
      :class="
        dragOver ? 'border-brand-500 bg-brand-50' : 'border-line bg-canvas/60'
      "
      @dragover.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="onDrop"
    >
      <template v-if="!previewUrl">
        <p class="text-sm font-semibold text-ink">
          Upload or drop a crop image
        </p>
        <p class="type-helper mt-1">JPEG, PNG, or WebP · max {{ maxMb }} MB</p>
        <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
          <label
            class="inline-flex cursor-pointer items-center gap-2 rounded-md bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <UiAppIcon name="upload" size="sm" />
            Choose file
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              @change="onFileInput"
            />
          </label>
          <label
            class="inline-flex cursor-pointer items-center gap-2 rounded-md border border-line bg-white px-3.5 py-2 text-sm font-semibold text-ink hover:bg-surface-muted"
          >
            <UiAppIcon name="camera" size="sm" />
            Use camera
            <input
              type="file"
              accept="image/*"
              capture="environment"
              class="hidden"
              @change="onFileInput"
            />
          </label>
        </div>
      </template>

      <div v-else class="mx-auto max-w-md">
        <img
          :src="previewUrl"
          alt="Selected crop"
          class="mx-auto max-h-64 rounded-md object-contain"
        />
        <div class="mt-3 flex justify-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-1.5 text-sm font-semibold text-ink hover:bg-surface-muted"
            @click="replace"
          >
            <UiAppIcon name="upload" size="sm" />
            Replace
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md border border-danger/30 bg-danger-soft px-3 py-1.5 text-sm font-semibold text-danger hover:bg-danger-soft/80"
            @click="remove"
          >
            <UiAppIcon name="trash-2" size="sm" />
            Remove
          </button>
        </div>
        <p v-if="meta" class="type-helper mt-2">
          {{ meta.fileName }} · {{ formatBytes(meta.sizeBytes) }}
          <span v-if="meta.width && meta.height">
            · {{ meta.width }}×{{ meta.height }}</span
          >
        </p>
      </div>
    </div>
    <p v-if="error" class="text-xs text-danger">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import type { ImageMeta } from "~/types";

const props = withDefaults(
  defineProps<{
    modelValue: ImageMeta | null;
    previewUrl?: string | null;
    maxMb?: number;
  }>(),
  { maxMb: 5, previewUrl: null },
);

const emit = defineEmits<{
  "update:modelValue": [value: ImageMeta | null];
  "update:previewUrl": [value: string | null];
  "file-selected": [file: File | null];
}>();

const dragOver = ref(false);
const error = ref("");
const fileInput = ref<HTMLInputElement | null>(null);

const allowed = ["image/jpeg", "image/png", "image/webp"];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function readDimensions(
  file: File,
): Promise<{ width?: number; height?: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Invalid image"));
      el.src = url;
    });
    return { width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function acceptFile(file: File) {
  error.value = "";
  if (!allowed.includes(file.type)) {
    error.value = "Use a JPEG, PNG, or WebP image.";
    return;
  }
  const maxBytes = props.maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    error.value = `Image must be under ${props.maxMb} MB.`;
    return;
  }

  let dims: { width?: number; height?: number } = {};
  try {
    dims = await readDimensions(file);
    if ((dims.width || 0) < 200 || (dims.height || 0) < 200) {
      error.value =
        "Image is too small. Use at least 200×200 pixels for a clearer leaf/crop view.";
      return;
    }
  } catch {
    error.value = "Could not read this image file.";
    return;
  }

  const preview = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Read failed"));
    reader.readAsDataURL(file);
  });

  emit("update:previewUrl", preview);
  emit("update:modelValue", {
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    width: dims.width,
    height: dims.height,
  });
  emit("file-selected", file);
  dragOver.value = false;
}

function onFileInput(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) void acceptFile(file);
  (event.target as HTMLInputElement).value = "";
}

function onDrop(event: DragEvent) {
  dragOver.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) void acceptFile(file);
}

function remove() {
  emit("update:modelValue", null);
  emit("update:previewUrl", null);
  emit("file-selected", null);
  error.value = "";
}

function replace() {
  fileInput.value?.click();
}
</script>
