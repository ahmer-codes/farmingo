import { cropRepository, fieldRepository } from "../repositories";
import { ApiError } from "../utils/ApiError";
import {
  resolveCatalogCropId,
  supportedCatalogCropNames,
} from "../utils/catalogCropMapping";

export interface ResolvedCropContext {
  cropRecordId: string;
  fieldId: string;
  farmId: string;
  cropName: string;
  fieldName: string;
  variety?: string;
  catalogCropId: string;
}

export async function resolveCropContext(
  userId: string,
  cropRecordId: string,
  fieldId?: string,
): Promise<ResolvedCropContext> {
  const crop = await cropRepository.findByIdForUser(cropRecordId, userId);
  if (!crop) throw new ApiError(404, "Crop not found");

  const field = await fieldRepository.findByIdForUser(crop.fieldId, userId);
  if (!field) throw new ApiError(400, "Crop field not found");

  if (fieldId && fieldId !== crop.fieldId) {
    throw new ApiError(400, "Crop does not belong to the specified field");
  }

  if (crop.farmId !== field.farmId) {
    throw new ApiError(400, "Crop and field farm mismatch");
  }

  const catalogCropId = resolveCatalogCropId(crop.name, crop.variety);
  if (!catalogCropId) {
    throw new ApiError(
      422,
      `No disease catalog match for crop "${crop.name}". Supported crops: ${supportedCatalogCropNames()}.`,
    );
  }

  return {
    cropRecordId: crop.id,
    fieldId: field.id,
    farmId: crop.farmId,
    cropName: crop.name,
    fieldName: field.name,
    variety: crop.variety,
    catalogCropId,
  };
}
