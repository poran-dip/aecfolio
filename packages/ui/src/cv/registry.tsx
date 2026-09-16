import type { CvSectionsConfig, CvTemplateOptions } from "@aecfolio/shared";
import type { ReactElement } from "react";
import type { TemplateManifest } from "./manifest";
import { defaultSectionsConfig, parseTemplateOptions } from "./manifest";
import type { CvTemplateId } from "./manifests";
import { templateManifests } from "./manifests";
import type { ResolvedSection } from "./sections";
import { resolveSections } from "./sections";
import { StandardTemplate } from "./templates/standard";
import type { CvData } from "./types";

export type TemplateComponentProps<TOptions> = {
  data: CvData;
  sections: ResolvedSection[];
  options: TOptions;
};

export type CvRenderInput = {
  data: CvData;
  sections?: CvSectionsConfig;
  options?: CvTemplateOptions;
};

export type CvTemplate = {
  manifest: TemplateManifest<unknown>;
  render: (input: CvRenderInput) => ReactElement;
};

function defineTemplate<TOptions>(
  manifest: TemplateManifest<TOptions>,
  Component: (props: TemplateComponentProps<TOptions>) => ReactElement,
): CvTemplate {
  return {
    manifest: manifest as TemplateManifest<unknown>,
    render({ data, sections, options }) {
      const config =
        sections ?? defaultSectionsConfig(manifest, data.customSections);
      return (
        <Component
          data={data}
          sections={resolveSections(manifest, config)}
          options={parseTemplateOptions(manifest, options)}
        />
      );
    },
  };
}

export const cvTemplates = {
  standard: defineTemplate(templateManifests.standard, StandardTemplate),
} satisfies Record<CvTemplateId, CvTemplate>;

export function getTemplate(id: string): CvTemplate | null {
  return Object.hasOwn(cvTemplates, id)
    ? cvTemplates[id as CvTemplateId]
    : null;
}
