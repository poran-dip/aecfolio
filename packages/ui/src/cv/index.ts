export { cvStylesheet } from "./generated/stylesheet";
export {
  CV_SECTION_KINDS,
  type CvOptionControl,
  type CvSectionKind,
  defaultSectionsConfig,
  parseTemplateOptions,
  type TemplateManifest,
} from "./manifest";
export {
  CV_TEMPLATE_IDS,
  type CvTemplateId,
  getTemplateManifest,
  listTemplateManifests,
  STANDARD_TEMPLATE_ID,
  templateManifests,
} from "./manifests";
export {
  type CvRenderInput,
  type CvTemplate,
  cvTemplates,
  getTemplate,
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
