export const CONVERT_RECENT_LIMIT = 8;

export type ConvertHistoryItem = {
  id: string;
  title: string;
  thumbUrl: string;
  originalUrl: string;
  vectorUrl: string;
  createdAt?: string | null;
};
