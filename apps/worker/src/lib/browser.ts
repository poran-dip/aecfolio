import { workerEnv } from "@aecfolio/config";
import puppeteer, { type Browser, type Page } from "puppeteer";
import { shellDocument } from "./document";
import { PagePool } from "./pool";

export const RENDER_QUEUE_MAX = 64;

export function launchBrowser(): Promise<Browser> {
  return puppeteer.launch({
    headless: true,
    ...(workerEnv.PUPPETEER_EXECUTABLE_PATH && {
      executablePath: workerEnv.PUPPETEER_EXECUTABLE_PATH,
    }),
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
    ],
  });
}

export async function preparePage(page: Page): Promise<void> {
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (request.url().startsWith("data:")) request.continue();
    else request.abort("blockedbyclient");
  });
  await page.emulateMediaType("screen");
  await page.setContent(shellDocument(), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
}

export function createPool(
  overrides: Partial<{ size: number; queueMax: number }> = {},
) {
  return new PagePool({
    size: overrides.size ?? workerEnv.WORKER_PAGES,
    queueMax: overrides.queueMax ?? RENDER_QUEUE_MAX,
    launch: launchBrowser,
    prepare: preparePage,
  });
}
