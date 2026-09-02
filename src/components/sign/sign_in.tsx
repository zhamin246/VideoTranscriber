"use client";

import { Button } from "@/components/ui/button";
import { useAppContext } from "@/contexts/app";
import { useTranslations } from "next-intl";
import { PiSignIn } from "react-icons/pi";

export default function SignIn() {
  const t = useTranslations();
  const { setShowSignModal } = useAppContext();

  return (
    <Button
      variant="default"
      onClick={() => setShowSignModal(true)}
      className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1"
    >
      <PiSignIn className="h-4 w-4" />
      {t("user.sign_in")}
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
      </svg>
    </Button>
  );
}
