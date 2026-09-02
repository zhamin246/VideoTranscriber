import type { Metadata } from "next";
import FaceRatingDashboardPage from "@/components/face-rating/dashboard-page";

export const metadata: Metadata = {
  title: "Dashboard | image to cad",
  description: "Your saved photo-to-vector conversions.",
  robots: { index: false, follow: false },
};

export default async function DashboardRoutePage({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const paid = params.paid === "1" || params.paid === "true";
  const initialTab =
    params.tab === "credits"
      ? "credits"
      : params.tab === "orders" || paid
        ? "orders"
        : "history";
  return <FaceRatingDashboardPage paid={paid} initialTab={initialTab} />;
}
