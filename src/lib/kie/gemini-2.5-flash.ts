/**
 * @deprecated Flash channel returns 422 on some Kie accounts — use gemini-2.5-pro.
 */
export {
  gemini25ProChat as gemini25FlashChat,
  gemini25ProChatStream as gemini25FlashChatStream,
  gemini25ProText as gemini25FlashText,
  GEMINI_25_PRO_PATH as GEMINI_25_FLASH_PATH,
  GEMINI_25_PRO_MODEL as GEMINI_25_FLASH_MODEL,
  parseJsonFromModelText,
  type GeminiChatMessage,
  type GeminiContentPart,
  type GeminiResponseFormat,
} from "@/lib/kie/gemini-2.5-pro";
