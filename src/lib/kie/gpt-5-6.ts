/**
 * Kie GPT-5.6 chat (Luna / Terra / Sol)
 * Docs: https://docs.kie.ai/market/chat/gpt-5-6-luna
 * POST https://api.kie.ai/codex/v1/responses
 */

const KIE_API_BASE = (process.env.KIE_API_BASE || "https://api.kie.ai").replace(
  /\/$/,
  ""
);

export type Gpt56Model = "gpt-5-6-luna" | "gpt-5-6-terra" | "gpt-5-6-sol";
export type ReasoningEffort = "low" | "medium" | "high" | "xhigh";

function apiKey(): string {
  const key = (process.env.KIE_API_KEY || "").trim().replace(/^["']|["']$/g, "");
  if (!key) throw new Error("KIE_API_KEY is not configured");
  return key;
}

type ContentPart =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string };

export type Gpt56Message = {
  role: "user" | "assistant" | "system";
  content: string | ContentPart[];
};

/**
 * Non-streaming completion. Returns assistant plain text.
 */
export async function gpt56Respond(opts: {
  model?: Gpt56Model;
  input: string | Gpt56Message[];
  reasoningEffort?: ReasoningEffort;
  /** Abort / soft timeout via AbortSignal */
  signal?: AbortSignal;
}): Promise<{ text: string; raw: unknown; creditsConsumed?: number }> {
  const model = opts.model || "gpt-5-6-luna";
  const input =
    typeof opts.input === "string"
      ? opts.input
      : opts.input.map((m) => ({
          role: m.role,
          content:
            typeof m.content === "string"
              ? [{ type: "input_text" as const, text: m.content }]
              : m.content,
        }));

  const res = await fetch(`${KIE_API_BASE}/codex/v1/responses`, {
    method: "POST",
    signal: opts.signal,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: false,
      input,
      reasoning: { effort: opts.reasoningEffort || "low" },
    }),
  });

  const raw = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      raw?.error?.message ||
      raw?.msg ||
      raw?.message ||
      `Kie GPT-5.6 HTTP ${res.status}`;
    throw new Error(msg);
  }

  const text = extractAssistantText(raw);
  if (!text) {
    throw new Error("Kie GPT-5.6 returned empty text");
  }

  return {
    text,
    raw,
    creditsConsumed:
      typeof raw?.credits_consumed === "number"
        ? raw.credits_consumed
        : undefined,
  };
}

function extractAssistantText(raw: any): string {
  if (!raw || typeof raw !== "object") return "";

  // Shape A: { output: [ { type: "message", content: [ { type: "output_text", text } ] } ] }
  if (Array.isArray(raw.output)) {
    const chunks: string[] = [];
    for (const item of raw.output) {
      if (item?.type === "message" && Array.isArray(item.content)) {
        for (const c of item.content) {
          if (c?.type === "output_text" && typeof c.text === "string") {
            chunks.push(c.text);
          }
          if (typeof c?.text === "string" && c.type !== "reasoning") {
            if (c.type === "output_text" || !c.type) chunks.push(c.text);
          }
        }
      }
      if (typeof item?.text === "string") chunks.push(item.text);
    }
    if (chunks.length) return chunks.join("");
  }

  // Shape B: OpenAI-ish choices
  const choiceText = raw?.choices?.[0]?.message?.content;
  if (typeof choiceText === "string") return choiceText;

  // Shape C: flat fields
  if (typeof raw.output_text === "string") return raw.output_text;
  if (typeof raw.text === "string") return raw.text;
  if (typeof raw.result === "string") return raw.result;

  return "";
}

/** First complete `{ ... }` object via brace depth (ignores braces inside strings). */
function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

/** Pull JSON object from model text (handles ```json fences + trailing prose). */
export function parseJsonFromModelText<T = unknown>(text: string): T {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    /* continue */
  }
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) {
    const inner = fence[1].trim();
    try {
      return JSON.parse(inner) as T;
    } catch {
      const fromFence = extractFirstJsonObject(inner);
      if (fromFence) return JSON.parse(fromFence) as T;
    }
  }
  const extracted = extractFirstJsonObject(trimmed);
  if (extracted) {
    return JSON.parse(extracted) as T;
  }
  throw new Error("Model did not return valid JSON");
}
