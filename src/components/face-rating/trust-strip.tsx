/**
 * Trust strip — Carbon surface, Inter numbers (not mono soft)
 */
export default function FaceRatingTrustStrip() {
  const marks = [
    { label: "22k+", sub: "scans / 30d" },
    { label: "478", sub: "landmarks" },
    { label: "0–100", sub: "balance score" },
    { label: "2h", sub: "auto-purge" },
    { label: "Private", sub: "by design" },
    { label: "Browser", sub: "first free" },
  ];

  return (
    <section
      aria-label="Trust signals"
      className="border-y border-white/[0.06] bg-[#191919] py-10 sm:py-12"
    >
      <div className="mx-auto max-w-[1200px] px-6">
        <p className="mb-6 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[#6d6e71]">
          Built for clear, private face analysis
        </p>
        <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-14">
          {marks.map((m) => (
            <li key={m.label} className="text-center">
              <p className="text-lg font-black tracking-tight text-[#d1d3d4] sm:text-xl">
                {m.label}
              </p>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#58595b]">
                {m.sub}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
