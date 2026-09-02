/**
 * Visual system — AudioCleaner grammar, image to cad product.
 * White paper, Lexend, lilac accent #8882F5, 16px rounded wells.
 */

export const V = {
  bg: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceAlt: "#F7F6FF",
  ink: "#111827",
  inkSoft: "#334155",
  muted: "#606266",
  line: "#EAEAEA",
  accent: "#8882F5",
  accentHover: "#726BE8",
  accentDeep: "#5B54C8",
  accentSoft: "#A39EF8",
  accentItalic: "#8882F5",
  accentTint: "#EEEDFE",
  accentBand: "#F4F3FF",
  drop: "#4A4588",
  dropInner: "rgba(136, 130, 245, 0.12)",
  dash: "rgba(136, 130, 245, 0.55)",
  promo: "#8882F5",
  star: "#F5B942",

  darkBg: "#1B1638",
  darkSurface: "#2A2452",
  darkSurfaceAlt: "#241E46",
  darkLine: "rgba(255,255,255,0.10)",
  darkInk: "#FFFFFF",
  darkMuted: "rgba(255,255,255,0.72)",

  radiusLg: "16px",
  radiusMd: "12px",
  radiusSm: "8px",
  radiusBtn: "10px",

  max: "1180px",
} as const;

export const btnPrimary =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#8882F5] px-5 text-[15px] font-semibold text-white shadow-[0_8px_20px_-10px_rgba(136,130,245,0.8)] transition-colors duration-200 hover:bg-[#726BE8] sm:h-12 sm:px-6";

export const btnSecondary =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-[#EAEAEA] bg-white px-5 text-[15px] font-semibold text-[#111827] transition-colors duration-200 hover:bg-[#F7F6FF] sm:h-12 sm:px-6";

export const btnPrimaryOnDark =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#8882F5] px-5 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-[#726BE8] sm:h-12 sm:px-7";

export const btnGhostOnDark =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-white/25 bg-transparent px-5 text-[15px] font-semibold text-white/90 transition-colors duration-200 hover:border-white/50 hover:text-white sm:h-12 sm:px-7";
