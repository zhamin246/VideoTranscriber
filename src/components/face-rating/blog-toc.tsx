"use client";

import { ArrowLeft, ChevronDown } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { BlogTocItem } from "@/lib/blog/toc";
import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const SCROLL_OFFSET = 96;

function getActiveId(items: BlogTocItem[]): string | null {
  if (!items.length) return null;
  let active = items[0].id;
  for (const item of items) {
    const el = document.getElementById(item.id);
    if (!el) continue;
    if (el.getBoundingClientRect().top <= SCROLL_OFFSET) active = item.id;
  }
  return active;
}

function TocNav({
  items,
  activeId,
  onNavigate,
  ariaLabel,
}: {
  items: BlogTocItem[];
  activeId: string | null;
  onNavigate: (id: string) => void;
  ariaLabel: string;
}) {
  return (
    <nav className="blog-toc__nav" aria-label={ariaLabel}>
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={[
              "blog-toc__link",
              item.level === 3 ? "blog-toc__link--level-3" : "blog-toc__link--level-2",
              isActive ? "blog-toc__link--active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(item.id);
            }}
          >
            {item.title}
          </a>
        );
      })}
    </nav>
  );
}

function TocBlock({
  items,
  activeId,
  onNavigate,
  onThisPage,
}: {
  items: BlogTocItem[];
  activeId: string | null;
  onNavigate: (id: string) => void;
  onThisPage: string;
}) {
  return (
    <div className="blog-toc__desktop-card">
      <p className="blog-toc__eyebrow">Navigation</p>
      <p className="blog-toc__title">{onThisPage}</p>
      <TocNav
        items={items}
        activeId={activeId}
        onNavigate={onNavigate}
        ariaLabel={onThisPage}
      />
    </div>
  );
}

export default function BlogToc({
  items,
  backToBlog,
  onThisPage,
  children,
}: {
  items: BlogTocItem[];
  backToBlog: string;
  onThisPage: string;
  children: ReactNode;
}) {
  const [activeId, setActiveId] = useState<string | null>(
    items[0]?.id ?? null,
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollToId = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
    setMobileOpen(false);
    window.history.replaceState(null, "", `#${id}`);
  }, []);

  useEffect(() => {
    if (!items.length) return;

    const sync = () => setActiveId(getActiveId(items));
    sync();

    const hash = window.location.hash.replace(/^#/, "");
    if (hash && items.some((i) => i.id === hash)) {
      setActiveId(hash);
    }

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setActiveId(getActiveId(items));
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [items]);

  const backLink = (
    <Link href="/posts" className="blog-toc__back">
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
      {backToBlog}
    </Link>
  );

  return (
    <>
      {items.length > 0 ? (
        <aside className="blog-toc blog-article-toc-mobile lg:hidden">
          {backLink}
          <div className="blog-toc__mobile">
            <button
              type="button"
              className="blog-toc__toggle"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {onThisPage}
              <ChevronDown
                className={`h-4 w-4 text-[#6b7280] transition ${mobileOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            {mobileOpen ? (
              <div className="blog-toc__panel">
                <TocNav
                  items={items}
                  activeId={activeId}
                  onNavigate={scrollToId}
                  ariaLabel={onThisPage}
                />
              </div>
            ) : null}
          </div>
        </aside>
      ) : (
        <div className="lg:hidden">{backLink}</div>
      )}

      <div className="blog-article-layout">
        {items.length > 0 ? (
          <aside className="blog-toc blog-toc--desktop blog-article-toc-desktop hidden lg:block">
            {backLink}
            <TocBlock
              items={items}
              activeId={activeId}
              onNavigate={scrollToId}
              onThisPage={onThisPage}
            />
          </aside>
        ) : (
          <div className="hidden lg:block">{backLink}</div>
        )}
        {children}
      </div>
    </>
  );
}
