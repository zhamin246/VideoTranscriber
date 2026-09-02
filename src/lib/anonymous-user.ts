"use client";

const ANONYMOUS_UUID_KEY = "anonymous_user_uuid";

/**
 * 获取或创建匿名用户UUID
 */
export function getOrCreateAnonymousUuid(): string {
  if (typeof window === "undefined") {
    return "";
  }

  let uuid = localStorage.getItem(ANONYMOUS_UUID_KEY);

  if (!uuid) {
    // 生成新的UUID（使用v4格式）
    uuid = generateUUID();
    localStorage.setItem(ANONYMOUS_UUID_KEY, uuid);
  }

  return uuid;
}

/**
 * 生成UUID v4
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 获取匿名用户UUID（不创建新值）
 */
export function getAnonymousUuid(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(ANONYMOUS_UUID_KEY);
}

/**
 * 清除匿名用户UUID
 */
export function clearAnonymousUuid(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(ANONYMOUS_UUID_KEY);
}

/**
 * 获取匿名用户剩余使用次数
 */
export async function getAnonymousUsageRemaining(
  api_type: string = "enhance-image"
): Promise<{ remaining: number; isAuthenticated: boolean }> {
  // 如果浏览器环境不可用，返回默认值
  if (typeof window === "undefined") {
    return { remaining: 0, isAuthenticated: false };
  }

  try {
    // 获取或创建UUID
    const uuid = getOrCreateAnonymousUuid();
    
    if (!uuid) {
      return { remaining: 0, isAuthenticated: false };
    }

    const response = await fetch(
      `/api/anonymous-usage?anonymous_uuid=${encodeURIComponent(uuid)}&api_type=${encodeURIComponent(api_type)}`
    );

    if (!response.ok) {
      // 尝试获取错误详情
      let errorMessage = "Failed to fetch anonymous usage remaining";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // 如果无法解析错误响应，使用默认消息
      }
      console.error(errorMessage, `Status: ${response.status}`);
      return { remaining: 0, isAuthenticated: false };
    }

    const data = await response.json();
    return {
      remaining: data.remaining === -1 ? Infinity : data.remaining,
      isAuthenticated: data.isAuthenticated || false,
    };
  } catch (error) {
    console.error("Error fetching anonymous usage remaining:", error);
    return { remaining: 0, isAuthenticated: false };
  }
}

