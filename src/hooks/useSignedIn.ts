"use client";

import { useSession } from "next-auth/react";
import { useAppContext } from "@/contexts/app";

/** Session (NextAuth) and /api/get-user-info can be briefly out of sync. */
export function useSignedIn() {
  const { user } = useAppContext();
  const { data: session, status } = useSession();
  const sessionAuthed =
    status === "authenticated" &&
    Boolean(session?.user?.email || session?.user?.uuid);

  return {
    status,
    session,
    user,
    sessionAuthed,
    signedIn: sessionAuthed || Boolean(user?.uuid),
    sessionLoading: status === "loading",
  };
}
