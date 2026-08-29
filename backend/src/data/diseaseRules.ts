/**
 * Deterministic mock disease knowledge base.
 * Replace scoring with ML model outputs later, keep response shape stable.
 */

export type SeverityLevel = "low" | "moderate" | "high" | "critical";

export interface DiseaseRule {
  id: string;
  name: string;
  cropIds: string[];
  /** Symptom ids that support this condition */
  symptomWeights: Record<string, number>;
  severity: SeverityLevel;
  summary: string;
  recommendedActions: string[];
  prevention: string[];
  expectedRisk: string;
  reassessmentGuidance: string;
}

export const DISEASE_RULES: DiseaseRule[] = [
  {
    id: "tomato-early-blight",
    name: "Early Blight",
    cropIds: ["tomato", "potato"],
    symptomWeights: {
      "leaf-brown-spots": 3,
      "leaf-yellow": 2,
      "leaf-lower-affected": 3,
      "leaf-blight-pattern": 4,
      "leaf-discoloration": 1,
      "fruit-spots": 2,
      "gen-reduced-yield": 1,
    },
    severity: "moderate",
    summary:
      "Pattern of brown leaf spots with yellowing, often starting on lower leaves, is consistent with early blight pressure.",
    recommendedActions: [
      "Remove heavily affected leaves and dispose of them away from the field.",
      "Improve air circulation by pruning dense canopy growth.",
      "Avoid unnecessary overhead irrigation; water at the base when possible.",
      "Monitor neighbouring plants for similar leaf symptoms.",
    ],
    prevention: [
      "Maintain recommended plant spacing for airflow.",
      "Remove infected plant debris after harvest.",
      "Monitor humidity and leaf wetness during warm spells.",
      "Rotate solanaceous crops where practical.",
    ],
    expectedRisk:
      "Moderate risk of canopy loss and fruit spotting if humidity stays high and no canopy sanitation is done.",
    reassessmentGuidance:
      "Reassess in 3–5 days after removing affected leaves and adjusting irrigation.",
  },
  {
    id: "tomato-late-blight",
    name: "Late Blight (possible)",
    cropIds: ["tomato", "potato"],
    symptomWeights: {
      "leaf-wilting": 2,
      "leaf-brown-spots": 2,
      "leaf-discoloration": 2,
      "stem-lesions": 3,
      "stem-blackening": 3,
      "fruit-rot": 3,
      "gen-sudden-wilting": 3,
    },
    severity: "high",
    summary:
      "Rapid wilting with stem darkening and fruit rot can indicate late blight risk, especially in cool, wet conditions.",
    recommendedActions: [
      "Isolate heavily affected plants if practical.",
      "Avoid working the crop while foliage is wet.",
      "Improve drainage and reduce prolonged leaf wetness.",
      "Seek local extension advice promptly if spread accelerates.",
    ],
    prevention: [
      "Prefer resistant varieties when available.",
      "Avoid overhead irrigation late in the day.",
      "Scout regularly during cool, humid weather.",
    ],
    expectedRisk:
      "High yield and quality loss if unchecked during favourable weather for blight.",
    reassessmentGuidance:
      "Reassess within 24–48 hours; escalate if new lesions appear overnight.",
  },
  {
    id: "wheat-leaf-rust",
    name: "Leaf Rust",
    cropIds: ["wheat"],
    symptomWeights: {
      "leaf-brown-spots": 3,
      "leaf-yellow": 2,
      "leaf-discoloration": 2,
      "gen-reduced-yield": 2,
      "gen-slow-growth": 1,
    },
    severity: "moderate",
    summary:
      "Brown and yellow leaf markings on wheat often align with rust-like foliar disease pressure.",
    recommendedActions: [
      "Scout across the field to estimate incidence, not just one plant.",
      "Prioritize protective fungicide timing if recommended for your variety and stage.",
      "Avoid late nitrogen that extends green leaf too long in high-pressure seasons.",
    ],
    prevention: [
      "Choose rust-tolerant varieties when possible.",
      "Destroy volunteer wheat that harbours inoculum.",
      "Monitor regional rust advisories.",
    ],
    expectedRisk:
      "Moderate grain fill reduction if infection expands during grain filling.",
    reassessmentGuidance:
      "Reassess in 5–7 days or after the next weather change.",
  },
  {
    id: "cotton-whitefly-stress",
    name: "Whitefly / sucking pest stress",
    cropIds: ["cotton"],
    symptomWeights: {
      "leaf-yellow": 2,
      "leaf-curling": 3,
      "leaf-white-spots": 2,
      "leaf-holes": 1,
      "gen-poor-flowering": 2,
      "gen-reduced-yield": 2,
      "gen-slow-growth": 1,
    },
    severity: "moderate",
    summary:
      "Yellowing and curling with poor flowering on cotton commonly follows sucking pest pressure such as whitefly.",
    recommendedActions: [
      "Scout undersides of leaves for nymphs and adults.",
      "Avoid broad, untargeted sprays that harm beneficial insects.",
      "Support plant recovery with balanced irrigation; avoid water stress.",
    ],
    prevention: [
      "Keep field edges and weeds managed.",
      "Rotate chemistries if chemical control is advised locally.",
      "Encourage beneficial insects where possible.",
    ],
    expectedRisk:
      "Moderate lint quality and boll retention risk if populations stay high.",
    reassessmentGuidance: "Reassess after 3 days of scouting counts.",
  },
  {
    id: "rice-blast",
    name: "Rice Blast (possible)",
    cropIds: ["rice"],
    symptomWeights: {
      "leaf-brown-spots": 3,
      "leaf-discoloration": 2,
      "stem-lesions": 2,
      "stem-weak": 2,
      "gen-reduced-yield": 2,
      "leaf-wilting": 1,
    },
    severity: "high",
    summary:
      "Leaf lesions with stem weakness in rice can indicate blast risk under humid conditions.",
    recommendedActions: [
      "Avoid excessive nitrogen that softens tissue.",
      "Maintain balanced water management; avoid prolonged stress cycles.",
      "Consult local guidance for blast-prone varieties and stages.",
    ],
    prevention: [
      "Use resistant varieties where available.",
      "Balance fertilizer; avoid lush, overly dense stands.",
      "Scout after humid, cloudy stretches.",
    ],
    expectedRisk: "High panicle and yield risk if neck blast develops.",
    reassessmentGuidance: "Reassess in 2–4 days during humid weather.",
  },
  {
    id: "corn-leaf-blight",
    name: "Leaf Blight",
    cropIds: ["corn"],
    symptomWeights: {
      "leaf-brown-spots": 3,
      "leaf-yellow": 2,
      "leaf-discoloration": 2,
      "leaf-blight-pattern": 3,
      "gen-reduced-yield": 1,
    },
    severity: "moderate",
    summary:
      "Elongated brown lesions and yellowing on maize leaves are consistent with foliar blight pressure.",
    recommendedActions: [
      "Confirm distribution across the field, not only field edges.",
      "Reduce prolonged leaf wetness where irrigation is controllable.",
      "Plan harvest timing if upper leaves are heavily damaged near maturity.",
    ],
    prevention: [
      "Rotate crops and bury residue when practical.",
      "Choose hybrids with better blight tolerance.",
      "Avoid overly dense planting that traps humidity.",
    ],
    expectedRisk:
      "Moderate photosynthetic loss if upper canopy becomes heavily lesioned.",
    reassessmentGuidance: "Reassess in about one week.",
  },
  {
    id: "onion-foliar-blight",
    name: "Foliar blight / purple blotch type issue",
    cropIds: ["onion"],
    symptomWeights: {
      "leaf-discoloration": 3,
      "leaf-brown-spots": 2,
      "leaf-wilting": 2,
      "stem-lesions": 1,
      "gen-slow-growth": 1,
    },
    severity: "moderate",
    summary:
      "Leaf discoloration and spotting on onion often follows humid foliar disease pressure.",
    recommendedActions: [
      "Improve airflow by avoiding overcrowding.",
      "Water early in the day so foliage dries.",
      "Remove severely damaged outer leaves if practical.",
    ],
    prevention: [
      "Avoid overhead irrigation late in the day.",
      "Rotate alliums when possible.",
      "Keep weeds down to reduce humidity pockets.",
    ],
    expectedRisk: "Moderate bulb quality risk if leaf area declines early.",
    reassessmentGuidance: "Reassess in 4–6 days.",
  },
  {
    id: "sugarcane-mosaic-stress",
    name: "Mosaic / viral stress (possible)",
    cropIds: ["sugarcane"],
    symptomWeights: {
      "leaf-discoloration": 3,
      "leaf-yellow": 2,
      "leaf-white-spots": 2,
      "gen-slow-growth": 3,
      "gen-reduced-yield": 2,
    },
    severity: "moderate",
    summary:
      "Patchy leaf discoloration with slow growth in sugarcane may indicate mosaic-type stress.",
    recommendedActions: [
      "Compare affected clumps with healthy neighbouring stools.",
      "Avoid using planting material from symptomatic stools.",
      "Control aphids and other vectors as advised locally.",
    ],
    prevention: [
      "Use clean seed cane from trusted sources.",
      "Rogue severely affected stools where feasible.",
      "Maintain balanced nutrition to reduce stress.",
    ],
    expectedRisk:
      "Moderate stand and sugar recovery risk if infected planting material spreads.",
    reassessmentGuidance: "Reassess new tillers over the next 1–2 weeks.",
  },
  {
    id: "generic-nutrient-stress",
    name: "Nutrient or water stress",
    cropIds: [
      "wheat",
      "rice",
      "corn",
      "cotton",
      "tomato",
      "potato",
      "onion",
      "sugarcane",
    ],
    symptomWeights: {
      "leaf-yellow": 2,
      "gen-slow-growth": 3,
      "gen-poor-flowering": 2,
      "gen-reduced-yield": 2,
      "leaf-curling": 1,
      "stem-weak": 1,
    },
    severity: "low",
    summary:
      "Yellowing with slow growth and weak flowering can reflect nutrient imbalance or water stress rather than a primary pathogen.",
    recommendedActions: [
      "Check recent irrigation timing and soil moisture at root depth.",
      "Review fertilizer history for the current growth stage.",
      "Rule out drainage problems in low spots.",
    ],
    prevention: [
      "Match fertilizer timing to crop stage.",
      "Irrigate based on soil moisture, not calendar alone.",
      "Keep records of field-level variation.",
    ],
    expectedRisk:
      "Lower immediate plant death risk, but yield may drift if stress continues.",
    reassessmentGuidance:
      "Reassess after correcting moisture or nutrition, typically within a week.",
  },
];
