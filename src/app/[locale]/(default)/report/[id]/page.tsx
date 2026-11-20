import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Not found",
};

/** Leftover Face Rating URL — 404 so it cannot be indexed as this product. */
export default function FullReportRoutePage() {
  notFound();
}
