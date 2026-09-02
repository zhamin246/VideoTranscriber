export const CONVERT_STATUS_STEPS = [
  "Interpreting your image",
  "Designing the drawing",
  "Drafting outlines",
  "Tracing details",
  "Refining linework",
  "Final checks",
] as const;

export type ConvertStatusStep = (typeof CONVERT_STATUS_STEPS)[number];
