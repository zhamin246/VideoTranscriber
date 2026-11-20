import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PRIVATE_ROBOTS } from "@/lib/seo/build-tool-page-metadata";

export const metadata: Metadata = {
  robots: PRIVATE_ROBOTS,
};

/** Old ShipAny/Face Rating console. Account pages live on /dashboard now. */
export default async function ConsoleLayout({
  children: _children,
}: {
  children: ReactNode;
}) {
  const pathname = (await headers()).get("x-pathname") || "";
  if (pathname.includes("/my-orders")) {
    redirect("/dashboard?tab=orders");
  }
  if (pathname.includes("/my-credits")) {
    redirect("/dashboard?tab=credits");
  }
  redirect("/dashboard");
}
