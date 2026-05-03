import puppeteer, { type Browser } from "puppeteer";

let browser: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (browser?.connected) {
    return browser;
  }

  browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  browser.on("disconnected", () => {
    browser = null;
  });

  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
