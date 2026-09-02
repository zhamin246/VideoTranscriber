import Image from "next/image";
import Link from "next/link";
import { content } from "./data";
import { V } from "./visual";

function BaLabel({ children }: { children: string }) {
  return (
    <span className="absolute left-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
      {children}
    </span>
  );
}

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="shrink-0">
      <path
        d="M2.5 7h9M7.5 3.5 11 7l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BeforeAfter({
  before,
  after,
  title,
  tall,
}: {
  before: string;
  after: string;
  title: string;
  tall?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-[14px]">
      <div className={`relative overflow-hidden ${tall ? "aspect-[3/4]" : "aspect-square"}`}>
        <Image
          src={before}
          alt={`${title} — before (sample)`}
          fill
          className="object-cover"
          sizes={tall ? "(max-width: 1024px) 40vw, 200px" : "(max-width: 640px) 50vw, 25vw"}
        />
        <BaLabel>Before</BaLabel>
      </div>
      <div className={`relative overflow-hidden ${tall ? "aspect-[3/4]" : "aspect-square"}`}>
        <Image
          src={after}
          alt={`${title} — after (sample)`}
          fill
          className="object-cover"
          sizes={tall ? "(max-width: 1024px) 40vw, 200px" : "(max-width: 640px) 50vw, 25vw"}
        />
        <BaLabel>After</BaLabel>
      </div>
    </div>
  );
}

/** AI Transformations — optional add-ons with sample before/after (approved comp). */
export default function FaceRatingTransforms() {
  const s = content.transforms;
  const featured = s.featured;
  const italic = s.titleItalic;
  const idx = italic ? s.title.indexOf(italic) : -1;

  return (
    <section
      id="ai-transformations"
      style={{
        backgroundColor: V.darkBg,
        color: V.darkInk,
        backgroundImage:
          "radial-gradient(ellipse 70% 45% at 50% 0%, #1C1E21 0%, #0D0E0F 55%)",
      }}
    >
      <div
        className="mx-auto max-w-[1152px] px-5 sm:px-8"
        style={{
          paddingTop: "clamp(4.5rem, 8vw, 6.5rem)",
          paddingBottom: "clamp(4.5rem, 8vw, 6.5rem)",
        }}
      >
        <div className="mx-auto max-w-2xl text-center">
          <p
            className="text-[12px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: V.accentSoft }}
          >
            {s.eyebrow}
          </p>
          <h2
            className="mt-3 font-black tracking-tight text-white"
            style={{
              fontSize: "clamp(1.9rem, 3.8vw, 2.85rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
            }}
          >
            {idx < 0 ? (
              s.title
            ) : (
              <>
                {s.title.slice(0, idx)}
                <span className="font-serif font-normal italic" style={{ color: V.accentSoft }}>
                  {italic}
                </span>
                {s.title.slice(idx + italic.length)}
              </>
            )}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed sm:text-[16px]" style={{ color: V.darkMuted }}>
            {s.body}
          </p>
        </div>

        {/* Featured: Glow-Up Pack — hover glow (thefacereport pattern) */}
        <Link href={featured.href} className="group mt-10 block sm:mt-12">
          <div className="grid items-center gap-6 overflow-hidden rounded-[20px] border border-white/10 bg-gradient-to-b from-[#27272A] to-[#1F1F23] p-5 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:border-[#FB7185]/30 group-hover:shadow-[0_0_28px_-8px_rgba(251,113,133,0.4)] sm:p-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-8 lg:p-7">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-[20px] font-bold tracking-tight text-white sm:text-[22px]">
                  {featured.title}
                </h3>
                <span
                  className="rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                  style={{ borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.55)" }}
                >
                  {featured.tag}
                </span>
              </div>
              <p className="mt-3 max-w-md text-[14px] leading-relaxed sm:text-[15px]" style={{ color: V.darkMuted }}>
                {featured.body}
              </p>
              <span
                className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold transition-all duration-300 group-hover:gap-2.5 sm:text-[15px]"
                style={{ color: V.accentSoft }}
              >
                {featured.cta}
                <Arrow />
              </span>
            </div>
            <div className="min-w-0 overflow-hidden rounded-[16px] ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-[1.01]">
              <BeforeAfter
                before={featured.before}
                after={featured.after}
                title={featured.title}
                tall
              />
            </div>
          </div>
        </Link>

        {/* Grid packs */}
        <ul className="mt-5 grid gap-5 sm:grid-cols-2">
          {s.items.map((item) => (
            <li key={item.title}>
              <Link href={item.href} className="group block h-full">
                <article className="flex h-full flex-col overflow-hidden rounded-[20px] border border-white/10 bg-gradient-to-b from-[#27272A] to-[#1F1F23] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:-translate-y-0.5 group-hover:border-[#FB7185]/30 group-hover:shadow-[0_0_28px_-8px_rgba(251,113,133,0.4)]">
                  <div className="overflow-hidden">
                    <BeforeAfter before={item.before} after={item.after} title={item.title} />
                  </div>
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <h3 className="text-[17px] font-bold tracking-tight text-white sm:text-[18px]">
                      {item.title}
                    </h3>
                    <p className="mt-2 flex-1 text-[14px] leading-relaxed" style={{ color: V.darkMuted }}>
                      {item.body}
                    </p>
                    <span
                      className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold transition-all duration-300 group-hover:gap-2.5"
                      style={{ color: V.accentSoft }}
                    >
                      {item.cta}
                      <Arrow />
                    </span>
                  </div>
                </article>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
