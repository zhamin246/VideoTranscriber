/**
 * Persist free-scan results in sessionStorage for /results and /report pages.
 * Prefer data: URLs for previewUrl — blob: dies after Stripe redirect / reload.
 * Use previewUrlForStorage / hardenScanPreviewInSession before checkout.
 */

export type StoredScanResult = {
  id: string;
  createdAt: number;
  src: string;
  score: number;
  components: {
    symmetry: number;
    thirds: number;
    fifths: number;
    golden: number;
  };
  previewUrl: string;
  landmarks?: { x: number; y: number; z?: number }[];
  imageWidth?: number;
  imageHeight?: number;
  detail?: {
    goldenRatio: number;
    thirds: { upper: number; middle: number; lower: number };
    fifths: number[];
    featureSymmetry?: {
      eye: number;
      eyebrow: number;
      nose: number;
      mouth: number;
      jaw: number;
    };
  };
  faceShape?: string;
  /** Full Face Report unlocked (skip-pay MVP or post-payment). */
  unlocked?: boolean;
  unlockedAt?: number;
  unlockEmail?: string | null;
};

const PREFIX = "face-rating:scan:";
const LAST_KEY = "face-rating:last-scan-id";
const UNLOCK_PREFIX = "face-rating:unlocked:";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function saveScanResult(
  data: Omit<StoredScanResult, "id" | "createdAt">
): string {
  if (typeof window === "undefined") return "";
  const id = uuid();
  const payload: StoredScanResult = {
    ...data,
    id,
    createdAt: Date.now(),
  };
  try {
    sessionStorage.setItem(PREFIX + id, JSON.stringify(payload));
    sessionStorage.setItem(LAST_KEY, id);
  } catch {
    /* quota / private mode */
  }
  return id;
}

export function loadScanResult(id: string): StoredScanResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PREFIX + id);
    if (!raw) return null;
    return JSON.parse(raw) as StoredScanResult;
  } catch {
    return null;
  }
}

export function loadLastScanResult(): StoredScanResult | null {
  if (typeof window === "undefined") return null;
  const id = sessionStorage.getItem(LAST_KEY);
  if (!id) return null;
  return loadScanResult(id);
}

/** Persist full-report unlock for this browser session (no Stripe yet). */
export function markScanUnlocked(
  id: string,
  opts?: { email?: string | null }
): StoredScanResult | null {
  if (typeof window === "undefined" || !id) return null;
  const existing = loadScanResult(id);
  if (!existing) {
    // Still record unlock key so a late-loaded scan can merge if needed
    try {
      sessionStorage.setItem(
        UNLOCK_PREFIX + id,
        JSON.stringify({ at: Date.now(), email: opts?.email ?? null })
      );
    } catch {
      /* ignore */
    }
    return null;
  }
  const next: StoredScanResult = {
    ...existing,
    unlocked: true,
    unlockedAt: Date.now(),
    unlockEmail: opts?.email ?? existing.unlockEmail ?? null,
  };
  try {
    sessionStorage.setItem(PREFIX + id, JSON.stringify(next));
    sessionStorage.setItem(LAST_KEY, id);
    sessionStorage.setItem(
      UNLOCK_PREFIX + id,
      JSON.stringify({ at: next.unlockedAt, email: next.unlockEmail })
    );
  } catch {
    /* quota */
  }
  return next;
}

export function isScanUnlocked(id: string): boolean {
  if (typeof window === "undefined" || !id) return false;
  const data = loadScanResult(id);
  if (data?.unlocked) return true;
  try {
    return Boolean(sessionStorage.getItem(UNLOCK_PREFIX + id));
  } catch {
    return false;
  }
}

/** Simple shape label from length/width for free preview (not a full classifier). */
export function estimateFaceShape(goldenRatio: number): string {
  // Keep in sync with estimateFaceShapeFromRatio in face-shape.ts
  // Apply same ~7% hairline compensation; Heart never from ratio alone.
  const hw = Math.round(goldenRatio * 1.07 * 100) / 100;
  if (hw >= 1.45) return "Oblong";
  if (hw >= 1.2) return "Oval";
  if (hw >= 1.12) return "Round";
  return "Square";
}

export function scoreBand(score: number): string {
  if (score >= 87) return "Excellent";
  if (score >= 78) return "Good";
  if (score >= 68) return "Balanced";
  if (score >= 55) return "Mixed";
  return "Developing";
}

export function tierFromScore(score: number): {
  name: string;
  blurb: string;
} {
  if (score >= 87)
    return {
      name: "Showstopper",
      blurb: "Closest alignment across this tool’s four geometry components.",
    };
  if (score >= 83)
    return {
      name: "Standout",
      blurb: "Strong measured harmony, with only modest variation across components.",
    };
  if (score >= 78)
    return {
      name: "Glow Up",
      blurb: "Above-average balance with clear levers to push higher.",
    };
  if (score >= 60)
    return {
      name: "Rising",
      blurb: "Solid foundation, clear room to push higher.",
    };
  return {
    name: "Foundation",
    blurb: "Distinctive features — biggest upside potential.",
  };
}
