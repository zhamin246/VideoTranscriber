import Image from "next/image";
import Link from "next/link";
import { content } from "./data";

/** 6-axis radar — Voltage Blue on product-white panel */
function HarmonyRadar({
  scores,
}: {
  scores: { label: string; score: number }[];
}) {
  const cx = 94;
  const cy = 94;
  const maxR = 60;
  const n = scores.length;

  const pointAt = (i: number, r: number) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as const;
  };

  const rings = [0.25, 0.5, 0.75, 1].map((t) =>
    Array.from({ length: n }, (_, i) => pointAt(i, maxR * t))
      .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
      .join(" ")
  );

  const dataPoly = scores
    .map((s, i) => {
      const [x, y] = pointAt(i, (s.score / 100) * maxR);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const dataPts = scores.map((s, i) => pointAt(i, (s.score / 100) * maxR));

  const labelPos = scores.map((s, i) => {
    const [x, y] = pointAt(i, maxR + 16);
    let anchor: "middle" | "start" | "end" = "middle";
    if (i === 1 || i === 2) anchor = "start";
    if (i === 4 || i === 5) anchor = "end";
    return { ...s, x, y, anchor };
  });

  return (
    <svg viewBox="-16 -10 220 208" className="h-auto w-full" aria-hidden>
      {rings.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="#e8e8e8" strokeWidth={1} />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const [x, y] = pointAt(i, maxR);
        return (
          <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e8e8e8" strokeWidth={1} />
        );
      })}
      <polygon
        points={dataPoly}
        fill="#9F1239"
        fillOpacity={0.14}
        stroke="#9F1239"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {dataPts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.1} fill="#9F1239" />
      ))}
      {labelPos.map((l) => (
        <text
          key={l.label}
          x={l.x}
          y={l.y}
          textAnchor={l.anchor}
          fontSize={9}
          fontWeight={700}
          fill="#6b7280"
          dominantBaseline="middle"
        >
          {l.label}
        </text>
      ))}
    </svg>
  );
}

/**
 * Face Report section — typography aligned with thefacereport report block:
 * H2 36/900, body 18/500, step titles 16/900, price Inter 36/900 (not mono).
 * Layout: left copy + right product cards (title left-aligned with body).
 */
export default function FaceRatingFullReport() {
  const { report } = content;

  const radarScores = [
    report.harmony.find((h) => h.label === "Symmetry")!,
    report.harmony.find((h) => h.label === "Golden")!,
    report.harmony.find((h) => h.label === "Thirds")!,
    report.harmony.find((h) => h.label === "Fifths")!,
    report.harmony.find((h) => h.label === "Eyes")!,
    report.harmony.find((h) => h.label === "Jaw")!,
  ];

  return (
    <section className="border-y border-[#e5e5e5] bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid items-start gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          {/* Left column — kicker + title + body + steps + price */}
          <div className="text-left">
            <span className="inline-flex items-center rounded-md border border-transparent bg-[#f5f5f4] px-2.5 py-0.5 text-xs font-bold text-[#0a0a0a]">
              {report.kicker}
            </span>

            <h2
              id="face-report-heading"
              className="mt-4 text-[clamp(1.75rem,4vw,2.25rem)] font-black leading-[1.1] tracking-tight text-[#0a0a0a] lg:text-4xl lg:tracking-[-0.025em]"
            >
              {report.title}
            </h2>

            {/* Body: 18px / 500 / ~1.625 lh / 60% black */}
            <p className="mt-4 max-w-xl text-lg font-medium leading-[1.625] text-black/60">
              {report.body}
            </p>

            <ol className="mt-8 flex flex-col gap-5">
              {report.pillars.map((p) => (
                <li key={p.title} className="grid grid-cols-[auto_1fr] gap-4">
                  <span className="flex size-8 items-center justify-center rounded-full bg-[#9F1239] text-xs font-black text-white">
                    {p.n}
                  </span>
                  <div>
                    {/* Step title: 16px / 900 */}
                    <h3 className="text-base font-black leading-6 text-[#0a0a0a]">
                      {p.title}
                    </h3>
                    {/* Step body: 14px / 400 / zinc-700 */}
                    <p className="mt-1 text-sm font-normal leading-[1.625] text-zinc-700">
                      {p.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-8 flex flex-col items-start gap-0">
              {/* Price: Inter 36px / 900 — not mono */}
              <span className="text-4xl font-black leading-10 tabular-nums tracking-normal text-[#9F1239]">
                {report.price}
              </span>
              <p className="text-sm font-normal leading-5 text-zinc-700">
                {report.priceNote}
              </p>
            </div>

            <Link
              href="/tools/full-analysis"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#9F1239] px-8 py-4 text-base font-semibold leading-6 text-white transition-colors hover:bg-[#881337]"
            >
              {report.cta}
            </Link>

            <p className="mt-3 max-w-md text-xs font-normal leading-[1.625] text-zinc-700">
              Stripe asks for your email so we can send your PDF and save your report.
            </p>
            <p className="mt-5 text-xs font-semibold leading-4 text-zinc-700">
              {report.guarantee}
            </p>
          </div>

          {/* Right — product cards */}
          <div className="relative grid items-start gap-5 sm:grid-cols-2">
            <div className="relative flex flex-col overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white shadow-sm">
              <div className="border-b border-[#e5e5e5] bg-[#fafafa]/80 px-5 py-4 text-left">
                <h3 className="text-base font-bold leading-6 tracking-tight text-[#0a0a0a]">
                  {report.harmonyTitle}
                </h3>
                <p className="mt-0.5 text-sm font-normal leading-normal text-zinc-500">
                  {report.harmonyHint}
                </p>
              </div>
              <div className="px-4 py-4">
                <div className="mx-auto w-full max-w-[240px]">
                  <HarmonyRadar scores={radarScores} />
                </div>
                <p className="mt-2 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#9F1239]">
                  {report.harmonyTitle}
                </p>
                <p className="mx-auto mt-2 max-w-[280px] text-center text-sm font-normal leading-[1.625] text-gray-500">
                  Chart shape follows a sample scan. Live scores, write-ups, and ordered next steps
                  ship with your Face Report.
                </p>
                <ul className="sr-only">
                  {radarScores.map((s) => (
                    <li key={s.label}>
                      {s.label}: {s.score} out of 100
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-t border-[#e5e5e5] bg-[#fafafa]/80 px-5 py-3">
                <p className="text-xs font-normal leading-4 text-zinc-700">
                  Six dimensions, exact scores, and what each one means.
                </p>
              </div>
            </div>

            <div className="relative flex flex-col overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white shadow-sm">
              <div className="border-b border-[#e5e5e5] bg-[#fafafa]/80 px-5 py-4 text-left">
                <h3 className="text-base font-bold leading-6 tracking-tight text-[#0a0a0a]">
                  Your styling concept
                </h3>
                <p className="mt-0.5 text-sm font-normal leading-normal text-zinc-500">
                  Visualized on your own photo
                </p>
              </div>
              <div className="grid grid-cols-2 gap-px bg-[#e5e5e5]">
                <div className="relative aspect-[3/4] overflow-hidden bg-white">
                  <Image
                    src="/face-rating/glowup-before.webp?v=3"
                    alt="AI styling concept — before"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 45vw, 270px"
                  />
                  <span className="absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                    before
                  </span>
                </div>
                <div className="relative aspect-[3/4] overflow-hidden bg-white">
                  <Image
                    src="/face-rating/glowup-after.webp?v=3"
                    alt="AI styling concept — after"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 45vw, 270px"
                  />
                  <span className="absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                    after
                  </span>
                </div>
              </div>
              <div className="border-t border-[#e5e5e5] bg-[#fafafa]/80 px-5 py-3">
                <p className="text-xs font-normal leading-4 text-zinc-700">
                  Styling visualization—not a forecast of structural change.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
