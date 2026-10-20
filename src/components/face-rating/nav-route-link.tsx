import Link from "next/link";
import type { ComponentProps } from "react";
import { VIDEO_TO_TEXT_CONVERTER_HREF } from "@/lib/convert/video-to-text-converter-content";

type Props = ComponentProps<typeof Link>;

/**
 * Use a plain anchor for /video-to-text so navigation is a full document load.
 * Client-side routing can keep serving an old 308 → / from browser or prefetch cache
 * after next.config redirects are removed.
 */
function pathOnly(href: Props["href"]): string {
  if (typeof href === "string") return href.split("?")[0].split("#")[0] || "";
  if (href && typeof href === "object" && "pathname" in href) {
    return href.pathname || "";
  }
  return "";
}

export function NavRouteLink({ href, ...rest }: Props) {
  if (pathOnly(href) === VIDEO_TO_TEXT_CONVERTER_HREF) {
    return <a href={VIDEO_TO_TEXT_CONVERTER_HREF} {...(rest as ComponentProps<"a">)} />;
  }
  return <Link href={href} prefetch={false} {...rest} />;
}
