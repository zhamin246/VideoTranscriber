/** @deprecated Use deepseek-v4-1-flash via `@/lib/llm`. */
export {
  deepseekV41Chat as gemini25ProChat,
  deepseekV41ChatStream as gemini25ProChatStream,
  deepseekV41Text as gemini25ProText,
  DEEPSEEK_V41_MODEL as GEMINI_25_PRO_MODEL,
  DEEPSEEK_V41_RESPONSES_PATH as GEMINI_25_PRO_PATH,
  parseJsonFromModelText,
  type GeminiChatMessage,
  type GeminiContentPart,
  type GeminiResponseFormat,
} from "@/lib/kie/deepseek-v4-1-flash";
