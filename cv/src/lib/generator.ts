import { getBrowser } from "@/lib/puppeteer";

export async function generateCV(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}
