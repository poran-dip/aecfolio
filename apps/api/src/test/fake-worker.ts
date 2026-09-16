import { createServer, type IncomingMessage, type Server } from "node:http";

export const FAKE_PDF = new TextEncoder().encode("%PDF-1.7\n%fake\n%%EOF");

export type RecordedRender = {
  templateId: string;
  // biome-ignore lint/suspicious/noExplicitAny: assertions read the payload freely
  data: any;
  sections: { type: string; customSectionId?: string }[];
  options: Record<string, unknown>;
};

async function readJson(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function startFakeWorker() {
  const state = {
    renders: [] as RecordedRender[],
    version: "v1",
    pages: 2,
    delayMs: 0,
    inFlight: 0,
    maxInFlight: 0,
    failFor: new Set<string>(),
    unauthorized: 0,
  };

  const server: Server = createServer(async (req, res) => {
    if (
      req.headers.authorization !==
      `Bearer ${process.env.WORKER_SECRET as string}`
    ) {
      state.unauthorized += 1;
      res.writeHead(401).end();
      return;
    }

    if (req.url === "/version") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ version: state.version, pool: { size: state.pages } }),
      );
      return;
    }

    if (req.url === "/render" && req.method === "POST") {
      const body = (await readJson(req)) as RecordedRender;
      state.renders.push(body);
      state.inFlight += 1;
      state.maxInFlight = Math.max(state.maxInFlight, state.inFlight);
      await new Promise((resolve) => setTimeout(resolve, state.delayMs));
      state.inFlight -= 1;
      if (state.failFor.has(body.data.student.id)) {
        res.writeHead(500).end("boom");
        return;
      }
      res.writeHead(200, {
        "Content-Type": "application/pdf",
        "X-Render-Version": state.version,
      });
      res.end(Buffer.from(FAKE_PDF));
      return;
    }

    res.writeHead(404).end();
  });

  const url = new URL(process.env.WORKER_URL as string);
  await new Promise<void>((resolve) =>
    server.listen(Number(url.port), url.hostname, resolve),
  );

  return {
    state,
    reset() {
      state.renders = [];
      state.version = "v1";
      state.pages = 2;
      state.delayMs = 0;
      state.inFlight = 0;
      state.maxInFlight = 0;
      state.failFor.clear();
      state.unauthorized = 0;
    },
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
