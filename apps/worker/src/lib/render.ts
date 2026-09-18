import type { Page } from "puppeteer";
import type { PagePool } from "./pool";

export const RENDER_TIMEOUT_MS = 30_000;

async function printBody(
  page: Page,
  markup: string,
  title: string,
): Promise<Uint8Array> {
  await page.evaluate(
    async ({ html, title }) => {
      document.title = title;
      document.body.innerHTML = html;
      await Promise.all(
        Array.from(document.images, (img) => img.decode().catch(() => {})),
      );
      await document.fonts.ready;
    },
    { html: markup, title },
  );

  return page.pdf({
    printBackground: true,
    preferCSSPageSize: true,
    timeout: RENDER_TIMEOUT_MS,
  });
}

export async function renderPdf(
  pool: PagePool,
  markup: string,
  title: string,
): Promise<Uint8Array> {
  return pool.run(async (page) => {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`Render exceeded ${RENDER_TIMEOUT_MS}ms`)),
        RENDER_TIMEOUT_MS,
      );
    });
    try {
      return await Promise.race([printBody(page, markup, title), timeout]);
    } finally {
      clearTimeout(timer);
    }
  });
}
