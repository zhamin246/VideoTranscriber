/**
 * Default LLM for Video Transcriber (Chapter, AI Notes, Ask AI, …).
 * Provider: Kie.ai Gemini 2.5 Flash
 * https://kie.ai/gemini-2.5-flash
 */

export {
  gemini25FlashChat as llmChat,
  gemini25FlashChatStream as llmChatStream,
  gemini25FlashText as llmText,
  parseJsonFromModelText,
  GEMINI_25_FLASH_MODEL as LLM_MODEL,
  type GeminiChatMessage as LlmMessage,
  type GeminiResponseFormat as LlmResponseFormat,
} from "@/lib/kie/gemini-2.5-flash";
