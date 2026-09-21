import type { BuiltInCvSectionType, CvSectionsConfig } from "@aecfolio/shared";
import type { TemplateManifest } from "./manifest";

type EntryArrangement = {
  entryOrder: readonly string[];
  hiddenEntries: readonly string[];
};

export type ResolvedSection =
  | ({ kind: BuiltInCvSectionType } & EntryArrangement)
  | ({ kind: "custom"; customSectionId: string } & EntryArrangement);

export function resolveSections(
  manifest: TemplateManifest<unknown>,
  config: CvSectionsConfig,
): ResolvedSection[] {
  return config
    .filter((s) => s.include && manifest.supportedSections.includes(s.type))
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((s) => {
      const arrangement = {
        entryOrder: s.entryOrder,
        hiddenEntries: s.hiddenEntries ?? [],
      };
      return s.type === "custom"
        ? {
            kind: "custom" as const,
            customSectionId: s.customSectionId,
            ...arrangement,
          }
        : { kind: s.type, ...arrangement };
    });
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

export function arrangeEntries<T extends { id: string }>(
  entries: readonly T[],
  {
    entryOrder,
    hiddenEntries,
  }: { entryOrder: readonly string[]; hiddenEntries?: readonly string[] },
): T[] {
  const hidden = new Set(hiddenEntries ?? []);
  return orderEntries(
    entries.filter((entry) => !hidden.has(entry.id)),
    entryOrder,
  );
}
