import type {
  BuiltInCvSectionType,
  CvSectionsConfig,
  CvTemplateOptions,
} from "@aecfolio/shared";
import { BUILT_IN_CV_SECTION_TYPES } from "@aecfolio/shared";
import type { z } from "zod";
import type { CvCustomSectionData } from "./types";

export type CvSectionKind = BuiltInCvSectionType | "custom";

export const CV_SECTION_KINDS: readonly CvSectionKind[] = [
  ...BUILT_IN_CV_SECTION_TYPES,
  "custom",
];

export type CvOptionControl =
  | { key: string; label: string; kind: "boolean"; hint?: string }
  | {
      key: string;
      label: string;
      kind: "choice";
      hint?: string;
      choices: readonly { value: string | number; label: string }[];
    };

export type TemplateManifest<TOptions = unknown> = {
  id: string;
  name: string;
  description: string;
  supportedSections: readonly CvSectionKind[];
  defaultSections: readonly BuiltInCvSectionType[];
  sectionNotes?: Partial<Record<CvSectionKind, string>>;
  optionControls: readonly CvOptionControl[];
  optionsSchema: z.ZodType<TOptions>;
  printsPhoto(options: TOptions): boolean;
};

export function parseTemplateOptions<TOptions>(
  manifest: TemplateManifest<TOptions>,
  raw: CvTemplateOptions | undefined,
): TOptions {
  const parsed = manifest.optionsSchema.safeParse(raw ?? {});
  if (parsed.success) return parsed.data;
  return manifest.optionsSchema.parse({});
}

export function defaultSectionsConfig(
  manifest: TemplateManifest<unknown>,
  customSections: readonly CvCustomSectionData[] = [],
): CvSectionsConfig {
  const config: CvSectionsConfig = manifest.defaultSections.map(
    (type, order) => ({
      type,
      include: true,
      order,
      entryOrder: [],
      hiddenEntries: [],
    }),
  );

  if (!manifest.supportedSections.includes("custom")) return config;

  customSections.forEach((section, i) => {
    config.push({
      type: "custom",
      customSectionId: section.id,
      include: true,
      order: manifest.defaultSections.length + i,
      entryOrder: [],
      hiddenEntries: [],
    });
  });

  return config;
}
