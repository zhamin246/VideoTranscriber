"use client";

import { useEffect, useRef, useState } from "react";
import { content } from "./data";

function StarRow({ n }: { n: number }) {
  return (
    <div className="flex">
      {Array.from({ length: n }).map((_, s) => (
        <svg key={s} viewBox="0 0 20 20" aria-hidden className="h-5 w-5 fill-yellow-300">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({
  item,
  hidden,
}: {
  item: (typeof content.usersSay.items)[number];
  hidden?: boolean;
}) {
  return (
    <figure
      aria-hidden={hidden || undefined}
      className="animate-fade-in rounded-3xl bg-white p-6 opacity-0 shadow-md shadow-gray-900/5"
    >
      <blockquote className="text-gray-900">
        <StarRow n={item.rating} />
        <p className="mt-4 text-lg font-semibold leading-6 text-gray-900">{item.title}</p>
        <p className="mt-3 text-base leading-7 text-gray-900">{item.quote}</p>
      </blockquote>
      <figcaption className="mt-3 text-sm text-gray-600 before:content-['–_']">{item.name}</figcaption>
      <figcaption className="text-sm text-gray-600">{item.role}</figcaption>
    </figure>
  );
}

function ReviewColumn({
  reviews,
  msPerPixel,
  className = "",
}: {
  reviews: typeof content.usersSay.items;
  msPerPixel: number;
  className?: string;
}) {
  const columnRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState("7320ms");

  useEffect(() => {
    const el = columnRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.offsetHeight;
      if (h > 0) setDuration(`${Math.round(h * msPerPixel)}ms`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [msPerPixel]);

  const loop = [...reviews, ...reviews];

  return (
    <div
      ref={columnRef}
      className={`animate-marquee space-y-8 py-4 ${className}`}
      style={{ ["--marquee-duration" as string]: duration }}
    >
      {loop.map((item, i) => (
        <ReviewCard key={`${item.name}-${i}`} item={item} hidden={i >= reviews.length} />
      ))}
    </div>
  );
}

export default function ReviewMarquee() {
  const items = content.usersSay.items;
  const cols = [0, 1, 2].map((col) => items.filter((_, i) => i % 3 === col));

  return (
    <div className="relative -mx-4 mt-16 grid h-[49rem] max-h-[150vh] grid-cols-1 items-start gap-8 overflow-hidden px-4 sm:mt-20 md:grid-cols-2 lg:grid-cols-3">
      <ReviewColumn reviews={cols[0]} msPerPixel={8} />
      <ReviewColumn reviews={cols[1]} msPerPixel={12} className="hidden md:block" />
      <ReviewColumn reviews={cols[2]} msPerPixel={10} className="hidden lg:block" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-gray-50" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-gray-50" />
    </div>
  );
}
