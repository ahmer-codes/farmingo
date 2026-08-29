import { DISEASE_CROPS } from "../data/crops";

const CATALOG_IDS = new Set(DISEASE_CROPS.map((c) => c.id));

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/** Map a user's crop name (and optional variety) to a disease catalog crop id. */
export function resolveCatalogCropId(
  name: string,
  variety?: string,
): string | null {
  const candidates = [name, variety].filter(Boolean).map((v) => normalize(v!));

  for (const candidate of candidates) {
    for (const crop of DISEASE_CROPS) {
      if (candidate === crop.id || candidate === normalize(crop.name))
        return crop.id;
      if (crop.aliases?.some((alias) => normalize(alias) === candidate))
        return crop.id;
    }
  }

  for (const candidate of candidates) {
    for (const crop of DISEASE_CROPS) {
      const hay = [crop.id, crop.name, ...(crop.aliases || [])]
        .map(normalize)
        .join(" ");
      if (candidate.includes(crop.id) || hay.includes(candidate))
        return crop.id;
    }
  }

  return null;
}

/** Resolve catalog id from legacy assessment records that only stored cropId. */
export function resolveLegacyCatalogCropId(
  cropId?: string,
  catalogCropId?: string,
): string | undefined {
  if (catalogCropId) return catalogCropId;
  if (cropId && CATALOG_IDS.has(cropId)) return cropId;
  return cropId || undefined;
}

export function catalogCropDisplayName(catalogCropId: string): string {
  return (
    DISEASE_CROPS.find((c) => c.id === catalogCropId)?.name || catalogCropId
  );
}

export function supportedCatalogCropNames(): string {
  return DISEASE_CROPS.map((c) => c.name).join(", ");
}
