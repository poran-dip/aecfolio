export async function inlineImages(html: string): Promise<string> {
  const imgMatches = [
    ...html.matchAll(/(<img[^>]+src=")(https?:\/\/[^"]+)(")/g),
  ];

  for (const [full, prefix, url, suffix] of imgMatches) {
    if (!url) continue;
    try {
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      const mime = res.headers.get("content-type") ?? "image/jpeg";
      const b64 = Buffer.from(buf).toString("base64");
      html = html.replace(full, `${prefix}data:${mime};base64,${b64}${suffix}`);
    } catch (err) {
      console.warn(`[inline-html] Failed to inline image: ${url}`, err);
    }
  }

  return html;
}
