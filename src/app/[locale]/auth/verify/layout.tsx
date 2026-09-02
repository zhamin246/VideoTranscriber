import { Suspense } from "react";

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-white text-sm text-[#737373]">
          Signing you in…
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
