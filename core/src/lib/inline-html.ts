export async function inlineExternalResources(html: string): Promise<string> {
  const imgMatches = [...html.matchAll(/src="(https?:\/\/[^"]+)"/g)];
  for (const [attr, url] of imgMatches) {
    try {
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      const mime = res.headers.get("content-type") ?? "image/jpeg";
      const b64 = Buffer.from(buf).toString("base64");
      html = html.replace(attr, `src="data:${mime};base64,${b64}"`);
    } catch (err) {
      console.warn(`[inline-html] Failed to inline image: ${url}`, err);
    }
  }

  const linkMatches = [
    ...html.matchAll(/<link[^>]+href="(https:\/\/fonts\.googleapis\.com[^"]+)"[^>]*>/g),
  ];
  for (const [tag, url] of linkMatches) {
    try {
      const css = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
      }).then((r) => r.text());

      const woff2Matches = [...css.matchAll(/url\((https:\/\/[^)]+)\)/g)];
      let inlinedCss = css;
      for (const [urlExpr, fontUrl] of woff2Matches) {
        try {
          const fontBuf = await fetch(fontUrl).then((r) => r.arrayBuffer());
          const b64 = Buffer.from(fontBuf).toString("base64");
          inlinedCss = inlinedCss.replace(urlExpr, `url(data:font/woff2;base64,${b64})`);
        } catch (err) {
          console.warn(`[inline-html] Failed to inline woff2: ${fontUrl}`, err);
        }
      }

      html = html.replace(tag, `<style>${inlinedCss}</style>`);
    } catch (err) {
      console.warn(`[inline-html] Failed to inline font CSS: ${url}`, err);
    }
  }

  return html;
}
