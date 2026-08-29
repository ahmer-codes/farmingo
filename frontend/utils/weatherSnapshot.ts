import type { RecommendedAction, WeatherSnapshot } from "~/types/dashboard";
import type { WeatherCurrentPayload } from "~/types/weather";

function formatHourLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** Canonical transform: backend current weather payload → dashboard snapshot. */
export function weatherPayloadToSnapshot(
  payload: WeatherCurrentPayload,
): WeatherSnapshot {
  return {
    location: [
      payload.location.farmLocation || payload.location.label,
      payload.location.region,
    ]
      .filter(Boolean)
      .join(", "),
    temperatureC: payload.current.temperatureC,
    feelsLikeC: payload.current.feelsLikeC,
    condition: payload.current.condition,
    humidityPercent: payload.current.humidityPercent,
    windKph: payload.current.windKph,
    rainfallMm: payload.current.rainfallMm,
    rainProbabilityPercent: payload.current.precipitationProbabilityPercent,
    forecastHighC: payload.today.highC,
    forecastLowC: payload.today.lowC,
    riskNote: payload.risks[0]
      ? `${payload.risks[0].label}: ${payload.risks[0].detail}`
      : undefined,
    todayForecast: payload.hourlyPreview.slice(0, 4).map((h) => ({
      time: formatHourLabel(h.time),
      temperatureC: h.temperatureC,
      condition: h.condition,
    })),
    stale: payload.meta.stale,
    rateLimited: payload.meta.rateLimited,
  };
}

export function weatherPayloadToRecommendations(
  payload: WeatherCurrentPayload,
): RecommendedAction[] {
  return payload.recommendations.slice(0, 6).map((r) => {
    let urgency: RecommendedAction["urgency"] = "soon";
    if (r.severity === "critical") urgency = "now";
    else if (r.severity === "warning") urgency = "today";
    return {
      id: r.id,
      title: r.title,
      detail: r.recommendedAction,
      urgency,
      timing: r.timing,
      cropName: r.cropType,
      fieldName: r.fieldName,
      fieldId: r.fieldId,
      cropId: r.cropId,
      drivers: {
        weatherSignal: r.reason,
        cropContext: [r.cropType, r.growthStage, r.season]
          .filter(Boolean)
          .join(" · "),
      },
    };
  });
}
