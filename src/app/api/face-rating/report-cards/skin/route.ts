import { NextRequest } from "next/server";
import { POST as postByKind } from "../[kind]/route";

/**
 * POST /api/face-rating/report-cards/skin
 * Alias → unified [kind] handler (skin).
 */
export async function POST(req: NextRequest) {
  return postByKind(req, { params: Promise.resolve({ kind: "skin" }) });
}
