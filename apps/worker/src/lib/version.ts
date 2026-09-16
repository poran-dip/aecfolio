import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { workerEnv } from "@aecfolio/config";
import { cvStylesheet } from "@aecfolio/ui";
import { fontFaceCss } from "./fonts";

let cached: string | undefined;

export function renderVersion(): string {
  if (cached) return cached;
  const hash = createHash("sha256");
  if (workerEnv.NODE_ENV === "production") {
    hash.update(readFileSync(fileURLToPath(import.meta.url)));
  } else {
    hash.update(randomUUID());
  }
  hash.update(cvStylesheet);
  hash.update(fontFaceCss());
  cached = hash.digest("hex").slice(0, 16);
  return cached;
}
