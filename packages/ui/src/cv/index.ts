export { cvStylesheet } from "./generated/stylesheet";
export {
  CV_SECTION_KINDS,
  type CvSectionKind,
  defaultSectionsConfig,
  parseTemplateOptions,
  type TemplateManifest,
} from "./manifest";
export {
  CV_TEMPLATE_IDS,
  type CvRenderInput,
  type CvTemplate,
  type CvTemplateId,
  cvTemplates,
  getTemplate,
  listTemplateManifests,
  STANDARD_TEMPLATE_ID,
  type TemplateComponentProps,
} from "./registry";
export {
  orderEntries,
  type ResolvedSection,
  resolveSections,
} from "./sections";
export { standardManifest } from "./templates/standard/manifest";
export {
  type StandardOptions,
  standardOptionsSchema,
} from "./templates/standard/options";
export {
  type CvCustomSectionData,
  type CvData,
  type CvInstitution,
  type CvMark,
  DEFAULT_INSTITUTION,
  type WithMark,
} from "./types";
