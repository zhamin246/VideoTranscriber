import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AUTH_ROBOTS } from "@/lib/seo/build-tool-page-metadata";

export const metadata: Metadata = {
  robots: AUTH_ROBOTS,
};

export default function AuthSegmentLayout({ children }: { children: ReactNode }) {
  return children;
}