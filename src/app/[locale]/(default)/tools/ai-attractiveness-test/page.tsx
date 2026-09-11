import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false, follow: false },
};

/** Leftover Face Rating URL — 404 so it cannot be indexed as this product. */
export default function AiAttractivenessTestPage() {
  notFound();
}
