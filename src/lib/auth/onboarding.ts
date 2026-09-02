export const WORK_ROLES = [
  { id: "architect", label: "Architect or interior designer" },
  { id: "product", label: "Product designer or engineer" },
  { id: "patent", label: "Patent attorney or IP professional" },
  { id: "fashion", label: "Fashion or footwear designer" },
  { id: "illustrator", label: "Illustrator or graphic designer" },
  { id: "museum", label: "Museum, archaeology or conservation" },
  { id: "maker", label: "Maker, crafter or hobbyist" },
  { id: "craft", label: "Craft or fabrication business" },
  { id: "other", label: "Just exploring or other" },
] as const;

export const TEAM_SIZES = [
  { id: "solo", label: "Just me" },
  { id: "small", label: "Small team (2–10)" },
  { id: "large", label: "Larger company or organization (11+)" },
] as const;
