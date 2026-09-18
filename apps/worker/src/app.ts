import { workerEnv } from "@aecfolio/config";
import {
  cvSectionsConfigSchema,
  cvTemplateOptionsSchema,
  stripInlineMarkdown,
} from "@aecfolio/shared";
import type { CvData } from "@aecfolio/ui";
import { getTemplate } from "@aecfolio/ui";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { renderToStaticMarkup } from "react-dom/server";
import { z } from "zod";
import { requireSecret } from "./lib/auth";
import { type PagePool, QueueFullError } from "./lib/pool";
import { renderPdf } from "./lib/render";
import { renderVersion } from "./lib/version";

export const MAX_RENDER_BODY_BYTES = 8 * 1024 * 1024;

const renderRequestSchema = z.object({
  templateId: z.string().min(1),
  data: z
    .object({
      student: z.object({ id: z.string() }).loose(),
      user: z.object({ id: z.string() }).loose(),
    })
    .loose(),
  sections: cvSectionsConfigSchema.optional(),
  options: cvTemplateOptionsSchema.optional(),
});

export type CreateAppOptions = {
  pool: PagePool;
  secret?: string;
};

export function createApp({ pool, secret }: CreateAppOptions) {
  return new Hono()
    .get("/", (c) => c.text("CV worker running"))

    .get("/health", async (c) => {
      await pool.warm();
      return c.json({ status: "ok" });
    })

    .use("*", requireSecret(secret ?? workerEnv.WORKER_SECRET))

    .get("/version", (c) =>
      c.json({ version: renderVersion(), pool: pool.stats() }),
    )

    .post(
      "/render",
      bodyLimit({
        maxSize: MAX_RENDER_BODY_BYTES,
        onError: (c) => c.json({ error: "Payload too large" }, 413),
      }),
      async (c) => {
        const parsed = renderRequestSchema.safeParse(
          await c.req.json().catch(() => null),
        );
        if (!parsed.success)
          return c.json({ error: "Invalid render request" }, 400);

        const { templateId, data, sections, options } = parsed.data;
        const template = getTemplate(templateId);
        if (!template) return c.json({ error: "Unknown template" }, 400);

        let markup: string;
        try {
          markup = renderToStaticMarkup(
            template.render({
              data: data as unknown as CvData,
              sections,
              options,
            }),
          );
        } catch (err) {
          console.error("[render] template failed:", err);
          return c.json({ error: "Template could not render this data" }, 422);
        }

        const rawName = (data.user as { name?: unknown }).name;
        const studentName =
          typeof rawName === "string" && rawName.trim()
            ? stripInlineMarkdown(rawName.trim())
            : "";
        const title = studentName ? `${studentName} Resume` : "Resume";

        const started = performance.now();
        try {
          const pdf = await renderPdf(pool, markup, title);
          return new Response(new Uint8Array(pdf), {
            headers: {
              "Content-Type": "application/pdf",
              "X-Render-Version": renderVersion(),
              "X-Render-Ms": String(Math.round(performance.now() - started)),
            },
          });
        } catch (err) {
          if (err instanceof QueueFullError) {
            c.header("Retry-After", "1");
            return c.json({ error: "Worker is busy" }, 503);
          }
          console.error("[render] PDF generation failed:", err);
          return c.json({ error: "Failed to generate PDF" }, 500);
        }
      },
    );
}

export type AppType = ReturnType<typeof createApp>;
