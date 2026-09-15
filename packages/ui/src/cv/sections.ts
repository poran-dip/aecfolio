import type { BuiltInCvSectionType, CvSectionsConfig } from "@aecfolio/shared";
import type { TemplateManifest } from "./manifest";

export type ResolvedSection =
  | { kind: BuiltInCvSectionType; entryOrder: readonly string[] }
  | {
      kind: "custom";
      customSectionId: string;
      entryOrder: readonly string[];
    };

export function resolveSections(
  manifest: TemplateManifest<unknown>,
  config: CvSectionsConfig,
): ResolvedSection[] {
  return config
    .filter((s) => s.include && manifest.supportedSections.includes(s.type))
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((s) =>
      s.type === "custom"
        ? {
            kind: "custom" as const,
            customSectionId: s.customSectionId,
            entryOrder: s.entryOrder,
          }
        : { kind: s.type, entryOrder: s.entryOrder },
    );
}

export function orderEntries<T extends { id: string }>(
  entries: readonly T[],
  entryOrder: readonly string[],
): T[] {
  if (entryOrder.length === 0) return entries.slice();

  const rank = new Map(entryOrder.map((id, i) => [id, i]));
  const known: T[] = [];
  const rest: T[] = [];

  for (const entry of entries) {
    (rank.has(entry.id) ? known : rest).push(entry);
  }

  known.sort(
    (a, b) =>
      (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
      (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER),
  );

  return [...known, ...rest];
}
