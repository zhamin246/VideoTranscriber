/**
 * Kie.ai Market Jobs API client
 * Docs: https://docs.kie.ai/
 * Base: https://api.kie.ai
 */

const KIE_API_BASE = (process.env.KIE_API_BASE || "https://api.kie.ai").replace(
  /\/$/,
  ""
);

export type KieTaskState =
  | "waiting"
  | "queuing"
  | "generating"
  | "success"
  | "fail";

export type KieApiResponse<T> = {
  code: number;
  msg: string;
  data: T;
};

export type KieCreateTaskResult = {
  taskId: string;
};

export type KieTaskRecord = {
  taskId: string;
  model: string;
  state: KieTaskState;
  param?: string;
  resultJson?: string;
  failCode?: string;
  failMsg?: string;
  costTime?: number;
  completeTime?: number;
  createTime?: number;
  updateTime?: number;
  progress?: number;
  creditsConsumed?: number;
};

function apiKey(): string {
  const key = (process.env.KIE_API_KEY || "").trim().replace(/^["']|["']$/g, "");
  if (!key) {
    throw new Error("KIE_API_KEY is not configured");
  }
  return key;
}

async function kieFetch<T>(
  path: string,
  init?: RequestInit
): Promise<KieApiResponse<T>> {
  const res = await fetch(`${KIE_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const json = (await res.json().catch(() => null)) as KieApiResponse<T> | null;
  if (!json) {
    throw new Error(`Kie API empty response (${res.status})`);
  }
  if (json.code !== 200) {
    throw new Error(json.msg || `Kie API error code ${json.code}`);
  }
  return json;
}

/** Create a Market model task (async). */
export async function kieCreateTask(body: {
  model: string;
  input: Record<string, unknown>;
  callBackUrl?: string;
}): Promise<string> {
  const json = await kieFetch<KieCreateTaskResult>("/api/v1/jobs/createTask", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const taskId = json.data?.taskId;
  if (!taskId) throw new Error("Kie createTask returned no taskId");
  return taskId;
}

/** Query task status / results. */
export async function kieGetTask(taskId: string): Promise<KieTaskRecord> {
  const q = encodeURIComponent(taskId);
  const json = await kieFetch<KieTaskRecord>(
    `/api/v1/jobs/recordInfo?taskId=${q}`,
    { method: "GET" }
  );
  if (!json.data?.taskId) {
    throw new Error("Kie recordInfo returned empty task");
  }
  return json.data;
}

/** Parse resultUrls from a successful task's resultJson string. */
export function parseKieResultUrls(task: KieTaskRecord): string[] {
  if (!task.resultJson) return [];
  try {
    const parsed = JSON.parse(task.resultJson) as { resultUrls?: string[] };
    return Array.isArray(parsed.resultUrls) ? parsed.resultUrls.filter(Boolean) : [];
  } catch {
    return [];
  }
}

/**
 * Poll until success/fail or timeout.
 * Prefer callBackUrl in production instead of long polling.
 */
export async function kieWaitForTask(
  taskId: string,
  opts?: { timeoutMs?: number; intervalMs?: number }
): Promise<KieTaskRecord> {
  const timeoutMs = opts?.timeoutMs ?? 10 * 60_000;
  const intervalMs = opts?.intervalMs ?? 3_000;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const task = await kieGetTask(taskId);
    if (task.state === "success" || task.state === "fail") {
      return task;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Kie task ${taskId} timed out after ${timeoutMs}ms`);
}
