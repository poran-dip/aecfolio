import type { TemplateManifest } from "./manifest";
import { standardManifest } from "./templates/standard/manifest";

export const templateManifests = {
  standard: standardManifest,
} satisfies Record<string, { id: string }>;

export type CvTemplateId = keyof typeof templateManifests;

export const CV_TEMPLATE_IDS = Object.keys(templateManifests) as CvTemplateId[];

export const STANDARD_TEMPLATE_ID = "standard" satisfies CvTemplateId;

export function getTemplateManifest(
  id: string,
): TemplateManifest<unknown> | null {
  return Object.hasOwn(templateManifests, id)
    ? (templateManifests[id as CvTemplateId] as TemplateManifest<unknown>)
    : null;
}

export function listTemplateManifests(): TemplateManifest<unknown>[] {
  return Object.values(templateManifests) as TemplateManifest<unknown>[];
}
