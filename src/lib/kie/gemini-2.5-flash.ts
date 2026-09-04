/**
 * Kie.ai Gemini 2.5 Flash (OpenAI-compatible chat)
 * Docs: https://docs.kie.ai/market/gemini/gemini-2-5-flash
 * Product: https://kie.ai/gemini-2.5-flash
 * POST https://api.kie.ai/gemini-2.5-flash/v1/chat/completions
 */

import { parseJsonFromModelText } from "@/lib/kie/gpt-5-6";

const KIE_API_BASE = (process.env.KIE_API_BASE || "https://api.kie.ai").replace(
  /\/$/,
  "",
);

export const GEMINI_25_FLASH_PATH = "/gemini-2.5-flash/v1/chat/completions";
/** Playground / market model id (path already selects the model). */
export const GEMINI_25_FLASH_MODEL = "gemini-2.5-flash-openai";

function apiKey(): string {
  const key = (process.env.KIE_API_KEY || "").trim().replace(/^["']|["']$/g, "");
  if (!key) throw new Error("KIE_API_KEY is not configured");
  return key;
}

export type GeminiContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type GeminiChatMessage = {
  role: "system" | "user" | "assistant" | "developer" | "tool";
  content: string | GeminiContentPart[];
};

export type GeminiResponseFormat = {
  type: "json_schema";
  json_schema?: {
    name?: string;
    strict?: boolean;
    schema: Record<string, unknown>;
  };
  /** Some Kie examples put properties at the top level. */
  properties?: Record<string, unknown>;
};

function normalizeContent(
  content: string | GeminiContentPart[],
): string | GeminiContentPart[] {
  if (typeof content === "string") {
    return [{ type: "text", text: content }];
  }
  return content;
}

function extractChatText(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "";
  const obj = raw as Record<string, unknown>;

  const choice = (obj.choices as unknown[] | undefined)?.[0] as
    | Record<string, unknown>
    | undefined;
  const message = choice?.message as Record<string, unknown> | undefined;
  const content = message?.content;
  if (typeof content === "string" && content.trim()) return content.trim();
  if (Array.isArray(content)) {
    const parts = content
      .map((p) => {
        if (!p || typeof p !== "object") return "";
        const row = p as Record<string, unknown>;
        if (typeof row.text === "string") return row.text;
        if (row.type === "text" && typeof row.text === "string") return row.text;
        return "";
      })
      .filter(Boolean);
    if (parts.length) return parts.join("");
  }

  if (typeof obj.output_text === "string") return obj.output_text.trim();
  if (typeof obj.text === "string") return obj.text.trim();
  return "";
}

function buildChatBody(opts: {
  messages: GeminiChatMessage[];
  stream: boolean;
  includeThoughts?: boolean;
  responseFormat?: GeminiResponseFormat;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    messages: opts.messages.map((m) => ({
      role: m.role,
      content: normalizeContent(m.content),
    })),
    stream: opts.stream,
    include_thoughts: opts.includeThoughts ?? false,
  };
  if (opts.responseFormat) {
    body.response_format = opts.responseFormat;
  }
  return body;
}

function extractDeltaText(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "";
  const obj = raw as Record<string, unknown>;
  const choice = (obj.choices as unknown[] | undefined)?.[0] as
    | Record<string, unknown>
    | undefined;
  if (!choice) return "";

  const delta = choice.delta as Record<string, unknown> | undefined;
  if (delta) {
    const content = delta.content;
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content
        .map((p) => {
          if (!p || typeof p !== "object") return "";
          const row = p as Record<string, unknown>;
          return typeof row.text === "string" ? row.text : "";
        })
        .join("");
    }
  }

  // Some providers stream full message snapshots
  const message = choice.message as Record<string, unknown> | undefined;
  if (message && typeof message.content === "string") {
    return message.content;
  }
  return "";
}

/**
 * Non-streaming Gemini 2.5 Flash completion via Kie.
 * Uses existing `KIE_API_KEY` (same key as GPT Image / GPT-5.6).
 */
export async function gemini25FlashChat(opts: {
  messages: GeminiChatMessage[];
  /** Default false — sync JSON for server routes. */
  stream?: boolean;
  /** Default false — cheaper/faster for Chapter / Notes. */
  includeThoughts?: boolean;
  responseFormat?: GeminiResponseFormat;
  signal?: AbortSignal;
}): Promise<{ text: string; raw: unknown }> {
  if (!opts.messages?.length) {
    throw new Error("gemini25FlashChat requires at least one message");
  }

  const res = await fetch(`${KIE_API_BASE}${GEMINI_25_FLASH_PATH}`, {
    method: "POST",
    signal: opts.signal,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(
      buildChatBody({
        messages: opts.messages,
        stream: opts.stream ?? false,
        includeThoughts: opts.includeThoughts,
        responseFormat: opts.responseFormat,
      }),
    ),
  });

  const raw = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      (raw as { error?: { message?: string }; msg?: string; message?: string } | null)
        ?.error?.message ||
      (raw as { msg?: string } | null)?.msg ||
      (raw as { message?: string } | null)?.message ||
      `Kie Gemini 2.5 Flash HTTP ${res.status}`;
    throw new Error(msg);
  }

  const text = extractChatText(raw);
  if (!text) {
    throw new Error("Kie Gemini 2.5 Flash returned empty text");
  }

  return { text, raw };
}

/**
 * Streaming Gemini 2.5 Flash via Kie (OpenAI-compatible SSE).
 * Yields incremental text deltas.
 */
export async function* gemini25FlashChatStream(opts: {
  messages: GeminiChatMessage[];
  includeThoughts?: boolean;
  signal?: AbortSignal;
}): AsyncGenerator<string, void, unknown> {
  if (!opts.messages?.length) {
    throw new Error("gemini25FlashChatStream requires at least one message");
  }

  const res = await fetch(`${KIE_API_BASE}${GEMINI_25_FLASH_PATH}`, {
    method: "POST",
    signal: opts.signal,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(
      buildChatBody({
        messages: opts.messages,
        stream: true,
        includeThoughts: opts.includeThoughts ?? false,
      }),
    ),
  });

  if (!res.ok) {
    const raw = await res.json().catch(() => null);
    const msg =
      (raw as { error?: { message?: string }; msg?: string; message?: string } | null)
        ?.error?.message ||
      (raw as { msg?: string } | null)?.msg ||
      (raw as { message?: string } | null)?.message ||
      `Kie Gemini 2.5 Flash HTTP ${res.status}`;
    throw new Error(msg);
  }

  if (!res.body) {
    throw new Error("Kie Gemini 2.5 Flash returned empty stream body");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split(/\r?\n/);
      buffer = parts.pop() ?? "";

      for (const line of parts) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(":")) continue;
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (!data || data === "[DONE]") {
          if (data === "[DONE]") return;
          continue;
        }
        try {
          const json = JSON.parse(data) as unknown;
          const delta = extractDeltaText(json);
          if (delta) yield delta;
        } catch {
          // ignore malformed SSE chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/** Convenience: one user prompt (+ optional system). */
export async function gemini25FlashText(opts: {
  prompt: string;
  system?: string;
  includeThoughts?: boolean;
  responseFormat?: GeminiResponseFormat;
  signal?: AbortSignal;
}): Promise<string> {
  const messages: GeminiChatMessage[] = [];
  if (opts.system?.trim()) {
    messages.push({ role: "system", content: opts.system.trim() });
  }
  messages.push({ role: "user", content: opts.prompt });
  const { text } = await gemini25FlashChat({
    messages,
    includeThoughts: opts.includeThoughts,
    responseFormat: opts.responseFormat,
    signal: opts.signal,
  });
  return text;
}

export { parseJsonFromModelText };
