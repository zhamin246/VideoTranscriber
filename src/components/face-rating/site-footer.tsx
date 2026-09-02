import Link from "next/link";
import { CONVERT_HREF } from "./data";

const COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Transcribe",
    links: [
      { label: "File upload", href: CONVERT_HREF },
      { label: "Paste link", href: CONVERT_HREF },
      { label: "Record audio", href: CONVERT_HREF },
      { label: "YouTube to text", href: CONVERT_HREF },
    ],
  },
  {
    title: "Outputs",
    links: [
      { label: "Copy transcript", href: CONVERT_HREF },
      { label: "Download file", href: CONVERT_HREF },
      { label: "Share text", href: CONVERT_HREF },
    ],
  },
  {
    title: "Examples",
    links: [
      { label: "Meetings", href: "/#usecases" },
      { label: "Interviews", href: "/#usecases" },
      { label: "Podcasts", href: "/#usecases" },
      { label: "Lectures", href: "/#usecases" },
      { label: "YouTube", href: "/#usecases" },
    ],
  },
  {
    title: "Guides",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "FAQ", href: "/#faq" },
      { label: "Use cases", href: "/#usecases" },
    ],
  },
  {
    title: "Product",
    links: [
      { label: "Start transcribing", href: CONVERT_HREF },
      { label: "Pricing", href: "/pricing" },
      { label: "History", href: "/dashboard" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms-of-service" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Refund Policy", href: "/refund-policy" },
    ],
  },
];

function BrandMark() {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center bg-transparent">
        <img src="/favicon.svg" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
      </span>
      <span className="text-[16px] font-bold tracking-tight text-[#111827]">
        <span style={{ color: "#000" }}>video </span>
        <span style={{ color: "#5270FF" }}>transcriber</span>
      </span>
    </span>
  );
}

export default function FaceRatingSiteFooter({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <footer
      className="border-t border-gray-200 bg-white text-gray-700"
      style={{ fontFamily: "var(--font-lexend), Lexend, ui-sans-serif, system-ui, sans-serif" }}
    >
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6">
        <div
          className="flex flex-col justify-between gap-4 border-t border-gray-200 pt-6 pb-6 md:flex-row md:items-center"
          style={{ marginTop: compact ? 8 : 16 }}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <Link href="/" className="inline-block" aria-label="video transcriber">
              <BrandMark />
            </Link>
            <p style={{ fontSize: 16, color: "rgb(76, 76, 76)", fontWeight: 400 }}>
              Convert speech in audio and video into searchable text, in the browser.
            </p>
          </div>
        </div>

        <div className="grid gap-6 border-t border-gray-200 py-10 sm:grid-cols-2 md:grid-cols-3 md:py-14 lg:grid-cols-6">
          {COLS.map((col) => (
            <div key={col.title}>
              <p
                className="mb-3 text-sm font-semibold uppercase text-gray-900"
                style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.14px", color: "rgb(25, 25, 25)" }}
              >
                {col.title}
              </p>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-gray-600 transition-colors hover:text-gray-900 hover:underline"
                      style={{ fontSize: 14, fontWeight: 400, lineHeight: "21px", color: "rgb(102, 102, 102)" }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 py-6 text-sm" style={{ fontSize: 14, color: "rgb(102, 102, 102)" }}>
          <p>Transcripts are a draft. Review speaker labels and names before you publish.</p>
          <p className="mt-1">© {new Date().getFullYear()} video transcriber</p>
        </div>
      </div>
    </footer>
  );
}
