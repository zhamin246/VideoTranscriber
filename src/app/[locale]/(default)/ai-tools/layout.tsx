import type { Metadata } from "next";

/** Ensures /ai-tools emits `noindex, follow` in HTML (directory hub, not for organic landing). */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
};

export default function AiToolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}