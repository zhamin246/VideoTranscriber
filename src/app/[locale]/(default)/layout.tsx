import { ReactNode } from "react";
import HashScrollHandler from "@/components/hash-scroll-handler";

/** All (default) routes ship Video Transcriber chrome in-page — no legacy landing header/footer. */
export default async function DefaultLayout({
  children,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  return (
    <>
      <HashScrollHandler />
      {children}
    </>
  );
}
