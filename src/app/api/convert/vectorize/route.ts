import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { respData, respErr } from "@/lib/resp";
import { getUuid } from "@/lib/hash";
import { getConvertSample } from "@/lib/convert/samples";
import { loadGrayImage } from "@/lib/convert/load-pixels";
import { vectorizeWithVtracer } from "@/lib/convert/trace-vtracer";
import { persistGeometryJson } from "@/lib/convert/persist-assets";
import { getConvertJobByKey, putConvertJob } from "@/lib/convert/job-store";
import { updateConvertJob } from "@/models/convert-job";
import { pathCount, pointCount } from "@/lib/convert/geometry";

export const maxDuration = 180;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sampleId = String(body.sampleId || "").trim();
    const image = String(body.image || "").trim();
    const title = String(body.title || "").trim();
    const convertJobId = String(body.convertJobId || "").trim();
    const sample = getConvertSample(sampleId);

    if (!sample) {
      const session = await auth();
      const email =
        (session?.user as { email?: string } | undefined)?.email ||
        session?.user?.email ||
        "";
      if (!email) return respErr("Sign in to vectorize your drawing");
    }

    if (!sample && !image) {
      return respErr("image or sampleId is required");
    }

    const force = Boolean(body.force);
    const cacheKey = sample
        ? `sample:v19:${sample.id}`
      : image.startsWith("http") || image.startsWith("/")
        ? `image:v19:${image}`
        : "";
    if (cacheKey && !force) {
      const cached = getConvertJobByKey(cacheKey);
      if (cached) {
        if (convertJobId) {
          try {
            const geometryUrl = await persistGeometryJson(convertJobId, cached.geometry);
            await updateConvertJob(convertJobId, { geometry_url: geometryUrl });
          } catch (persistErr) {
            console.error("persist geometry failed:", persistErr);
          }
        }
        return respData({
          id: cached.id,
          title: cached.title,
          width: cached.geometry.width,
          height: cached.geometry.height,
          pathCount: pathCount(cached.geometry),
          pointCount: pointCount(cached.geometry),
          geometry: cached.geometry,
        });
      }
    }

    const geometry = vectorizeWithVtracer(
      await loadGrayImage({
        sampleId: sample?.id,
        image: sample ? undefined : image,
      })
    );
    if (!geometry.paths.length) {
      return respErr("No linework found to vectorize");
    }

    const id = getUuid();
    const jobTitle = title || sample?.title || "drawing";
    putConvertJob({ id, title: jobTitle, geometry, cacheKey: cacheKey || undefined });

    if (convertJobId) {
      try {
        const geometryUrl = await persistGeometryJson(convertJobId, geometry);
        await updateConvertJob(convertJobId, { geometry_url: geometryUrl });
      } catch (persistErr) {
        console.error("persist geometry failed:", persistErr);
      }
    }

    return respData({
      id,
      title: jobTitle,
      width: geometry.width,
      height: geometry.height,
      pathCount: pathCount(geometry),
      pointCount: pointCount(geometry),
      geometry,
    });
  } catch (e) {
    console.error("vectorize failed:", e);
    return respErr(e instanceof Error ? e.message : "Failed to vectorize linework");
  }
}
