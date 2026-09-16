import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FACES = [
  { file: "Outfit-Light.ttf", weight: 300 },
  { file: "Outfit-Regular.ttf", weight: 400 },
  { file: "Outfit-Bold.ttf", weight: 700 },
  { file: "Outfit-ExtraBold.ttf", weight: 800 },
];

function packageRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  while (!existsSync(join(dir, "public", "fonts"))) {
    const parent = dirname(dir);
    if (parent === dir)
      throw new Error("Could not find apps/worker/public/fonts");
    dir = parent;
  }
  return dir;
}

let cached: string | undefined;

export function fontFaceCss(): string {
  if (cached) return cached;
  const dir = join(packageRoot(), "public", "fonts", "outfit");
  cached = FACES.map(({ file, weight }) => {
    const data = readFileSync(join(dir, file)).toString("base64");
    return `@font-face{font-family:"Outfit";font-style:normal;font-weight:${weight};src:url(data:font/ttf;base64,${data}) format("truetype");}`;
  }).join("");
  return cached;
}
