import { getBrowser } from "@/lib/puppeteer";
import { inlineExternalResources } from "@/lib/inline-html";

export async function generateCV(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    const inlinedHtml = await inlineExternalResources(html);
    await page.emulateMediaType("screen");
    await page.setContent(inlinedHtml, { waitUntil: "domcontentloaded", timeout: 30000 });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}
