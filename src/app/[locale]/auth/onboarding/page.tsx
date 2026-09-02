import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { findUserByUuid } from "@/models/user";
import OnboardingForm from "@/components/sign/onboarding-form";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next: nextParam } = await searchParams;
  const next =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("/auth/")
      ? nextParam
      : "/";

  const session = await auth();
  if (!session?.user?.uuid) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(next)}`);
  }

  const user = await findUserByUuid(session.user.uuid);
  if (!user) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(next)}`);
  }
  if (user.onboarded_at) {
    redirect(next);
  }

  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center bg-[#f7f5f2] px-4 py-12"
      data-theme="light"
    >
      <Suspense fallback={<div className="text-sm text-[#737373]">Loading…</div>}>
        <OnboardingForm defaultName={user.nickname || ""} />
      </Suspense>
    </div>
  );
}
