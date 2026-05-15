let cachedFontStyle: string | null = null;

export async function getInlinedFontStyle(): Promise<string> {
  if (cachedFontStyle) return cachedFontStyle;

  const url = "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap";
  const css = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
  }).then((r) => r.text());

  const woff2Matches = [...css.matchAll(/url\((https:\/\/[^)]+)\)/g)];
  let inlinedCss = css;
  for (const [urlExpr, fontUrl] of woff2Matches) {
    if (!fontUrl) continue;
    try {
      const fontBuf = await fetch(fontUrl).then((r) => r.arrayBuffer());
      const b64 = Buffer.from(fontBuf).toString("base64");
      inlinedCss = inlinedCss.replace(urlExpr, `url(data:font/woff2;base64,${b64})`);
    } catch (err) {
      console.warn(`[inline-html] Failed to inline woff2: ${fontUrl}`, err);
    }
  }

  cachedFontStyle = inlinedCss;
  return cachedFontStyle;
}

export async function inlineExternalResources(html: string): Promise<string> {
  const imgMatches = [...html.matchAll(/(<img[^>]+src=")(https?:\/\/[^"]+)(")/g)];
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

  const fontLinkMatches = [
    ...html.matchAll(/<link[^>]+href="(https:\/\/fonts\.googleapis\.com[^"]+)"[^>]*>/g),
  ];
  const fontImportMatches = [
    ...html.matchAll(/@import url\(['"]?(https:\/\/fonts\.googleapis\.com[^'")\s]+)['"]?\);/g),
  ];

  const inlinedCss = await getInlinedFontStyle();
  for (const [tag] of [...fontLinkMatches, ...fontImportMatches]) {
      const isLink = tag.startsWith("<link");
      html = html.replace(
        tag,
        isLink ? `<style>${inlinedCss}</style>` : inlinedCss,
      );
  }

  return html;
}
