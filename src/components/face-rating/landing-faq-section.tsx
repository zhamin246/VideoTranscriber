"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type FaqItem = { q: string; a: string };

export function LandingFaqSection({
  title,
  items,
}: {
  title: string;
  items: readonly FaqItem[];
}) {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  return (
    <section
      id="faq"
      style={{
        backgroundColor: "#FBFBFE",
        paddingBottom: 64,
        fontFamily: "var(--font-lexend), Lexend, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div className="mx-auto max-w-3xl px-4 pb-12 pt-16 text-center md:pb-16">
        <h2
          className="font-bold"
          style={{ fontSize: 36, fontWeight: 700, lineHeight: "45px", color: "#000" }}
        >
          {title}
        </h2>
      </div>
      <div className="mx-auto mb-10 max-w-7xl px-4 lg:px-24">
        {items.map((item, index) => {
          const isOpen = faqOpen === index;
          return (
            <div key={item.q}>
              <h3 className="m-0 mt-4">
                <button
                  type="button"
                  onClick={() => setFaqOpen(isOpen ? null : index)}
                  className="relative flex w-full items-center justify-between bg-white text-left"
                  style={{
                    padding: "24px",
                    borderRadius: 8,
                    fontSize: 20,
                    fontWeight: 700,
                    lineHeight: 1.25,
                    letterSpacing: "-0.02em",
                    color: "rgb(76, 76, 76)",
                  }}
                  aria-expanded={isOpen}
                >
                  <span className="min-w-0 flex-1 pr-3 font-bold">{item.q}</span>
                  <ChevronDown
                    className="h-10 w-10 shrink-0"
                    style={{
                      color: "rgb(136, 130, 245)",
                      transform: isOpen ? "rotate(180deg)" : "none",
                      transition: "transform 200ms",
                    }}
                  />
                </button>
              </h3>
              {isOpen ? (
                <div
                  className="mt-2"
                  style={{
                    padding: "8px 24px 16px",
                    fontSize: 16,
                    lineHeight: "24px",
                    fontWeight: 400,
                    color: "rgb(76, 76, 76)",
                  }}
                >
                  {item.a}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
