export interface CropOption {
  id: string;
  name: string;
  aliases?: string[];
}

export const DISEASE_CROPS: CropOption[] = [
  { id: "wheat", name: "Wheat" },
  { id: "rice", name: "Rice" },
  { id: "corn", name: "Corn", aliases: ["Maize"] },
  { id: "cotton", name: "Cotton" },
  { id: "tomato", name: "Tomato" },
  { id: "potato", name: "Potato" },
  { id: "onion", name: "Onion" },
  { id: "sugarcane", name: "Sugarcane" },
];
