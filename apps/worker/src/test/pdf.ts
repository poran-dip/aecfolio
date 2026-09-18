import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export type PdfPage = {
  text: string;
  topInk: number;
  height: number;
  links: string[];
};

export async function readPdf(bytes: Uint8Array) {
  const task = getDocument({ data: bytes.slice(), useSystemFonts: false });
  const doc = await task.promise;

  const pages: PdfPage[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const { height } = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const items = content.items.filter(
      (
        item,
      ): item is (typeof content.items)[number] & {
        str: string;
        transform: number[];
        height: number;
      } => "str" in item && item.str.trim().length > 0,
    );
    const topInk = Math.min(
      ...items.map((item) => height - item.transform[5] - item.height),
    );
    const annotations = await page.getAnnotations();
    pages.push({
      text: items.map((item) => item.str).join(" "),
      topInk,
      height,
      links: annotations
        .filter((a) => a.subtype === "Link" && typeof a.url === "string")
        .map((a) => a.url as string),
    });
  }
  const metadata = await doc.getMetadata();
  const info = metadata.info as { Title?: string } | undefined;
  await task.destroy();

  return {
    pages,
    text: pages.map((p) => p.text).join("\n"),
    links: pages.flatMap((p) => p.links),
    title: info?.Title ?? "",
    embedsFont: (name: string) =>
      Buffer.from(bytes).toString("latin1").includes(name),
  };
}
