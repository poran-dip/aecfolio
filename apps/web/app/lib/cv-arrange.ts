import type { CvSectionPreference, CvSectionsConfig } from "@aecfolio/shared";
import {
  type CvData,
  type CvSectionKind,
  defaultSectionsConfig,
  type TemplateManifest,
} from "@aecfolio/ui";

const ISO_TIMESTAMP =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

export function reviveDates<T>(value: unknown): T {
  if (typeof value === "string")
    return (ISO_TIMESTAMP.test(value) ? new Date(value) : value) as T;
  if (Array.isArray(value)) return value.map((item) => reviveDates(item)) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value))
      out[key] = reviveDates(item);
    return out as T;
  }
  return value as T;
}

export const SECTION_LABELS: Record<
  Exclude<CvSectionKind, "custom">,
  string
> = {
  summary: "Summary",
  skills: "Skills",
  experiences: "Experience",
  projects: "Projects",
  achievements: "Achievements",
  certifications: "Certifications",
  interests: "Interests",
  socials: "Links",
  results: "Education and results",
};

export function sectionKey(section: CvSectionPreference): string {
  return section.type === "custom"
    ? `custom:${section.customSectionId}`
    : section.type;
}

export function sectionLabel(
  section: CvSectionPreference,
  data: CvData,
): string {
  if (section.type !== "custom") return SECTION_LABELS[section.type];
  const found = data.customSections.find(
    (it) => it.id === section.customSectionId,
  );
  return found?.name ?? "Untitled section";
}

export function sectionEntries(
  section: CvSectionPreference,
  data: CvData,
): { id: string; label: string }[] {
  switch (section.type) {
    case "experiences":
      return data.experiences.map((row) => ({
        id: row.id,
        label: row.organization
          ? `${row.title} · ${row.organization}`
          : row.title,
      }));
    case "projects":
      return data.projects.map((row) => ({ id: row.id, label: row.title }));
    case "achievements":
      return data.achievements.map((row) => ({ id: row.id, label: row.title }));
    case "certifications":
      return data.certifications.map((row) => ({
        id: row.id,
        label: row.issuer ? `${row.name} · ${row.issuer}` : row.name,
      }));
    case "interests":
      return data.interests.map((row) => ({ id: row.id, label: row.title }));
    case "socials":
      return data.socials.map((row) => ({ id: row.id, label: row.title }));
    case "results":
      // Semesters always print first to last, so there is nothing to arrange.
      return [];
    case "custom": {
      const found = data.customSections.find(
        (it) => it.id === section.customSectionId,
      );
      return (found?.entries ?? []).map((row) => ({
        id: row.id,
        label: row.title,
      }));
    }
    default:
      return [];
  }
}

export function normalizeSections(
  manifest: TemplateManifest<unknown>,
  data: CvData,
  saved: CvSectionsConfig | undefined,
): CvSectionsConfig {
  const fallback = defaultSectionsConfig(manifest, data.customSections);
  if (!saved || saved.length === 0) return fallback;

  const customIds = new Set(data.customSections.map((it) => it.id));
  const kept = saved
    .filter(
      (section) =>
        manifest.supportedSections.includes(section.type) &&
        (section.type !== "custom" || customIds.has(section.customSectionId)),
    )
    .map((section) => ({
      ...section,
      hiddenEntries: section.hiddenEntries ?? [],
    }));

  const seen = new Set(kept.map(sectionKey));
  const added = fallback.filter((section) => !seen.has(sectionKey(section)));

  kept.sort((a, b) => a.order - b.order);

  return [...kept, ...added].map((section, order) => ({ ...section, order }));
}

export function withEntryOrder(
  section: CvSectionPreference,
  ids: string[],
): CvSectionPreference {
  return { ...section, entryOrder: ids };
}

export function setEntryVisible(
  hidden: readonly string[],
  id: string,
  visible: boolean,
): string[] {
  const rest = hidden.filter((entryId) => entryId !== id);
  return visible ? rest : [...rest, id];
}

export function visibleEntryCount(
  section: CvSectionPreference,
  data: CvData,
): number {
  const hidden = new Set(section.hiddenEntries ?? []);
  return sectionEntries(section, data).filter((entry) => !hidden.has(entry.id))
    .length;
}
