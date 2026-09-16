export {
  CV_SECTION_KINDS,
  type CvSectionKind,
  defaultSectionsConfig,
  parseTemplateOptions,
  type TemplateManifest,
} from "./cv/manifest";
export {
  CV_TEMPLATE_IDS,
  type CvTemplateId,
  getTemplateManifest,
  listTemplateManifests,
  STANDARD_TEMPLATE_ID,
  templateManifests,
} from "./cv/manifests";
export type {
  CvCustomSectionData,
  CvData,
  CvInstitution,
  CvMark,
  WithMark,
} from "./cv/types";
export { DEFAULT_INSTITUTION } from "./cv/types";
