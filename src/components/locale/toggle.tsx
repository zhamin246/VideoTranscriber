"use client";

import { useParams } from "next/navigation";
import { MdLanguage } from "react-icons/md";
import { localeNames } from "@/i18n/locale";

export default function ({ isIcon = false }: { isIcon?: boolean }) {
  const params = useParams();
  const locale = params.locale as string;

  return (
    <div className="flex items-center gap-2 border border-border/50 text-foreground bg-muted/30 rounded-md px-3 py-1.5 transition-colors cursor-default">
      <MdLanguage className="text-xl text-foreground" />
      {!isIcon && (
        <span className="text-foreground text-sm">{localeNames[locale]}</span>
      )}
    </div>
  );
}
