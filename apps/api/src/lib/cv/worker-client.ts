import { apiEnv } from "@aecfolio/config";
import type { CvSectionsConfig, CvTemplateOptions } from "@aecfolio/shared";
import type { CvData } from "@aecfolio/ui/manifests";

const RENDER_TIMEOUT_MS = 60_000;
const BUSY_RETRIES = 20;
const VERSION_TTL_MS = 30_000;

export class WorkerError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

export type RenderRequest = {
  templateId: string;
  data: CvData;
  sections: CvSectionsConfig;
  options: CvTemplateOptions;
};

const headers = () => ({
  Authorization: `Bearer ${apiEnv.WORKER_SECRET}`,
});

type WorkerInfo = { version: string; pages: number; fetchedAt: number };

let info: WorkerInfo | null = null;

async function workerInfo(): Promise<WorkerInfo> {
  if (info && Date.now() - info.fetchedAt < VERSION_TTL_MS) return info;

  const res = await fetch(`${apiEnv.WORKER_URL}/version`, {
    headers: headers(),
    signal: AbortSignal.timeout(5_000),
  }).catch((err) => {
    throw new WorkerError(`CV worker unreachable: ${err.message}`);
  });
  if (!res.ok) throw new WorkerError("CV worker refused /version", res.status);

  const body = (await res.json()) as {
    version: string;
    pool: { size: number };
  };
  info = {
    version: body.version,
    pages: Math.max(1, body.pool.size),
    fetchedAt: Date.now(),
  };
  return info;
}

export async function workerRenderVersion(): Promise<string> {
  return (await workerInfo()).version;
}

export async function workerRenderConcurrency(): Promise<number> {
  return (await workerInfo()).pages * 2;
}

export function forgetWorkerVersion() {
  info = null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function renderOnWorker(
  request: RenderRequest,
): Promise<{ pdf: Uint8Array; version: string | null }> {
  const body = JSON.stringify(request);

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${apiEnv.WORKER_URL}/render`, {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(RENDER_TIMEOUT_MS),
    }).catch((err) => {
      throw new WorkerError(`CV worker unreachable: ${err.message}`);
    });

    if (res.status === 503 && attempt < BUSY_RETRIES) {
      await res.body?.cancel();
      await sleep(Math.min(250 * 2 ** Math.min(attempt, 4), 4_000));
      continue;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new WorkerError(
        `CV worker failed (${res.status}): ${text.slice(0, 200)}`,
        res.status,
      );
    }

    return {
      pdf: new Uint8Array(await res.arrayBuffer()),
      version: res.headers.get("x-render-version"),
    };
  }
}
