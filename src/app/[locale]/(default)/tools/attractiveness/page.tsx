import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false, follow: false },
};

/** Leftover Face Rating slug — 404 instead of redirecting to another Face Rating URL. */
export default function AttractivenessRedirect() {
  notFound();
}
