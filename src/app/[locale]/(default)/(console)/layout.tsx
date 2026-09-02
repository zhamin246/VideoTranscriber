import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { ReactNode } from "react";

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
