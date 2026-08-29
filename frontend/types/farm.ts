export type CropHealthStatus = "healthy" | "watch" | "at_risk" | "diseased";

export interface Crop {
  id: string;
  name: string;
  variety?: string;
  fieldName: string;
  areaHa: number;
  plantingDate: string;
  expectedHarvestDate?: string;
  healthStatus: CropHealthStatus;
  expectedYieldKg?: number;
  actualYieldKg?: number;
}

export interface FarmOverview {
  farmId: string;
  farmName: string;
  cropCount: number;
  healthyCount: number;
  atRiskCount: number;
  pendingTasks: number;
  openAlerts: number;
}

export interface NavItem {
  label: string;
  to: string;
  icon: string;
  description?: string;
}
