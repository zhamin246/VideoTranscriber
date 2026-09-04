import { NextRequest } from "next/server";
import { fetchMediaPreview } from "@/lib/media/preview";
import { parsePublicHttpsUrl } from "@/lib/media/source-url";
import { respData, respErr } from "@/lib/resp";

export const maxDuration = 30;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { url?: string };
    const parsed = parsePublicHttpsUrl(body?.url || "");
    const preview = await fetchMediaPreview(parsed);
    return respData(preview);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load that link preview.";
    return respErr(message);
  }
}
