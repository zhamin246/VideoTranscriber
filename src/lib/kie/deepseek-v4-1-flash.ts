/**
 * Kie.ai DeepSeek V4.1 Flash (OpenAI Responses API)
 * Docs: https://docs.kie.ai/market/deepseek-v4-1-flash
 * POST https://api.kie.ai/openai/v1/responses
 */

import {
  extractAssistantText,
  parseJsonFromModelText,
} from "@/lib/kie/gpt-5-6";

const KIE_API_BASE = (process.env.KIE_API_BASE || "https://api.kie.ai").replace(
  /\/$/,
  "",
);

export const DEEPSEEK_V41_RESPONSES_PATH = (
  process.env.KIE_LLM_RESPONSES_PATH || "/openai/v1/responses"
).trim();

export const DEEPSEEK_V41_MODEL =
  process.env.KIE_LLM_MODEL?.trim() || "deepseek-v4-1-flash";

const PRODUCT_LABEL = "Kie DeepSeek V4.1 Flash";

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
  properties?: Record<string, unknown>;
};

function messageText(content: string | GeminiContentPart[]): string {
  if (typeof content === "string") return content;
  return content
    .map((p) => (p.type === "text" ? p.text : ""))
    .filter(Boolean)
    .join("\n");
}

function toUserContent(
  content: string | GeminiContentPart[],
): string | Array<{ type: string; text?: string; image_url?: string }> {
  if (typeof content === "string") {
    return [{ type: "input_text", text: content }];
  }
  return content.map((p) => {
    if (p.type === "text") {
      return { type: "input_text", text: p.text };
    }
    return { type: "input_image", image_url: p.image_url.url };
  });
}

function buildResponsesPayload(opts: {
  messages: GeminiChatMessage[];
  stream: boolean;
  includeThoughts?: boolean;
  responseFormat?: GeminiResponseFormat;
}) {
  const instructionParts: string[] = [];
  const input: Record<string, unknown>[] = [];

  for (const m of opts.messages) {
    if (m.role === "system" || m.role === "developer") {
      const t = messageText(m.content).trim();
      if (t) instructionParts.push(t);
      continue;
    }
    if (m.role === "assistant") {
      const text = messageText(m.content).trim();
      if (!text) continue;
      input.push({
        role: "assistant",
        content: [{ type: "output_text", text }],
      });
      continue;
    }
    if (m.role === "user") {
      input.push({
        role: "user",
        content: toUserContent(m.content),
      });
    }
  }

  const body: Record<string, unknown> = {
    model: DEEPSEEK_V41_MODEL,
    stream: opts.stream,
    input: input.length === 1 && typeof input[0]?.content === "string"
      ? input
      : input,
    reasoning: {
      effort: opts.includeThoughts ? "low" : "none",
    },
  };

  const instructions = instructionParts.join("\n\n").trim();
  if (instructions) body.instructions = instructions;

  if (opts.responseFormat) {
    const js = opts.responseFormat.json_schema;
    body.text = {
      format: {
        type: "json_schema",
        name: js?.name || "structured_output",
        strict: js?.strict ?? true,
        schema: js?.schema || opts.responseFormat.properties || {},
      },
    };
  }

  return body;
}

function kieErrorMessage(raw: unknown, httpStatus: number): string {
  if (!raw || typeof raw !== "object") {
    return `${PRODUCT_LABEL} HTTP ${httpStatus}`;
  }
  const obj = raw as Record<string, unknown>;
  const err = obj.error as Record<string, unknown> | undefined;
  return (
    String(err?.message || "").trim() ||
    String(obj.msg || "").trim() ||
    String(obj.message || "").trim() ||
    `${PRODUCT_LABEL} HTTP ${httpStatus}`
  );
}

function assertKieSuccess(raw: unknown, httpStatus: number) {
  if (!raw || typeof raw !== "object") return;
  const obj = raw as Record<string, unknown>;
  const code = Number(obj.code);
  if (Number.isFinite(code) && code !== 0 && code !== 200) {
    throw new Error(kieErrorMessage(raw, httpStatus));
  }
  const status = String(
    (obj as { status?: string }).status ||
      (obj as { data?: { status?: string } }).data?.status ||
      "",
  ).toLowerCase();
  if (status === "failed" || status === "error") {
    throw new Error(kieErrorMessage(raw, httpStatus));
  }
}

export async function deepseekV41Chat(opts: {
  messages: GeminiChatMessage[];
  stream?: boolean;
  includeThoughts?: boolean;
  responseFormat?: GeminiResponseFormat;
  signal?: AbortSignal;
}): Promise<{ text: string; raw: unknown }> {
  if (!opts.messages?.length) {
    throw new Error("deepseekV41Chat requires at least one message");
  }

  const res = await fetch(`${KIE_API_BASE}${DEEPSEEK_V41_RESPONSES_PATH}`, {
    method: "POST",
    signal: opts.signal,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(
      buildResponsesPayload({
        messages: opts.messages,
        stream: false,
        includeThoughts: opts.includeThoughts,
        responseFormat: opts.responseFormat,
      }),
    ),
  });

  const raw = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(kieErrorMessage(raw, res.status));
  }
  assertKieSuccess(raw, res.status);

  const text = extractAssistantText(raw);
  if (!text.trim()) {
    console.error(
      "[deepseekV41Chat] empty content, raw keys:",
      raw && typeof raw === "object" ? Object.keys(raw as object) : raw,
    );
    throw new Error(`${PRODUCT_LABEL} returned empty text`);
  }

  return { text, raw };
}

export async function* deepseekV41ChatStream(opts: {
  messages: GeminiChatMessage[];
  includeThoughts?: boolean;
  signal?: AbortSignal;
}): AsyncGenerator<string, void, unknown> {
  if (!opts.messages?.length) {
    throw new Error("deepseekV41ChatStream requires at least one message");
  }

  const res = await fetch(`${KIE_API_BASE}${DEEPSEEK_V41_RESPONSES_PATH}`, {
    method: "POST",
    signal: opts.signal,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(
      buildResponsesPayload({
        messages: opts.messages,
        stream: true,
        includeThoughts: opts.includeThoughts,
      }),
    ),
  });

  if (!res.ok) {
    const raw = await res.json().catch(() => null);
    throw new Error(kieErrorMessage(raw, res.status));
  }

  if (!res.body) {
    throw new Error(`${PRODUCT_LABEL} returned empty stream body`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let lastEvent = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split(/\r?\n/);
      buffer = parts.pop() ?? "";

      for (const line of parts) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith("event:")) {
          lastEvent = trimmed.slice(6).trim();
          continue;
        }
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (!data || data === "[DONE]") continue;

        try {
          const json = JSON.parse(data) as Record<string, unknown>;
          assertKieSuccess(json, 200);
          const type = String(json.type || lastEvent || "");
          const delta = String(json.delta || "");
          if (
            delta &&
            (type.includes("output_text.delta") ||
              lastEvent.includes("output_text.delta"))
          ) {
            yield delta;
            continue;
          }
          const fromSnapshot = extractAssistantText(json.response ?? json);
          if (fromSnapshot) yield fromSnapshot;
        } catch (e) {
          if (e instanceof Error && e.message.includes(PRODUCT_LABEL)) throw e;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function deepseekV41Text(opts: {
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
  const { text } = await deepseekV41Chat({
    messages,
    includeThoughts: opts.includeThoughts,
    responseFormat: opts.responseFormat,
    signal: opts.signal,
  });
  return text;
}

export { parseJsonFromModelText };
