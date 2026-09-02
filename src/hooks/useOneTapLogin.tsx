"use client";

import googleOneTap from "google-one-tap";
import { signIn } from "next-auth/react";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

/**
 * Google One Tap — disabled on /auth/* so it doesn't fight the email login page.
 */
export default function useOneTapLogin() {
  const { data: session, status } = useSession();
  const pathname = usePathname() || "";

  const oneTapLogin = async function () {
    const options = {
      client_id: process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID,
      auto_select: false,
      cancel_on_tap_outside: false,
      context: "signin" as const,
    };

    googleOneTap(options, (response: any) => {
      handleLogin(response.credential);
    });
  };

  const handleLogin = async function (credentials: string) {
    await signIn("google-one-tap", {
      credential: credentials,
      redirect: false,
    });
  };

  useEffect(() => {
    // Never run One Tap on passwordless email auth screens
    if (pathname.includes("/auth/")) return;

    if (status === "unauthenticated") {
      oneTapLogin();

      const intervalId = setInterval(() => {
        oneTapLogin();
      }, 3000);

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [status, pathname]);

  return null;
}
