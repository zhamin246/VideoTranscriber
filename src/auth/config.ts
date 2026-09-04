import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthConfig } from "next-auth";
import { Provider } from "next-auth/providers/index";
import { handleSignInUser } from "./handler";
import {
  isMagicLinkAuthEnabled,
  verifyMagicLinkToken,
} from "@/lib/auth/magic-link";
import { verifyPassword } from "@/lib/auth/password";
import { findUserByEmailAndProvider } from "@/models/user";

let providers: Provider[] = [];

// Email + password (primary email auth)
providers.push(
  CredentialsProvider({
    id: "credentials",
    name: "Email",
    credentials: {
      email: { type: "email" },
      password: { type: "password" },
      rememberMe: { type: "text" },
    },
    async authorize(credentials) {
      const email = String(credentials?.email || "")
        .trim()
        .toLowerCase();
      const password = String(credentials?.password || "");
      const rememberMe = String(credentials?.rememberMe || "true") !== "false";
      if (!email || !password) return null;

      const user = await findUserByEmailAndProvider(email, "credentials");
      if (!user?.password_hash) return null;
      const ok = await verifyPassword(password, user.password_hash);
      if (!ok) return null;

      return {
        id: user.uuid,
        email: user.email,
        name: user.nickname || email.split("@")[0] || "user",
        image: user.avatar_url || null,
        emailVerified: new Date(),
        rememberMe,
      };
    },
  }),
);

// Legacy magic-link verify (kept for old emails in inbox)
if (isMagicLinkAuthEnabled()) {
  providers.push(
    CredentialsProvider({
      id: "email-magic-link",
      name: "Email link",
      credentials: {
        token: { type: "text" },
      },
      async authorize(credentials) {
        const token = String(credentials?.token || "");
        if (!token) return null;
        const result = verifyMagicLinkToken(token);
        if ("error" in result) {
          console.log("magic link verify failed:", result.error);
          return null;
        }
        const email = result.email;
        const local = email.split("@")[0] || "user";
        return {
          id: email,
          email,
          name: local,
          image: null,
          emailVerified: new Date(),
        };
      },
    }),
  );
}

if (
  process.env.NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED === "true" &&
  process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID
) {
  providers.push(
    CredentialsProvider({
      id: "google-one-tap",
      name: "google-one-tap",
      credentials: {
        credential: { type: "text" },
      },
      async authorize(credentials) {
        const googleClientId = process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID;
        if (!googleClientId) return null;

        const token = credentials!.credential;
        const response = await fetch(
          "https://oauth2.googleapis.com/tokeninfo?id_token=" + token,
        );
        if (!response.ok) return null;

        const payload = await response.json();
        if (!payload?.email) return null;

        const {
          email,
          sub,
          given_name,
          family_name,
          email_verified,
          picture: image,
        } = payload;

        return {
          id: sub,
          name: [given_name, family_name].join(" "),
          email,
          image,
          emailVerified: email_verified ? new Date() : null,
        };
      },
    }),
  );
}

if (
  process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true" &&
  process.env.AUTH_GOOGLE_ID &&
  process.env.AUTH_GOOGLE_SECRET
) {
  providers.push(
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  );
}

if (
  process.env.NEXT_PUBLIC_AUTH_GITHUB_ENABLED === "true" &&
  process.env.AUTH_GITHUB_ID &&
  process.env.AUTH_GITHUB_SECRET
) {
  providers.push(
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  );
}

export const providerMap = providers
  .map((provider) => {
    if (typeof provider === "function") {
      const providerData = provider();
      return { id: providerData.id, name: providerData.name };
    }
    return { id: provider.id, name: provider.name };
  })
  .filter(
    (provider) =>
      provider.id !== "google-one-tap" &&
      provider.id !== "email-magic-link" &&
      provider.id !== "credentials",
  );

export const authOptions: NextAuthConfig = {
  providers,
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async signIn() {
      return true;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async session({ session, token }) {
      if (token.user) {
        const email = token.user.email ?? session.user.email ?? "";
        Object.assign(session.user, token.user, { email });
      }
      return session;
    },
    async jwt({ token, user, account, trigger, session }) {
      try {
        if (trigger === "update" && session?.user && token.user) {
          token.user = {
            ...token.user,
            nickname: session.user.nickname ?? token.user.nickname,
            onboarded: session.user.onboarded ?? token.user.onboarded,
          };
          return token;
        }

        if (!user || !account) {
          return token;
        }

        const rememberMe =
          (user as { rememberMe?: boolean }).rememberMe !== false;
        const maxAgeSec = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
        token.exp = Math.floor(Date.now() / 1000) + maxAgeSec;

        const userInfo = await handleSignInUser(user, account);
        if (!userInfo) {
          throw new Error("save user failed");
        }

        token.user = {
          uuid: userInfo.uuid,
          email: userInfo.email,
          nickname: userInfo.nickname,
          avatar_url: userInfo.avatar_url,
          created_at: userInfo.created_at,
          onboarded: Boolean(userInfo.onboarded_at),
        };

        return token;
      } catch (e) {
        console.error("jwt callback error:", e);
        return token;
      }
    },
  },
};
