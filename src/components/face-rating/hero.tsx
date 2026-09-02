import { content } from "./data";
import { HeroFaceVisual } from "./product-mocks";
import HeroUpload from "./hero-upload";
import { V } from "./visual";

function Check({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="mt-0.5 shrink-0">
      <path
        d="M3 7.2 5.7 10 11 4"
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeroProofs() {
  const { hero } = content;
  return (
    <div className="mt-5 max-w-[440px]">
      <p className="text-[14px] leading-snug" style={{ color: "rgba(255,255,255,0.72)" }}>
        {hero.volumeHighlight ? (
          <>
            <span className="font-bold text-white">{hero.volumeHighlight}</span>
            {hero.volume.startsWith(hero.volumeHighlight)
              ? hero.volume.slice(hero.volumeHighlight.length)
              : ` ${hero.volume}`}
          </>
        ) : (
          <span className="font-semibold text-white">{hero.volume}</span>
        )}
      </p>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2.5">
        {hero.proofs.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 text-[13px] leading-snug"
            style={{ color: "rgba(255,255,255,0.72)" }}
          >
            <Check color={V.accentSoft} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HeroTitle() {
  const { hero } = content;
  const italic = hero.titleItalic;
  if (!italic) {
    return <>{hero.title}</>;
  }
  return (
    <>
      <span className="block lg:whitespace-nowrap">Convert any photo</span>
      <span className="block lg:whitespace-nowrap">
        into{" "}
        <span className="font-serif font-normal italic" style={{ color: V.accentSoft }}>
          {italic}
        </span>
      </span>
    </>
  );
}

/**
 * §10 Hero — face left, copy right on desktop. Left visual/animation is frozen.
 */
export default function FaceRatingHero() {
  const { hero } = content;

  return (
    <section
      className="relative overflow-hidden lg:min-h-[calc(100svh-3.6rem)]"
      style={{ backgroundColor: V.darkBg }}
    >
      <div className="mx-auto flex min-h-[inherit] w-full items-center justify-center px-5 py-12 sm:px-8 lg:min-h-[calc(100svh-3.6rem)] lg:px-8 lg:py-12">
        <div className="flex w-full max-w-full flex-col lg:w-auto lg:flex-row lg:items-center lg:gap-8">
          <div className="order-1 flex min-w-0 flex-col justify-center lg:order-2 lg:w-[30rem] lg:shrink-0">
          <p
            className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90"
            style={{ backgroundColor: "rgba(255,255,255,0.10)" }}
          >
            <span className="size-1.5 rounded-full" style={{ backgroundColor: V.accentSoft }} />
            {hero.kicker}
          </p>
          <h1
            className="mt-5 font-black tracking-tight"
            style={{
              color: V.darkInk,
              fontSize: "clamp(1.7rem, 2.6vw, 2.55rem)",
              lineHeight: 1.12,
              letterSpacing: "-0.03em",
            }}
          >
            <HeroTitle />
          </h1>
          <p
            className="mt-4 max-w-[42ch] text-[15px] leading-[1.55] sm:text-[16px]"
            style={{ color: V.darkMuted }}
          >
            {hero.description}
          </p>

          <div className="mt-7 hidden lg:block">
            <HeroUpload />
            <HeroProofs />
          </div>
          </div>

          <div className="order-2 min-w-0 w-full lg:order-1 lg:h-auto lg:w-[min(calc(54vw-2.75rem),calc((100svh-8rem)*4/3),calc(100vw-36rem))]">
            <HeroFaceVisual />
          </div>

          <div className="order-3 flex flex-col items-center lg:hidden">
            <HeroUpload />
            <HeroProofs />
          </div>
        </div>
      </div>
    </section>
  );
}
