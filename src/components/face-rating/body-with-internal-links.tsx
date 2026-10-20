import Link from "next/link";
import { INTERNAL_LINK_MARKER } from "@/lib/convert/tool-internal-link-map";

type BodyWithInternalLinksProps = {
  text: string;
  className?: string;
};

export function BodyWithInternalLinks({ text, className }: BodyWithInternalLinksProps) {
  const parts: (string | { label: string; href: string })[] = [];
  let lastIndex = 0;
  const re = new RegExp(INTERNAL_LINK_MARKER.source, "g");
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push({ label: match[1].trim(), href: match[2].trim() });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  if (parts.length === 1 && typeof parts[0] === "string") {
    return <p className={className}>{parts[0]}</p>;
  }

  return (
    <p className={className}>
      {parts.map((part, i) =>
        typeof part === "string" ? (
          <span key={i}>{part}</span>
        ) : (
          <Link
            key={i}
            href={part.href}
            className="font-medium text-[#1C6CFB] underline-offset-2 hover:underline"
          >
            {part.label}
          </Link>
        ),
      )}
    </p>
  );
}
