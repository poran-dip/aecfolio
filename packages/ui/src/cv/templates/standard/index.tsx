import {
  DATE_RANGE_SEPARATOR,
  degreeLabel,
  formatDate,
  PRESENT_LABEL,
} from "@aecfolio/shared";
import type { CSSProperties } from "react";
import { ExternalLink } from "../../../icons";
import { Markdown } from "../../../markdown";
import type { ResolvedSection } from "../../sections";
import { orderEntries } from "../../sections";
import type { CvData } from "../../types";
import type { StandardOptions } from "./options";
import { Header } from "./parts/header";
import {
  Entry,
  EntryDate,
  EntryHeader,
  EntryList,
  Section,
  VerifiedMark,
} from "./parts/primitives";

type Density = {
  marginBlock: string;
  marginInline: string;
  sectionGap: string;
  entryGap: string;
};

const DENSITY: Record<StandardOptions["density"], Density> = {
  comfortable: {
    marginBlock: "10mm",
    marginInline: "12mm",
    sectionGap: "20px",
    entryGap: "14px",
  },
  compact: {
    marginBlock: "8mm",
    marginInline: "10mm",
    sectionGap: "14px",
    entryGap: "10px",
  },
};

function pageRule(density: Density): string {
  return `@page{size:210mm 297mm;margin:${density.marginBlock} ${density.marginInline};}`;
}

function pageVariables(density: Density): CSSProperties {
  return {
    "--cv-page-padding-block": density.marginBlock,
    "--cv-page-padding-inline": density.marginInline,
    "--cv-section-gap": density.sectionGap,
    "--cv-entry-gap": density.entryGap,
  } as CSSProperties;
}

const ACCENT: Record<StandardOptions["accent"], CSSProperties> = {
  turquoise: {} as CSSProperties,
  red: {
    "--color-cv-accent": "var(--color-red-700)",
    "--color-cv-rule": "var(--color-red-500)",
  } as CSSProperties,
  ink: {
    "--color-cv-accent": "var(--color-neutral-900)",
    "--color-cv-rule": "var(--color-neutral-900)",
    "--color-cv-mark": "var(--color-neutral-900)",
  } as CSSProperties,
};

export type StandardTemplateProps = {
  data: CvData;
  sections: ResolvedSection[];
  options: StandardOptions;
};

export function StandardTemplate({
  data,
  sections,
  options,
}: StandardTemplateProps) {
  const socialSection = sections.find((s) => s.kind === "socials");
  const socials = socialSection
    ? orderEntries(data.socials, socialSection.entryOrder)
    : [];

  const body = sections
    .filter((s) => s.kind !== "socials")
    .map((section) => renderSection(section, data, options));

  const density = DENSITY[options.density];

  return (
    <div
      className="cv-page"
      style={{ ...pageVariables(density), ...ACCENT[options.accent] }}
    >
      <style dangerouslySetInnerHTML={{ __html: pageRule(density) }} />

      <div className="flex flex-col gap-(--cv-section-gap)">
        <Header data={data} options={options} socials={socials} />
        {body}
      </div>
    </div>
  );
}

function renderSection(
  section: ResolvedSection,
  data: CvData,
  options: StandardOptions,
) {
  switch (section.kind) {
    case "summary": {
      if (!data.student.bio?.trim()) return null;
      return (
        <Section key="summary" title="Summary">
          <Markdown>{data.student.bio}</Markdown>
        </Section>
      );
    }

    case "skills": {
      const { skills, spokenLanguages } = data.student;
      const languages = options.showLanguages ? spokenLanguages : [];
      if (skills.length === 0 && languages.length === 0) return null;

      return (
        <Section key="skills" title="Skills">
          <div className="flex flex-col gap-3">
            {skills.length > 0 && (
              <p className="text-base text-cv-ink">{skills.join(", ")}</p>
            )}
            {languages.length > 0 && (
              <p className="text-base text-cv-ink">
                <span className="font-bold">Languages: </span>
                {languages.join(", ")}
              </p>
            )}
          </div>
        </Section>
      );
    }

    case "experiences": {
      const items = orderEntries(data.experiences, section.entryOrder);
      if (items.length === 0) return null;
      return (
        <Section key="experiences" title="Experience">
          <EntryList>
            {items.map((exp) => (
              <Entry key={exp.id}>
                <EntryHeader
                  title={exp.title}
                  subtitle={exp.organization}
                  meta={<EntryDate>{formatDate(exp.date)}</EntryDate>}
                />
                <Markdown>{exp.description}</Markdown>
              </Entry>
            ))}
          </EntryList>
        </Section>
      );
    }

    case "projects": {
      const items = orderEntries(data.projects, section.entryOrder);
      if (items.length === 0) return null;
      return (
        <Section key="projects" title="Projects">
          <EntryList>
            {items.map((project) => (
              <Entry key={project.id}>
                <EntryHeader title={project.title} href={project.link} />
                <Markdown>{project.description}</Markdown>
              </Entry>
            ))}
          </EntryList>
        </Section>
      );
    }

    case "achievements": {
      const items = orderEntries(data.achievements, section.entryOrder);
      if (items.length === 0) return null;
      return (
        <Section key="achievements" title="Achievements">
          <EntryList>
            {items.map((achievement) => (
              <Entry key={achievement.id}>
                <EntryHeader
                  title={achievement.title}
                  mark={achievement.mark}
                />
                <Markdown>{achievement.description}</Markdown>
              </Entry>
            ))}
          </EntryList>
        </Section>
      );
    }

    case "certifications": {
      const items = orderEntries(data.certifications, section.entryOrder);
      if (items.length === 0) return null;
      return (
        <Section key="certifications" title="Certifications">
          <EntryList>
            {items.map((cert) => (
              <Entry key={cert.id}>
                <EntryHeader
                  title={cert.name}
                  subtitle={cert.issuer}
                  mark={cert.mark}
                  meta={<EntryDate>{formatDate(cert.issueDate)}</EntryDate>}
                />
                {cert.credentialLink && (
                  <a
                    href={cert.credentialLink}
                    className="inline-flex items-center gap-4 text-cv-ink-subtle text-sm"
                  >
                    <ExternalLink className="size-9" />
                    <span>View credential</span>
                  </a>
                )}
              </Entry>
            ))}
          </EntryList>
        </Section>
      );
    }

    case "interests": {
      const items = orderEntries(data.interests, section.entryOrder);
      if (items.length === 0) return null;
      return (
        <Section key="interests" title="Interests">
          <EntryList>
            {items.map((interest) => (
              <Entry key={interest.id}>
                <EntryHeader title={interest.title} />
                <Markdown>{interest.body}</Markdown>
              </Entry>
            ))}
          </EntryList>
        </Section>
      );
    }

    case "results": {
      const results = orderEntries(data.results, section.entryOrder);
      const semesters = results
        .filter((r) => r.sgpa !== null)
        .sort((a, b) => a.semester - b.semester);

      return (
        <Section key="results" title="Education">
          <div className="flex items-start justify-between gap-12">
            <div className="flex flex-col gap-2 text-base">
              <span className="font-bold">
                {degreeLabel(data.student.course, data.student.branch)}
              </span>
              <span className="text-cv-ink-muted">{data.institution.name}</span>

              {data.student.cgpa !== null && (
                <span className="mt-2 inline-flex items-center gap-4">
                  <span>CGPA: {data.student.cgpa.toFixed(2)}</span>
                  <VerifiedMark mark={data.cgpaMark} />
                </span>
              )}

              {options.showSemesterResults && semesters.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1">
                  {semesters.map((result) => (
                    <li
                      key={result.id}
                      className="inline-flex items-center gap-4 text-cv-ink-muted text-sm"
                    >
                      <span>
                        Semester {result.semester}: {result.sgpa?.toFixed(2)}
                      </span>
                      <VerifiedMark mark={result.mark} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex shrink-0 flex-col items-end">
              <EntryDate>
                {`${data.student.admissionYear}${DATE_RANGE_SEPARATOR}${PRESENT_LABEL}`}
              </EntryDate>
            </div>
          </div>
        </Section>
      );
    }

    case "custom": {
      const custom = data.customSections.find(
        (s) => s.id === section.customSectionId,
      );
      if (!custom || custom.entries.length === 0) return null;
      const items = orderEntries(custom.entries, section.entryOrder);

      return (
        <Section key={`custom:${custom.id}`} title={custom.name}>
          <EntryList>
            {items.map((entry) => (
              <Entry key={entry.id}>
                <EntryHeader
                  title={entry.title}
                  subtitle={entry.org}
                  meta={<EntryDate>{formatDate(entry.date)}</EntryDate>}
                />
                <Markdown>{entry.body}</Markdown>
              </Entry>
            ))}
          </EntryList>
        </Section>
      );
    }

    default:
      return null;
  }
}
