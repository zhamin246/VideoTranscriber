import Link from "next/link";
import { TOOL_ANCHOR_BY_HREF, type ToolInternalLinkHref } from "@/lib/convert/tool-internal-link-map";
import { RELATED_TOOLS_BY_PATH } from "@/lib/convert/related-tools-map";

type RelatedToolsProps = {
  /** Current tool page path, e.g. `/youtube-transcript-generator` */
  currentPath: ToolInternalLinkHref;
};

export default function RelatedTools({ currentPath }: RelatedToolsProps) {
  const related = (RELATED_TOOLS_BY_PATH[currentPath] ?? []).filter(
    (href) => href !== currentPath,
  );
  if (related.length === 0) return null;

  return (
    <section
      className="ac-section-wash border-t border-[#E8EAF0] pb-12 pt-12 sm:pb-16 sm:pt-16"
      aria-labelledby="related-tools-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h3
          id="related-tools-heading"
          className="text-[22px] font-semibold leading-tight text-[#0F172A] sm:text-2xl"
        >
          Related tools
        </h3>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((href) => (
            <li key={href}>
              <Link
                href={href}
                className="flex h-full min-h-[72px] items-center rounded-[18px] border border-[#DFE4FB] bg-white px-5 py-4 text-[15px] font-semibold leading-snug text-[#334155] shadow-[0_8px_22px_rgba(46,61,108,0.043)] transition-colors hover:border-[#8882F5]/40 hover:text-[#5270FF]"
              >
                {TOOL_ANCHOR_BY_HREF[href]}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
