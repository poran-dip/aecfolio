import { Branch, Course } from "../enums";

export const COURSE_LABELS: Record<Course, string> = {
  [Course.BTECH]: "B.Tech",
  [Course.MTECH]: "M.Tech",
  [Course.BCA]: "BCA",
  [Course.MCA]: "MCA",
};

export const BRANCH_LABELS: Record<Branch, string> = {
  [Branch.CSE]: "Computer Science and Engineering",
  [Branch.ETE]: "Electronics and Telecommunication Engineering",
  [Branch.EE]: "Electrical Engineering",
  [Branch.IE]: "Instrumentation Engineering",
  [Branch.ME]: "Mechanical Engineering",
  [Branch.CE]: "Civil Engineering",
  [Branch.IPE]: "Industrial and Production Engineering",
  [Branch.CHE]: "Chemical Engineering",
  [Branch.CA]: "Computer Applications",
};

export function degreeLabel(course: Course, branch: Branch): string {
  return `${COURSE_LABELS[course]} in ${BRANCH_LABELS[branch]}`;
}

export function degreeLabelShort(course: Course, branch: Branch): string {
  return `${COURSE_LABELS[course]} ${branch}`;
}
