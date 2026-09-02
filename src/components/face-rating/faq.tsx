"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { content } from "./data";

export default function FaceRatingFaq() {
  const { faq } = content;
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section
      id="faq"
      style={{
        backgroundColor: "#FBFBFE",
        paddingBottom: 64,
        fontFamily: "var(--font-lexend), Lexend, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div className="mx-auto max-w-3xl px-4 pb-12 text-center md:pb-16">
        <h2
          className="font-bold"
          style={{ fontSize: 36, fontWeight: 700, lineHeight: "45px", color: "#000" }}
        >
          {faq.title}
        </h2>
      </div>

      <div className="mx-auto mb-10 max-w-7xl px-4 lg:px-24">
        {faq.items.map((item, index) => {
          const isOpen = open === index;
          return (
            <div key={item.q}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : index)}
                className="relative mt-4 flex w-full items-center justify-between bg-white text-left"
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
                <span>{item.q}</span>
                <ChevronDown
                  className="h-10 w-10 shrink-0"
                  style={{
                    color: "rgb(136, 130, 245)",
                    transform: isOpen ? "rotate(180deg)" : "none",
                    transition: "transform 200ms",
                  }}
                />
              </button>
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
