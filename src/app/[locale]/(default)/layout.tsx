import Footer from "@/components/blocks/footer";
import Header from "@/components/blocks/header";
import HeroWrapper from "@/components/blocks/hero-wrapper";
import { ReactNode } from "react";
import { getLandingPage } from "@/services/page";
import Feedback from "@/components/feedback";
import HashScrollHandler from "@/components/hash-scroll-handler";
import { headers } from "next/headers";
import { defaultLocale } from "@/i18n/locale";

function isHomePath(pathname: string, locale: string) {
  const clean = (pathname || "").split("?")[0].replace(/\/$/, "") || "/";
  if (clean === "/" || clean === "") return true;
  if (locale && locale !== defaultLocale) {
    return clean === `/${locale}` || clean === `/${locale}/`;
  }
  // also accept /en if used
  return clean === "/en" || clean === `/${locale}`;
}

/** Face Rating self-contained pages (own header/footer) */
function isFaceRatingShellPath(pathname: string, locale: string) {
  if (isHomePath(pathname, locale)) return true;
  const clean = (pathname || "").split("?")[0].replace(/\/$/, "") || "/";
  const isToolPage =
    clean.includes("/tools/ai-attractiveness-test") ||
    clean.includes("/tools/attractiveness") ||
    clean.includes("/tools/full-analysis") ||
    clean.includes("/results/") ||
    clean.includes("/report/") ||
    clean.includes("/dashboard") ||
    clean.includes("/pricing") ||
    clean.includes("/auth/") ||
    clean.includes("/my-orders") ||
    clean.includes("/my-credits") ||
    clean.includes("/my-invites") ||
    clean.includes("/user-generation-records");
  return isToolPage;
}

export default async function DefaultLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = await getLandingPage(locale);
  const h = await headers();
  const pathname = h.get("x-pathname") || "";
  const home = isHomePath(pathname, locale);

  // Homepage + tool pages use self-contained Face Rating chrome (own header/footer)
  if (home || isFaceRatingShellPath(pathname, locale)) {
    return (
      <>
        <HashScrollHandler />
        {children}
      </>
    );
  }

  return (
    <>
      <HashScrollHandler />
      {page.header && !page.header.disabled && <Header header={page.header} />}
      {page.hero && <HeroWrapper hero={page.hero} />}

      <main
        className="overflow-x-hidden"
        style={{
          WebkitTransform: "translateZ(0)",
          transform: "translateZ(0)",
        }}
      >
        {children}
      </main>

      {page.footer && !page.footer.disabled && <Footer footer={page.footer} />}
      <Feedback socialLinks={page.footer?.social?.items} />
    </>
  );
}
