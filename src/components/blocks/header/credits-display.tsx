"use client";

import { Badge } from "@/components/ui/badge";
import { Coins } from "lucide-react";
import { useAppContext } from "@/contexts/app";

export default function CreditsDisplay() {
  const { user } = useAppContext();

  // 如果用户未登录，不显示积分
  if (!user) {
    return null;
  }

  const credits = user.credits?.left_credits || 0;

  return (
    <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
      <Coins className="w-3 h-3" />
      <span className="text-xs font-medium">
        {credits}
      </span>
    </Badge>
  );
}
