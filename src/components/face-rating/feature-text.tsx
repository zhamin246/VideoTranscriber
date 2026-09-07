"use client";

import type { ReactNode } from "react";

/**
 * Emphasize key metrics in pricing feature lines (videotranscriber.ai style):
 * - Primary values (minutes, $, Unlimited) → bold + accent blue
 * - Secondary keywords (Best, 200+) → bold only
 */
export function FeatureText({
  text,
  accent = "#1C6CFB",
}: {
  text: string;
  accent?: string;
}) {
  const nodes = emphasizeFeatureText(text, accent);
  return <>{nodes}</>;
}

function emphasizeFeatureText(text: string, accent: string): ReactNode[] {
  // Capture: $amounts, numbers with optional +/comma, optional unit, Unlimited, Best
  const re =
    /(\$\s?[\d,]+(?:\.\d+)?|\bUnlimited\b|\bBest\b|[\d,]+(?:\+)?(?:\s*(?:mins?|minutes|hours?))?)/gi;

  const out: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      out.push(text.slice(last, match.index));
    }
    const token = match[0];
    const isPrimary = isPrimaryMetric(token, text, match.index);
    if (isPrimary) {
      out.push(
        <span key={key++} className="font-bold" style={{ color: accent }}>
          {token}
        </span>,
      );
    } else {
      out.push(
        <span key={key++} className="font-bold">
          {token}
        </span>,
      );
    }
    last = match.index + token.length;
  }

  if (last < text.length) out.push(text.slice(last));
  if (out.length === 0) out.push(text);
  return out;
}

function isPrimaryMetric(token: string, full: string, index: number): boolean {
  const t = token.trim();
  if (/^unlimited$/i.test(t)) return true;
  if (/^\$/.test(t)) return true;
  // Minute / hour allotments and counts in the lead feature lines
  if (/\d/.test(t) && /(min|hour)/i.test(t)) return true;
  // Bare numbers that are the plan allotment at start: "1,200 minutes / month"
  if (/^[\d,]+(\+)?$/.test(t)) {
    const after = full.slice(index + token.length, index + token.length + 24);
    if (/^\s*(minutes?|mins?|hours?|extra|audios?|videos?|files?|languages?)/i.test(after)) {
      return true;
    }
    // "200+" languages etc. — bold only (secondary)
    if (/\+$/.test(t)) return false;
    // Leading allotment number before " minutes"
    const before = full.slice(0, index);
    if (before.trim() === "" || /^(up to|each file up to)\s*$/i.test(before.trim())) {
      return true;
    }
    // "$10 per 500 extra" — the 500
    if (/per\s*$/i.test(before)) return true;
    return false;
  }
  if (/^best$/i.test(t)) return false; // bold only
  return false;
}
