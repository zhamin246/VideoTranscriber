import type { DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

export type AuthSessionUser = {
  uuid?: string;
  email?: string | null;
  nickname?: string;
  avatar_url?: string;
  created_at?: string | Date;
  onboarded?: boolean;
};

declare module "next-auth" {
  interface Session {
    user: AuthSessionUser & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    user?: AuthSessionUser;
  }
}
