"use client";

import Link from "next/link";
import { usePathname } from "@/i18n/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useAppContext } from "@/contexts/app";
import { content, CONVERT_HREF, FREE_TEST_HREF, FULL_REPORT_HREF } from "./data";
import { btnPrimary, V } from "./visual";

const DASHBOARD_HREF = "/dashboard";

/** Strip query/hash; treat locale-prefixed paths from raw location if needed. */
function pathOnly(href: string): string {
  return href.split("?")[0].split("#")[0] || "/";
}

function isNavActive(pathname: string, hash: string, href: string): boolean {
  const path = pathOnly(href);
  const hashPart = href.includes("#") ? `#${href.split("#")[1] || ""}` : "";

  // In-page section links on the landing page
  if (hashPart && hashPart !== "#") {
    const onHome = pathname === "/" || pathname === "";
    return onHome && (hash === hashPart || hash === hashPart.slice(1));
  }

  if (!path || path === "/") return false;

  if (path === CONVERT_HREF || href === CONVERT_HREF) {
    return pathname === CONVERT_HREF || pathname.startsWith(`${CONVERT_HREF}/`);
  }

  // Rate My Face / free tool
  if (path === FREE_TEST_HREF || href === FREE_TEST_HREF) {
    return (
      pathname === FREE_TEST_HREF ||
      pathname.startsWith(`${FREE_TEST_HREF}/`) ||
      pathname.includes("/tools/ai-attractiveness-test")
    );
  }

  if (path === FULL_REPORT_HREF || href === FULL_REPORT_HREF) {
    return (
      pathname === FULL_REPORT_HREF ||
      pathname.startsWith(`${FULL_REPORT_HREF}/`) ||
      pathname.includes("/tools/full-analysis")
    );
  }

  return pathname === path || pathname.startsWith(`${path}/`);
}

function NavPill({
  href,
  active,
  isFree,
  children,
  onClick,
  className = "",
}: {
  href: string;
  active: boolean;
  isFree?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[14px] font-semibold transition-colors ${
        active
          ? "bg-[#8882F5] text-white hover:bg-[#726BE8]"
          : isFree
            ? "bg-transparent text-[#8882F5] hover:bg-[#F4F3FF]"
            : "bg-transparent font-medium text-[#606266] hover:bg-[#F7F6FF]"
      } ${className}`}
    >
      {children}
    </Link>
  );
}

function greetingName(session: {
  user?: { nickname?: string | null; name?: string | null; email?: string | null } | null;
} | null): string {
  const user = session?.user;
  const raw =
    user?.nickname?.trim() ||
    user?.name?.trim() ||
    user?.email?.split("@")[0] ||
    "there";
  const first = raw.split(/\s+/)[0] || "there";
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function AccountMenu({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="relative flex size-9 shrink-0 items-center justify-center rounded-full sm:size-10"
        style={{ backgroundColor: V.accent }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="8.2" r="3.3" stroke="white" strokeWidth="1.85" />
          <path
            d="M5.4 19.2c1.5-3.1 3.7-4.6 6.6-4.6s5.1 1.5 6.6 4.6"
            stroke="white"
            strokeWidth="1.85"
            strokeLinecap="round"
          />
        </svg>
        <span
          className="absolute -bottom-px -right-px size-[11px] rounded-full border-[2px] border-white sm:size-3"
          style={{ backgroundColor: "#14B8A6" }}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-[240px] overflow-hidden rounded-[12px] border bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
          style={{ borderColor: V.line }}
        >
          <div className="px-4 py-3.5">
            <p className="text-[15px] font-semibold" style={{ color: V.ink }}>
              Hello {name}!
            </p>
            <p className="mt-0.5 text-[13px]" style={{ color: "rgba(10,10,10,0.5)" }}>
              Pleasure to see you again
            </p>
          </div>
          <div className="border-t" style={{ borderColor: V.line }}>
            <Link
              href={DASHBOARD_HREF}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-[15px] font-medium transition-colors hover:bg-[#F5F5F4]"
              style={{ color: V.ink }}
            >
              My Dashboard
            </Link>
          </div>
          <div className="border-t" style={{ borderColor: V.line }}>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                void signOut({ callbackUrl: "/" });
              }}
              className="block w-full px-4 py-3 text-left text-[15px] font-medium transition-colors hover:bg-[#F5F5F4]"
              style={{ color: V.ink }}
            >
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function FaceRatingSiteHeader({
  hideBrandOnDesktop = false,
}: {
  hideBrandOnDesktop?: boolean;
} = {}) {
  const { brand, nav } = content;
  // next-intl pathname is without locale prefix
  const pathname = usePathname() || "";
  const { data: session, status } = useSession();
  const { setShowSignModal } = useAppContext();
  const sessionEmail =
    (session?.user as { email?: string } | undefined)?.email ||
    session?.user?.email ||
    null;
  const isLoggedIn = status === "authenticated" && Boolean(sessionEmail);

  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [hash, setHash] = useState("");
  const menusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash || "");
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menusRef.current && !menusRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  return (
    <header
      className="sticky top-0 z-30 border-b border-white/10"
      style={{
        backgroundColor: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        fontFamily: "var(--font-lexend), Lexend, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div className="flex h-[59px] w-full items-center justify-between" style={{ padding: "8px 12px" }}>
        <div className="flex min-w-0 items-center">
        <Link
          href="/"
          className={`shrink-0 ${hideBrandOnDesktop ? "md:hidden" : ""}`}
          style={{ color: V.ink }}
          aria-label={`${brand.name} — home`}
        >
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center bg-transparent">
              <img src="/favicon.svg" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
            </span>
            <span className="sr-only">{brand.name}</span>
          </span>
        </Link>

        <nav className="hidden items-center md:flex" ref={menusRef}>
          {nav.menus.map((menu) => {
            const openMenu = menuOpen === menu.label;
            return (
              <div
                key={menu.label}
                className="relative"
                onMouseEnter={() => setMenuOpen(menu.label)}
                onMouseLeave={() => setMenuOpen(null)}
              >
                <button
                  type="button"
                  className="inline-flex items-center hover:text-[#635BFF]"
                  style={{
                    height: 40,
                    padding: "0 12px",
                    fontSize: 15,
                    fontWeight: 400,
                    lineHeight: "20px",
                    color: "rgb(101, 100, 132)",
                    gap: 4,
                  }}
                  onClick={() => setMenuOpen(openMenu ? null : menu.label)}
                  aria-expanded={openMenu}
                  aria-haspopup="menu"
                >
                  {menu.label}
                  <ChevronDown
                    style={{ width: 14, height: 14 }}
                    className={openMenu ? "rotate-180" : ""}
                  />
                </button>
                {openMenu ? (
                  <div
                    role="menu"
                    className="absolute left-0 top-full z-50 min-w-[220px] rounded-[12px] border border-[#EAEAEA] bg-white py-1.5 shadow-[0_12px_32px_-16px_rgba(17,24,39,0.28)]"
                  >
                    {menu.items.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        role="menuitem"
                        onClick={() => setMenuOpen(null)}
                        className="block px-3.5 py-2 text-[14px] font-medium text-[#111827] hover:bg-[#F7F6FF]"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
          {nav.items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="inline-flex items-center hover:text-[#635BFF]"
              style={{
                height: 40,
                padding: "0 12px",
                fontSize: 15,
                fontWeight: 400,
                lineHeight: "20px",
                color: "rgb(101, 100, 132)",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {isLoggedIn ? (
            <AccountMenu name={greetingName(session)} />
          ) : (
            <button
              type="button"
              onClick={() => setShowSignModal(true)}
              className="hidden hover:opacity-70 sm:inline"
              style={{ fontSize: 16, fontWeight: 400, lineHeight: "24px", color: "#000" }}
            >
              {nav.login.label}
            </button>
          )}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border md:hidden"
            style={{ borderColor: V.line, color: V.ink }}
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open ? (
        <div
          className="border-t px-4 py-4 md:hidden"
          style={{ borderColor: V.line, backgroundColor: V.bg }}
        >
          <div className="flex flex-col gap-1">
            {nav.menus.flatMap((menu) =>
              menu.items.map((item) => (
                <Link
                  key={`${menu.label}-${item.label}`}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-[10px] px-3 py-2.5 text-[15px] font-medium"
                  style={{ color: V.ink }}
                >
                  {item.label}
                </Link>
              )),
            )}
            <div className="my-2 border-t" style={{ borderColor: V.line }} />
            {nav.items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-[10px] px-3 py-3 text-[15px] font-medium"
                style={{ color: V.ink }}
              >
                {item.label}
              </Link>
            ))}
            {isLoggedIn ? (
              <>
                <Link
                  href={DASHBOARD_HREF}
                  onClick={() => setOpen(false)}
                  className="rounded-[10px] px-3 py-3 text-[15px] font-medium"
                  style={{ color: V.ink }}
                >
                  My Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void signOut({ callbackUrl: "/" });
                  }}
                  className="rounded-[10px] px-3 py-3 text-left text-[15px] font-medium"
                  style={{ color: V.ink }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setShowSignModal(true);
                }}
                className="rounded-[10px] px-3 py-3 text-left text-[15px] font-medium"
                style={{ color: V.ink }}
              >
                {nav.login.label}
              </button>
            )}
            <Link
              href={CONVERT_HREF}
              onClick={() => setOpen(false)}
              className={`${btnPrimary} mt-3 w-full`}
            >
              {nav.cta.label}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
