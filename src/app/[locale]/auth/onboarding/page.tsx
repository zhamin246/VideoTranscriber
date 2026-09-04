import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Legacy route — onboarding questionnaire removed; bounce to destination. */
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

  redirect(next);
}
