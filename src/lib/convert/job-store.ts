import type { CadGeometry } from "./geometry";

type Job = {
  id: string;
  title: string;
  geometry: CadGeometry;
  createdAt: number;
};

const TTL_MS = 60 * 60 * 1000;
const jobs = new Map<string, Job>();
const byKey = new Map<string, string>();

function prune() {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - job.createdAt > TTL_MS) {
      jobs.delete(id);
    }
  }
}

export function putConvertJob(input: {
  id: string;
  title: string;
  geometry: CadGeometry;
  cacheKey?: string;
}) {
  prune();
  jobs.set(input.id, {
    id: input.id,
    title: input.title,
    geometry: input.geometry,
    createdAt: Date.now(),
  });
  if (input.cacheKey) byKey.set(input.cacheKey, input.id);
}

export function getConvertJob(id: string) {
  prune();
  return jobs.get(id) || null;
}

export function getConvertJobByKey(cacheKey: string) {
  prune();
  const id = byKey.get(cacheKey);
  return id ? getConvertJob(id) : null;
}
