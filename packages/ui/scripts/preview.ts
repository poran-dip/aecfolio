import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { makeCvData } from "../src/cv/fixtures";
import { getTemplate, listTemplateManifests } from "../src/cv/registry";
import { compileCvCss } from "./build-css";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

const templateId = arg("template") ?? "standard";
const template = getTemplate(templateId);

if (!template) {
  const known = listTemplateManifests()
    .map((m) => m.id)
    .join(", ");
  console.error(`Unknown template "${templateId}". Known: ${known}`);
  process.exit(1);
}

const options: Record<string, unknown> = {};
for (const key of ["accent", "density"]) {
  const value = arg(key);
  if (value) options[key] = value;
}

const css = compileCvCss();

const markup = renderToStaticMarkup(
  template.render({ data: makeCvData(), options }),
);

const HOST_STYLES = `
  body { margin: 0; background: #e3e8ec; padding: 24px; }
  .cv-sheet .cv-page { box-shadow: 0 8px 32px rgba(0,0,0,.18); }
`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${templateId} — preview</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
<style>${css}</style>
<style>${HOST_STYLES}</style>
</head>
<body><div class="cv-sheet">${markup}</div></body>
</html>
`;

const out = join(root, "preview", `${templateId}.html`);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`[preview] ${out}`);
