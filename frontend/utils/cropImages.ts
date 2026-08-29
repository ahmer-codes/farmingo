import cropsImg from "~/assets/crops.jpeg";
import healthyWheatImg from "~/assets/healthy-wheat.jpeg";
import badCornImg from "~/assets/bad-corn-crop.jpeg";
import healthyCropImg from "~/assets/healthy-crop.jpeg";
import healthyVegesImg from "~/assets/healthy-veges.jpeg";
import sowingImg from "~/assets/sowing.jpeg";
import farmSectionBgImg from "~/assets/section-bg2.jpeg";
import headerBgImg from "~/assets/header-bg.jpg";
import diseasedCropImg from "~/assets/diseased-crop.jpeg";
import badCropLeavesImg from "~/assets/bad-crop-leaves.jpg";
import insectedCropImg from "~/assets/insected-crop.jpeg";
import potatoLeafBlightImg from "~/assets/Potato-leaf-blight.webp";
import whiteflyCropImg from "~/assets/sundhi-whitefly-crop.jpeg";
import whitefliesLeafImg from "~/assets/whiteflies-whitefly-whiteflies-on-leaf-shutterstock-com_15881.jpg";
import weatherBgImg from "~/assets/weather.jpeg";
import weather2Img from "~/assets/weather2.jpeg";
import differentWeathersImg from "~/assets/different-weathers.jpeg";
import sunnyWeatherImg from "~/assets/sunny-weather.jpeg";
import hotWeatherImg from "~/assets/hot-weather.jpeg";
import stormWeatherImg from "~/assets/storm-weather.jpeg";
import yieldBgImg from "~/assets/yield-bg.jpeg";
import topHeaderBgImg from "~/assets/top-header-bg.jpg";
import farmerUsingFertilizerImg from "~/assets/farmer-using-fertilizer.jpeg";
import happyFarmerImg from "~/assets/happy-farmer.png";
import farmerAdminImg from "~/assets/farmer-admin.jpg";

const CROP_IMAGE_MAP: Record<string, string> = {
  wheat: healthyWheatImg,
  rice: cropsImg,
  corn: badCornImg,
  maize: badCornImg,
  cotton: healthyCropImg,
  potato: healthyVegesImg,
  tomato: healthyVegesImg,
  vegetable: healthyVegesImg,
  vegetables: healthyVegesImg,
  sugarcane: healthyCropImg,
  soybean: healthyCropImg,
  pulses: healthyVegesImg,
};

/** Resolve a crop name to a professional agricultural image. */
export function cropImageFor(name: string): string {
  const key = name.trim().toLowerCase();
  for (const [pattern, src] of Object.entries(CROP_IMAGE_MAP)) {
    if (key.includes(pattern)) return src;
  }
  return healthyCropImg;
}

export const farmHeroImage = farmSectionBgImg;
export const dashboardHeroImage = headerBgImg;
export const emptyFarmImage = sowingImg;
export const emptyCropImage = sowingImg;
export const diseaseHeroImage = badCropLeavesImg;
export const diseaseSectionImages = {
  hero: badCropLeavesImg,
  cropStep: diseasedCropImg,
  imageStep: insectedCropImg,
  symptomsStep: potatoLeafBlightImg,
  analysisStep: whiteflyCropImg,
  resultPrimary: badCornImg,
  resultSymptoms: badCropLeavesImg,
  resultRisk: whitefliesLeafImg,
  resultActions: potatoLeafBlightImg,
  resultAlternatives: insectedCropImg,
} as const;

const DISEASE_IMAGE_FALLBACK = diseasedCropImg;

/** Match disease or symptom labels to the closest diseased-plant asset. */
const DISEASE_IMAGE_PATTERNS: Array<[string, string]> = [
  ["leaf blight", potatoLeafBlightImg],
  ["blight", potatoLeafBlightImg],
  ["whitefly", whiteflyCropImg],
  ["white fly", whiteflyCropImg],
  ["sundhi", whiteflyCropImg],
  ["whiteflies", whitefliesLeafImg],
  ["insect", insectedCropImg],
  ["pest", insectedCropImg],
  ["borer", insectedCropImg],
  ["aphid", insectedCropImg],
  ["rust", badCropLeavesImg],
  ["leaf spot", badCropLeavesImg],
  ["leaf", badCropLeavesImg],
  ["corn", badCornImg],
  ["maize", badCornImg],
  ["potato", potatoLeafBlightImg],
];

export function diseaseImageFor(
  label: string,
  symptoms: string[] = [],
): string {
  const haystack = [label, ...symptoms].join(" ").trim().toLowerCase();
  if (!haystack) return DISEASE_IMAGE_FALLBACK;

  for (const [pattern, src] of DISEASE_IMAGE_PATTERNS) {
    if (haystack.includes(pattern)) return src;
  }

  return DISEASE_IMAGE_FALLBACK;
}

export const weatherHeroImage = sunnyWeatherImg;
export const weatherSectionImages = {
  hero: sunnyWeatherImg,
  current: weather2Img,
  risks: stormWeatherImg,
  recommendations: hotWeatherImg,
  hourly: differentWeathersImg,
  daily: weatherBgImg,
  default: weatherBgImg,
} as const;
export const yieldHeroImage = yieldBgImg;
export const analyticsHeroImage = yieldBgImg;
export const topHeaderBgImage = topHeaderBgImg;
export const tasksHeroImage = farmerUsingFertilizerImg;
export const tasksClearDayImage = happyFarmerImg;
export const tasksUpcomingEmptyImage = farmerAdminImg;
