import type { TemplateManifest } from "../../manifest";
import { type StandardOptions, standardOptionsSchema } from "./options";

export const standardManifest: TemplateManifest<StandardOptions> = {
  id: "standard",
  name: "Standard",
  description:
    "The college's own layout. This is the template faculty and the college export, so it is the one worth keeping current.",

  supportedSections: [
    "summary",
    "skills",
    "experiences",
    "projects",
    "achievements",
    "certifications",
    "interests",
    "socials",
    "results",
    "custom",
  ],

  defaultSections: [
    "summary",
    "skills",
    "projects",
    "experiences",
    "results",
    "achievements",
    "certifications",
    "interests",
    "socials",
  ],

  sectionNotes: {
    socials:
      "Social links print in the header contact block on this template, so where they sit in this list has no effect — only whether they are included, and the order of the links themselves.",
    results:
      "Prints as the Education section: your degree, the college, and your CGPA. Individual semester results only appear if you turn that option on.",
    summary:
      "Your bio, from your profile. The section disappears on its own if the bio is empty — you do not have to exclude it as well.",
    skills:
      "Your skills list, and your spoken languages if you have that option on. Disappears on its own if you have neither.",
  },

  optionControls: [
    {
      key: "accent",
      label: "Accent",
      kind: "choice",
      choices: [
        { value: "turquoise", label: "Turquoise" },
        { value: "red", label: "Red" },
        { value: "ink", label: "Black" },
      ],
    },
    {
      key: "density",
      label: "Spacing",
      kind: "choice",
      hint: "Compact fits more on a page.",
      choices: [
        { value: "comfortable", label: "Comfortable" },
        { value: "compact", label: "Compact" },
      ],
    },
    {
      key: "contactColumns",
      label: "Contact columns",
      kind: "choice",
      choices: [
        { value: 2, label: "Two" },
        { value: 3, label: "Three" },
      ],
    },
    { key: "showPhoto", label: "Show photo", kind: "boolean" },
    { key: "showLocation", label: "Show location", kind: "boolean" },
    { key: "showLanguages", label: "Show spoken languages", kind: "boolean" },
    {
      key: "showSemesterResults",
      label: "Show every semester result",
      kind: "boolean",
      hint: "Off, only the degree and CGPA print.",
    },
  ],

  optionsSchema: standardOptionsSchema,
  printsPhoto: (options) => options.showPhoto,
};
