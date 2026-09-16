import { authEnv } from "@aecfolio/config";
import { CvExportKind, VerificationStatus } from "@aecfolio/shared";
import {
  type CvData,
  type CvMark,
  DEFAULT_INSTITUTION,
  type WithMark,
} from "@aecfolio/ui/manifests";
import { db } from "../db";

export async function loadCvSources(studentIds: readonly string[]) {
  if (studentIds.length === 0) return [];
  return db.query.studentsTable.findMany({
    where: (s, { and, inArray, isNull }) =>
      and(inArray(s.id, [...studentIds]), isNull(s.deletedAt)),
    with: {
      user: true,
      results: {
        where: (r, { isNull }) => isNull(r.deletedAt),
        orderBy: (r, { asc }) => asc(r.semester),
      },
      experiences: { where: (e, { isNull }) => isNull(e.deletedAt) },
      projects: { where: (p, { isNull }) => isNull(p.deletedAt) },
      achievements: { where: (a, { isNull }) => isNull(a.deletedAt) },
      certifications: { where: (cert, { isNull }) => isNull(cert.deletedAt) },
      socials: { where: (s, { isNull }) => isNull(s.deletedAt) },
      interests: { where: (i, { isNull }) => isNull(i.deletedAt) },
      customSections: {
        where: (cs, { isNull }) => isNull(cs.deletedAt),
        with: { entries: { where: (e, { isNull }) => isNull(e.deletedAt) } },
      },
    },
  });
}

export type CvSource = Awaited<ReturnType<typeof loadCvSources>>[number];

type Reviewable = {
  id: string;
  status: string;
  proofKey?: string | null;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
};

function proofUrl(entity: "achievements" | "certifications", id: string) {
  return `${authEnv.BETTER_AUTH_URL}/api/${entity}/${id}/proof`;
}

function shape<T extends Reviewable>(
  rows: T[],
  kind: CvExportKind,
  markFor: (row: T) => CvMark,
): WithMark<T>[] {
  return rows
    .filter((row) =>
      kind === CvExportKind.STANDARD
        ? row.status === VerificationStatus.VERIFIED
        : row.status !== VerificationStatus.REJECTED,
    )
    .map((row) => ({
      ...row,
      rejectionReason: null,
      reviewedBy: null,
      reviewedAt: null,
      mark: row.status === VerificationStatus.VERIFIED ? markFor(row) : null,
    }));
}

export function buildCvData(source: CvSource, kind: CvExportKind): CvData {
  const {
    user,
    results,
    experiences,
    projects,
    achievements,
    certifications,
    socials,
    interests,
    customSections,
    ...student
  } = source;

  return {
    student,
    user: { ...user, image: null },
    institution: DEFAULT_INSTITUTION,

    experiences,
    projects,
    interests,
    socials,
    customSections,

    achievements: shape(achievements, kind, (row) => ({
      proofUrl: row.proofKey ? proofUrl("achievements", row.id) : null,
    })),
    certifications: shape(certifications, kind, (row) => ({
      proofUrl: row.proofKey ? proofUrl("certifications", row.id) : null,
    })),
    results: shape(results, kind, () => ({ proofUrl: null })).map((row) => ({
      ...row,
      pendingSgpa: null,
    })),

    cgpaMark: student.cgpa === null ? null : { proofUrl: null },
  };
}
