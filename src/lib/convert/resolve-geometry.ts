import {
  fetchGeometryJson,
  persistGeometryJson,
} from "@/lib/convert/persist-assets";
import { getConvertJob, putConvertJob } from "@/lib/convert/job-store";
import { isCadGeometry, type CadGeometry } from "@/lib/convert/geometry";
import { findConvertJobByUuid, updateConvertJob } from "@/models/convert-job";

export async function resolveConvertGeometry(opts: {
  id?: string;
  geometry?: unknown;
  persist?: boolean;
}): Promise<{ geometry: CadGeometry; title: string } | null> {
  const id = (opts.id || "").trim();
  const mem = id ? getConvertJob(id) : null;
  if (mem?.geometry) {
    return { geometry: mem.geometry, title: mem.title };
  }

  if (id) {
    const row = await findConvertJobByUuid(id);
    if (row?.geometry_url) {
      const stored = await fetchGeometryJson(row.geometry_url);
      if (stored) {
        putConvertJob({ id, title: row.title || "drawing", geometry: stored });
        return { geometry: stored, title: row.title || "drawing" };
      }
    }
  }

  if (!isCadGeometry(opts.geometry)) return null;
  const geometry = opts.geometry;
  const title = mem?.title || "drawing";

  if (id) {
    putConvertJob({ id, title, geometry });
    if (opts.persist) {
      try {
        const geometryUrl = await persistGeometryJson(id, geometry);
        await updateConvertJob(id, { geometry_url: geometryUrl });
      } catch (e) {
        console.error("persist geometry failed:", e);
      }
    }
  }

  return { geometry, title };
}
