import { randomBytes } from "crypto";

type CacheEntry = {
  buf: Buffer;
  contentType: string;
  filename: string;
  createdAt: number;
};

const TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_ENTRIES = 24;
const MAX_BYTES = 80 * 1024 * 1024;

const g = globalThis as typeof globalThis & {
  __vtPlaybackCache?: Map<string, CacheEntry>;
};

function store() {
  if (!g.__vtPlaybackCache) g.__vtPlaybackCache = new Map();
  return g.__vtPlaybackCache;
}

function prune(map: Map<string, CacheEntry>) {
  const now = Date.now();
  for (const [id, entry] of map) {
    if (now - entry.createdAt > TTL_MS) map.delete(id);
  }
  while (map.size > MAX_ENTRIES) {
    const oldest = map.keys().next().value;
    if (!oldest) break;
    map.delete(oldest);
  }
}

export function putPlaybackCache(input: {
  buf: Buffer;
  contentType?: string;
  filename?: string;
}): string {
  if (input.buf.byteLength > MAX_BYTES) {
    throw new Error("That file is too large to cache for playback.");
  }
  const map = store();
  prune(map);
  const id = randomBytes(12).toString("hex");
  map.set(id, {
    buf: input.buf,
    contentType: input.contentType || "video/mp4",
    filename: input.filename || "media.mp4",
    createdAt: Date.now(),
  });
  return id;
}

export function getPlaybackCache(id: string): CacheEntry | null {
  if (!id || !/^[a-f0-9]{16,64}$/i.test(id)) return null;
  const map = store();
  prune(map);
  const entry = map.get(id);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > TTL_MS) {
    map.delete(id);
    return null;
  }
  return entry;
}
