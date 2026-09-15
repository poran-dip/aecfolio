import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const INPUT = join(root, "src/styles/cv.css");
const CSS_OUT = join(root, "dist/cv.css");
const TS_OUT = join(root, "src/cv/generated/stylesheet.ts");

export function compileCvCss(): string {
  mkdirSync(dirname(CSS_OUT), { recursive: true });

  execSync(`pnpm exec tailwindcss -i "${INPUT}" -o "${CSS_OUT}"`, {
    cwd: root,
    stdio: "inherit",
  });

  return readFileSync(CSS_OUT, "utf8");
}

export function stylesheetModule(css: string): string {
  return `/**
 * GENERATED — do not edit.
 *
 * Built from src/styles/cv.css by scripts/build-css.ts. Run
 * \`pnpm -F @aecfolio/ui build:css\` after changing any token, any class name in
 * a template, or anything else that stylesheet compiles from.
 */
export const cvStylesheet = ${JSON.stringify(css)};
`;
}

export { TS_OUT as STYLESHEET_MODULE_PATH };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const css = compileCvCss();
  mkdirSync(dirname(TS_OUT), { recursive: true });
  writeFileSync(TS_OUT, stylesheetModule(css));
  console.log(
    `[build-css] ${(css.length / 1024).toFixed(1)} KB -> dist/cv.css + src/cv/generated/stylesheet.ts`,
  );
}
