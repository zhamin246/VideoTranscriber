import { redirect } from "next/navigation";
import { auth } from "@/auth";
import OpenSignIn from "@/components/sign/open-sign-in";

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
    redirect(next);
  }

  return <OpenSignIn callbackUrl={next} />;
}
