import { Suspense } from "react";
import { redirect } from "next/navigation";
import SignForm from "@/components/sign/form";
import { auth } from "@/auth";
import FaceRatingSiteHeader from "@/components/face-rating/site-header";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl: string | undefined }>;
}) {
  const { callbackUrl } = await searchParams;
  const session = await auth();
  const next =
    callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/";

  if (session?.user?.uuid) {
    if (!session.user.onboarded) {
      redirect(`/auth/onboarding?next=${encodeURIComponent(next)}`);
    }
    redirect(next);
  }

  return (
    <div
      className="flex min-h-svh flex-col bg-white"
      style={{ color: "#0a0a0a", colorScheme: "light" }}
      data-theme="light"
    >
      <FaceRatingSiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <Suspense
          fallback={
            <div className="text-sm text-[#737373]">Loading…</div>
          }
        >
          <SignForm />
        </Suspense>
      </main>
    </div>
  );
}
