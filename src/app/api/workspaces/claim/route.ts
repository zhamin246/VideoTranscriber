import { NextRequest } from "next/server";
import { claimOrphanWorkspaces } from "@/models/workspace";
import { respData, respErr } from "@/lib/resp";
import { getUserUuid } from "@/services/user";

export const runtime = "nodejs";

/** Attach legacy workspaces (saved before sign-in) to the current user. */
export async function POST(req: NextRequest) {
  try {
    const userUuid = (await getUserUuid()) || "";
    if (!userUuid) {
      return respErr("Please sign in");
    }

    const body = (await req.json().catch(() => null)) as {
      workspaceIds?: string[];
    } | null;
    const workspaceIds = Array.isArray(body?.workspaceIds)
      ? body!.workspaceIds!
      : [];

    const claimed = await claimOrphanWorkspaces(userUuid, workspaceIds);
    return respData({ claimed });
  } catch (e) {
    console.error("[workspaces/claim]", e);
    return respErr(e instanceof Error ? e.message : "Claim failed");
  }
}
