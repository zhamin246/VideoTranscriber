"use client";

import { content } from "./data";
import { usePathname } from "@/i18n/navigation";
import { isToTextSensitivePath, softenToTextLabel } from "./nav-labels";

export type ReviewMarqueeItem = {
  rating: number;
  title: string;
  quote: string;
  name: string;
  role: string;
  avatar: string;
};

type ReviewItem = ReviewMarqueeItem;

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

function ReviewCard({ item }: { item: ReviewItem }) {
  return (
    <figure className="rounded-3xl bg-white p-6 shadow-md shadow-gray-900/5">
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

/** Single DOM copy of reviews — responsive columns, no duplicated marquee nodes for crawlers. */
export default function ReviewMarquee({
  items: itemsOverride,
}: {
  items?: ReadonlyArray<ReviewMarqueeItem>;
} = {}) {
  const pathname = usePathname() || "";
  const source = itemsOverride ?? content.usersSay.items;
  const items: ReviewItem[] = isToTextSensitivePath(pathname)
    ? source.map((it) => ({
        ...it,
        title: softenToTextLabel(it.title),
        quote: softenToTextLabel(it.quote),
      }))
    : [...source];

  return (
    <div className="relative mt-16 sm:mt-20">
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={`${item.name}-${item.title}`} className="min-w-0">
            <ReviewCard item={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}