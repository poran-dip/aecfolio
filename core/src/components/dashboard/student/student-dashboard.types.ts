export type Experience = {
  id: string;
  type: string;
  title: string;
  organization: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
};

export type Project = {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  link: string | null;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  proofImage: string | null;
  verified: boolean;
};

export type Certification = {
  id: string;
  name: string;
  issuer: string;
  issueDate: string | null;
  proofImage: string | null;
  verified: boolean;
};

export type Social = {
  id: string;
  type: string;
  url: string;
};

export type Result = {
  id: string;
  semester: number;
  sgpa: number | null;
  pendingSgpa: number | null;
  verified: boolean;
};

export type User = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  student: {
    id: string;
    rollNo: string;
    course: string;
    branch: string;
    semester: number;
    bio: string | null;
    skills: string[];
    cgpa: number | null;
  };
};

export type UserDraft = {
  name?: string | null;
  phone?: string | null;
  bio?: string | null;
  skills?: string[];
};
