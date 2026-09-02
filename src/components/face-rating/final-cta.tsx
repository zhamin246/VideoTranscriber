import Link from "next/link";
import { content } from "./data";
import { V } from "./visual";

/** Final CTA — centered close matching approved comp. */
export default function FaceRatingFinalCta() {
  const { cta } = content;
  const italic = cta.titleItalic;
  const idx = italic ? cta.title.indexOf(italic) : -1;

  return (
    <section
      style={{
        backgroundColor: V.darkBg,
        backgroundImage:
          "radial-gradient(ellipse 55% 50% at 50% 40%, rgba(159,18,57,0.14) 0%, transparent 55%), radial-gradient(ellipse 80% 60% at 50% 100%, #1C1E21 0%, #0D0E0F 62%)",
      }}
    >
      <div
        className="mx-auto max-w-[800px] px-5 text-center sm:px-8"
        style={{
          paddingTop: "clamp(4.5rem, 9vw, 7.5rem)",
          paddingBottom: "clamp(4.5rem, 9vw, 7.5rem)",
        }}
      >
        <p
          className="text-[12px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: V.accentSoft }}
        >
          {cta.kicker}
        </p>
        <h2
          className="mt-3 font-black tracking-tight text-white"
          style={{
            fontSize: "clamp(2rem, 4.2vw, 3.25rem)",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
          }}
        >
          {idx < 0 ? (
            cta.title
          ) : (
            <>
              {cta.title.slice(0, idx)}
              <span className="font-serif font-normal italic" style={{ color: V.accentSoft }}>
                {italic}
              </span>
              {cta.title.slice(idx + italic.length)}
            </>
          )}
        </h2>

        <p
          className="mx-auto mt-5 max-w-[36rem] text-[15px] leading-relaxed sm:text-[17px]"
          style={{ color: "rgba(255,255,255,0.62)" }}
        >
          {cta.body.includes(cta.price) ? (
            <>
              {cta.body.split(cta.price)[0]}
              <span className="font-semibold text-white">{cta.price}</span>
              {cta.body.split(cta.price)[1]}
            </>
          ) : (
            cta.body
          )}
        </p>

        <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link
            href={cta.primaryHref}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-[#881337] sm:h-[52px] sm:px-8"
            style={{ backgroundColor: V.accent }}
          >
            {cta.primary}
            <span aria-hidden>→</span>
          </Link>
          <Link
            href={cta.secondaryHref}
            className="inline-flex h-12 items-center justify-center rounded-full border px-7 text-[15px] font-semibold text-white/90 transition-colors hover:border-white/50 hover:text-white sm:h-[52px] sm:px-8"
            style={{ borderColor: "rgba(255,255,255,0.28)" }}
          >
            {cta.secondary}
          </Link>
        </div>

        <p
          className="mx-auto mt-6 max-w-[32rem] text-[12px] leading-relaxed sm:text-[13px]"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          {cta.micro}
        </p>
      </div>
    </section>
  );
}
