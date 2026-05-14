export type CVTemplate = "professional-theme";
export type CVTheme = "light" | "dark";

export type CVSections = {
  bio?: true;
  skills?: true;
  image?: true;
  projects?: string[];
  experience?: string[];
  achievements?: string[];
  certifications?: string[];
  socials?: string[];
};

export type CVOptions = {
  showVerificationTick: boolean;
  showCGPA: boolean;
};

export type CVRequest = {
  template: CVTemplate;
  theme: CVTheme;
  sections: CVSections;
  options: CVOptions;
};

// What gets passed to the PDF microservice
export type CVPayload = {
  name: string;
  html: string;
};
