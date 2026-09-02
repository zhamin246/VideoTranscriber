import { insertAnonymousUsageLog, getTodayUsageCount } from "@/models/anonymous-usage";
import { getClientIp } from "@/lib/ip";
import { getIsoTimestr } from "@/lib/time";
import { DAILY_FREE_LIMIT } from "@/lib/constants";

/**
 * 检查匿名用户是否可以继续使用（未达到每日限制）
 */
export async function checkAnonymousUsageLimit(
  anonymous_uuid: string,
  api_type: string
): Promise<{ allowed: boolean; remaining: number }> {
  const todayCount = await getTodayUsageCount(anonymous_uuid, api_type);
  const remaining = Math.max(0, DAILY_FREE_LIMIT - todayCount);
  const allowed = todayCount < DAILY_FREE_LIMIT;

  return { allowed, remaining };
}

/**
 * 记录匿名用户的使用
 */
export async function recordAnonymousUsage(
  anonymous_uuid: string,
  api_type: string
): Promise<void> {
  const ip_address = await getClientIp();

  await insertAnonymousUsageLog({
    anonymous_uuid,
    api_type,
    ip_address,
    created_at: new Date(),
  });
}

/**
 * 获取匿名用户剩余使用次数
 */
export async function getAnonymousUsageRemaining(
  anonymous_uuid: string,
  api_type: string
): Promise<number> {
  const todayCount = await getTodayUsageCount(anonymous_uuid, api_type);
  return Math.max(0, DAILY_FREE_LIMIT - todayCount);
}

