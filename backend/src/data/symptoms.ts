export type SymptomCategory = "leaf" | "stem" | "fruit" | "general";

export interface SymptomDefinition {
  id: string;
  label: string;
  category: SymptomCategory;
  keywords?: string[];
}

export const SYMPTOM_CATALOG: SymptomDefinition[] = [
  // Leaf
  {
    id: "leaf-yellow",
    label: "Yellow leaves",
    category: "leaf",
    keywords: ["chlorosis", "yellowing"],
  },
  { id: "leaf-brown-spots", label: "Brown spots", category: "leaf" },
  { id: "leaf-white-spots", label: "White spots", category: "leaf" },
  { id: "leaf-curling", label: "Curling leaves", category: "leaf" },
  { id: "leaf-holes", label: "Holes in leaves", category: "leaf" },
  { id: "leaf-wilting", label: "Wilting", category: "leaf" },
  { id: "leaf-discoloration", label: "Leaf discoloration", category: "leaf" },
  {
    id: "leaf-lower-affected",
    label: "Lower leaves affected first",
    category: "leaf",
  },
  {
    id: "leaf-blight-pattern",
    label: "Concentric leaf lesions",
    category: "leaf",
  },

  // Stem
  { id: "stem-lesions", label: "Stem lesions", category: "stem" },
  { id: "stem-blackening", label: "Blackening", category: "stem" },
  { id: "stem-cracking", label: "Cracking", category: "stem" },
  { id: "stem-weak", label: "Weak stem", category: "stem" },

  // Fruit
  { id: "fruit-spots", label: "Fruit spots", category: "fruit" },
  { id: "fruit-rot", label: "Fruit rot", category: "fruit" },
  { id: "fruit-abnormal", label: "Abnormal growth", category: "fruit" },
  {
    id: "fruit-discoloration",
    label: "Fruit discoloration",
    category: "fruit",
  },

  // General
  { id: "gen-slow-growth", label: "Slow growth", category: "general" },
  { id: "gen-sudden-wilting", label: "Sudden wilting", category: "general" },
  { id: "gen-poor-flowering", label: "Poor flowering", category: "general" },
  { id: "gen-reduced-yield", label: "Reduced yield", category: "general" },
];

export const SYMPTOM_CATEGORY_LABELS: Record<SymptomCategory, string> = {
  leaf: "Leaf",
  stem: "Stem",
  fruit: "Fruit",
  general: "General",
};
