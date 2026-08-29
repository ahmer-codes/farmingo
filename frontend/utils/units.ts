/** Shared display helpers so farm area units stay consistent across pages. */

export function formatArea(
  areaHa: number,
  preferredUnit: "hectares" | "acres" = "hectares",
): { value: string; unit: string; label: string } {
  if (preferredUnit === "acres") {
    const acres = areaHa / 0.404686;
    return {
      value: acres.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      unit: "ac",
      label: `${acres.toLocaleString(undefined, { maximumFractionDigits: 2 })} ac`,
    };
  }
  return {
    value: areaHa.toLocaleString(undefined, { maximumFractionDigits: 2 }),
    unit: "ha",
    label: `${areaHa.toLocaleString(undefined, { maximumFractionDigits: 2 })} ha`,
  };
}

export function formatTemperatureC(
  celsius: number,
  unit: "celsius" | "fahrenheit" = "celsius",
): string {
  if (unit === "fahrenheit") {
    const f = (celsius * 9) / 5 + 32;
    return `${Math.round(f)}°F`;
  }
  return `${Math.round(celsius)}°C`;
}
