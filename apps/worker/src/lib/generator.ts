import { renderToStaticMarkup } from "react-dom/server";
import { inlineImages } from "./inline-html";
import { getBrowser } from "./puppeteer";

export async function generateCV(element: React.ReactElement): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    const html = renderToStaticMarkup(element);
    const inlined = await inlineImages(html);
  
    const fontFaceBlock = `<style>
      @font-face { font-family: 'Outfit'; font-weight: 300; src: url('/fonts/outfit/Outfit-Light.ttf') format('truetype'); }
      @font-face { font-family: 'Outfit'; font-weight: 400; src: url('/fonts/outfit/Outfit-Regular.ttf') format('truetype'); }
      @font-face { font-family: 'Outfit'; font-weight: 700; src: url('/fonts/outfit/Outfit-Bold.ttf') format('truetype'); }
      @font-face { font-family: 'Outfit'; font-weight: 800; src: url('/fonts/outfit/Outfit-ExtraBold.ttf') format('truetype'); }
    </style>`;

    const full = `<!DOCTYPE html><html><head><meta charset="utf-8"/>${fontFaceBlock}</head><body style="margin:0">${inlined}</body></html>`;

    const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(full)}`;
    await page.emulateMediaType("screen");
    await page.goto(dataUri, { waitUntil: "networkidle0", timeout: 30000 });
    const pdf = await page.pdf({ format: "A4", printBackground: true });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}
