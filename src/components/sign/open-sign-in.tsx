"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/contexts/app";

/** Deep-link `/auth/signin` → open modal on the target page instead of a full sign-in page. */
export default function OpenSignIn({
  callbackUrl = "/",
}: {
  callbackUrl?: string;
}) {
  const router = useRouter();
  const { setShowSignModal } = useAppContext();
  const next =
    callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/";

  useEffect(() => {
    setShowSignModal(true, next);
    router.replace(next);
  }, [next, router, setShowSignModal]);

  return (
    <div className="flex min-h-svh items-center justify-center bg-white text-sm text-[#737373]">
      Opening sign in…
    </div>
  );
}
