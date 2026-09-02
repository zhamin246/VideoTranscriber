"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/auth/signin" })}
      className="flex h-11 w-full items-center justify-center rounded-md border text-sm font-semibold"
      style={{
        borderColor: "#e5e5e5",
        color: "#0a0a0a",
        backgroundColor: "#ffffff",
      }}
    >
      Sign out
    </button>
  );
}
