"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CONVERT_HREF } from "./data";

export default function ScrollCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("landing-hero");
    if (!hero) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.12 },
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-50 flex h-0 items-end justify-center md:left-14">
      <div
        className="w-full bg-gradient-to-b from-transparent to-[#a0a0a0] p-[10px] pb-6"
        style={{
          transition: "transform 0.6s ease-out, opacity 0.6s ease-out",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          opacity: visible ? 1 : 0,
        }}
      >
        <div className="flex justify-center">
          <Link
            href={CONVERT_HREF}
            className="pointer-events-auto mt-4 inline-flex h-[50px] items-center justify-center whitespace-nowrap rounded-[6px] px-8 text-[16px] text-white transition-shadow hover:shadow-[0_4px_16px_0_rgba(99,91,255,0.25),0_2px_35px_0_rgba(111,104,240,0.65)]"
            style={{
              background: "linear-gradient(270deg, #6F68F0 0%, #8882F5 80%)",
            }}
          >
            Start transcribing
            <svg className="ml-2" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M8 1C7.60381 1 7.37484 1.58056 6.91689 2.74169L6.6636 3.38392C6.20646 4.54302 5.97789 5.12257 5.55023 5.55023C5.12257 5.97789 4.54302 6.20646 3.38393 6.6636L2.74169 6.91689C1.58056 7.37484 1 7.60381 1 8L7.27232 8.00034C7.67421 8.00034 8.00001 8.32614 8.00001 8.72803C8.00001 9.12992 7.67421 9.45572 7.27232 9.45572H3.68597C4.64713 9.83674 5.16145 10.061 5.55023 10.4498C5.97789 10.8774 6.20646 11.457 6.6636 12.6161L6.91689 13.2583C7.37484 14.4194 7.60381 15 8 15C8.39619 15 8.62516 14.4194 9.08311 13.2583L9.3364 12.6161C9.79354 11.457 10.0221 10.8774 10.4498 10.4498C10.8774 10.0221 11.457 9.79354 12.6161 9.3364L13.2583 9.08311C14.4194 8.62516 15 8.39619 15 8C15 7.60381 14.4194 7.37484 13.2583 6.91689L12.6161 6.6636C11.457 6.20646 10.8774 5.97789 10.4498 5.55023C10.0221 5.12257 9.79354 4.54302 9.3364 3.38393L9.08311 2.74169C8.62516 1.58056 8.39619 1 8 1Z"
                fill="white"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
