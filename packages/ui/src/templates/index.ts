import { StandardTemplate } from "./standard";

export const templates = {
  standard: StandardTemplate,
} as const;

export type CVTemplateName = keyof typeof templates;
