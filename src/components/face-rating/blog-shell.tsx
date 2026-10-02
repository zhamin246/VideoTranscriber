"use client";

import FaceRatingSiteHeader from "./site-header";
import FaceRatingSiteFooter from "./site-footer";
import WorkspaceNav from "./workspace-nav";
import PromoBanner from "./promo-banner";
import { V } from "./visual";

export default function BlogShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="ac-home min-h-screen antialiased"
      style={{
        backgroundColor: "#ffffff",
        color: V.ink,
        fontFamily:
          "var(--font-lexend), Lexend, ui-sans-serif, system-ui, sans-serif",
        fontSize: 16,
      }}
    >
      <PromoBanner />
      <div className="flex min-h-0">
        <WorkspaceNav />
        <div className="min-w-0 flex-1">
          <FaceRatingSiteHeader hideBrandOnDesktop />
          {children}
          <FaceRatingSiteFooter />
        </div>
      </div>
    </div>
  );
}
