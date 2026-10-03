import { NextRequest } from "next/server";

import { fetchGladiaJobStatus } from "@/lib/media/gladia";

import {

  persistTranscriptionResult,

  type TranscribeWorkspaceMeta,

} from "@/lib/media/finalize-transcription-save";

import { respData, respErr } from "@/lib/resp";

import { getUserUuid } from "@/services/user";



export const runtime = "nodejs";

export const maxDuration = 30;



async function handlePoll(input: {

  jobId: string;

  workspaceId: string;

  durationSeconds: number | null;

  workspace?: TranscribeWorkspaceMeta | null;

}) {

  const st = await fetchGladiaJobStatus(input.jobId);



  if (st.status === "processing") {

    return respData({ status: "processing" as const, gladiaJobId: input.jobId });

  }



  if (st.status === "error") {

    return respErr(st.error || "Gladia transcription failed.");

  }



  if (!st.result) {

    return respErr("Gladia returned an empty transcript.");

  }



  const text = (st.result.text || "").trim();

  const segments = st.result.segments || [];

  if (!text && !segments.length) {

    return respErr("Gladia returned no transcript text.");

  }



  const user_uuid = await getUserUuid();

  if (!user_uuid) {

    return respErr("Please sign in again to save this transcript.");

  }



  const meta = input.workspace;

  if (!meta) {

    return respErr(

      "Gladia finished but workspace metadata was missing — cannot save to My files. Use POST /api/media/transcribe/status with a workspace object.",

    );

  }



  try {

    const saveExtras = await persistTranscriptionResult({

      userUuid: user_uuid,

      workspaceId: input.workspaceId,

      durationSeconds: input.durationSeconds,

      provider: "gladia",

      meta,

      result: st.result,

      fallbackUrls: {

        playbackUrl: meta.playbackUrl,

        sourceUrl: meta.url,

      },

    });



    return respData({

      status: "done" as const,

      gladiaJobId: input.jobId,

      text: st.result.text,

      segments: st.result.segments,

      language: st.result.language,

      minutesCharged: saveExtras.minutesCharged,

      minutesDebitFailed: saveExtras.minutesDebitFailed,

      savedToDatabase: true,

    });

  } catch (e) {

    console.error("[transcribe/status] save workspace failed:", e);

    return respErr(

      e instanceof Error

        ? e.message

        : "Gladia finished but the transcript could not be saved to My files.",

    );

  }

}



/** One Gladia status check (legacy GET — cannot persist without POST body). */

export async function GET(req: NextRequest) {

  try {

    const jobId = req.nextUrl.searchParams.get("jobId")?.trim() || "";

    const workspaceId =

      req.nextUrl.searchParams.get("workspaceId")?.trim().slice(0, 64) || "";

    const durRaw = Number(req.nextUrl.searchParams.get("durationSeconds"));

    const durationSeconds =

      Number.isFinite(durRaw) && durRaw > 0 ? durRaw : null;



    if (!jobId) {

      return respErr("jobId is required");

    }



    return handlePoll({ jobId, workspaceId, durationSeconds, workspace: null });

  } catch (e) {

    const message = e instanceof Error ? e.message : "Status check failed";

    console.error("[transcribe/status]", e);

    return respErr(message);

  }

}



/** Poll Gladia and persist My files when done (preferred). */

export async function POST(req: NextRequest) {

  try {

    const body = (await req.json().catch(() => null)) as {

      jobId?: string;

      workspaceId?: string;

      durationSeconds?: number | null;

      workspace?: TranscribeWorkspaceMeta;

    } | null;



    const jobId = String(body?.jobId || "").trim();

    const workspaceId = String(body?.workspaceId || "").trim().slice(0, 64);

    const durRaw = Number(body?.durationSeconds);

    const durationSeconds =

      Number.isFinite(durRaw) && durRaw > 0 ? durRaw : null;



    if (!jobId) {

      return respErr("jobId is required");

    }



    return handlePoll({

      jobId,

      workspaceId,

      durationSeconds,

      workspace: body?.workspace || null,

    });

  } catch (e) {

    const message = e instanceof Error ? e.message : "Status check failed";

    console.error("[transcribe/status]", e);

    return respErr(message);

  }

}

