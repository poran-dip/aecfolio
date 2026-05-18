export const Role = {
  STUDENT: "STUDENT",
  FACULTY: "FACULTY",
  PENDING: "PENDING",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const Course = {
  BTECH: "BTECH",
  MTECH: "MTECH",
  BCA: "BCA",
  MCA: "MCA",
} as const;
export type Course = (typeof Course)[keyof typeof Course];

export const Branch = {
  CSE: "CSE",
  ETE: "ETE",
  EE: "EE",
  IE: "IE",
  ME: "ME",
  CE: "CE",
  IPE: "IPE",
  CHE: "CHE",
  CA: "CA",
} as const;
export type Branch = (typeof Branch)[keyof typeof Branch];

export const ExperienceType = {
  INTERNSHIP: "INTERNSHIP",
  VOLUNTEER: "VOLUNTEER",
  CLUB: "CLUB",
  OTHER: "OTHER",
} as const;
export type ExperienceType =
  (typeof ExperienceType)[keyof typeof ExperienceType];

export const SocialType = {
  LINKEDIN: "LINKEDIN",
  GITHUB: "GITHUB",
  LEETCODE: "LEETCODE",
  CODEFORCES: "CODEFORCES",
  OTHER: "OTHER",
} as const;
export type SocialType = (typeof SocialType)[keyof typeof SocialType];
