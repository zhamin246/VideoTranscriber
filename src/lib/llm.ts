/**
 * Default LLM for Video Transcriber (Chapter, AI Notes, Ask AI, …).
 * Provider: Kie.ai DeepSeek V4.1 Flash
 * https://kie.ai/deepseek-v4-1-Flash
 */

export {
  deepseekV41Chat as llmChat,
  deepseekV41ChatStream as llmChatStream,
  deepseekV41Text as llmText,
  parseJsonFromModelText,
  DEEPSEEK_V41_MODEL as LLM_MODEL,
  type GeminiChatMessage as LlmMessage,
  type GeminiResponseFormat as LlmResponseFormat,
} from "@/lib/kie/deepseek-v4-1-flash";
