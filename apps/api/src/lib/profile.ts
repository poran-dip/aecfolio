import { Role, VerificationStatus } from "@aecfolio/shared";
import { db } from "./db";
import type { Actor } from "./session";

export const ProfileView = {
  OWNER: "owner",
  STAFF: "staff",
  PUBLIC: "public",
} as const;

export type ProfileView = (typeof ProfileView)[keyof typeof ProfileView];

export function viewForActor(actor: Actor, isOwnProfile: boolean): ProfileView {
  if (isOwnProfile) return ProfileView.OWNER;
  if (actor.role === Role.MOD || actor.role === Role.ADMIN)
    return ProfileView.OWNER;
  return ProfileView.STAFF;
}

const REVIEWER = { columns: { id: true, name: true } } as const;

export async function loadStudentProfile(studentId: string) {
  return db.query.studentsTable.findFirst({
    where: (s, { and, eq, isNull }) =>
      and(eq(s.id, studentId), isNull(s.deletedAt)),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          role: true,
        },
      },
      results: {
        where: (r, { isNull }) => isNull(r.deletedAt),
        with: { scheme: true, reviewer: REVIEWER },
        orderBy: (r, { asc }) => asc(r.semester),
      },
      experiences: { where: (e, { isNull }) => isNull(e.deletedAt) },
      projects: { where: (p, { isNull }) => isNull(p.deletedAt) },
      achievements: {
        where: (a, { isNull }) => isNull(a.deletedAt),
        with: { reviewer: REVIEWER },
      },
      certifications: {
        where: (cert, { isNull }) => isNull(cert.deletedAt),
        with: { reviewer: REVIEWER },
      },
      socials: { where: (s, { isNull }) => isNull(s.deletedAt) },
      interests: { where: (i, { isNull }) => isNull(i.deletedAt) },
      customSections: {
        where: (cs, { isNull }) => isNull(cs.deletedAt),
        with: { entries: { where: (e, { isNull }) => isNull(e.deletedAt) } },
      },
    },
  });
}

export type StudentProfile = NonNullable<
  Awaited<ReturnType<typeof loadStudentProfile>>
>;

type Reviewable = {
  status: string;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewer?: { id: string; name: string } | null;
};

export function projectReviewable<T extends Reviewable>(
  rows: T[],
  view: ProfileView,
): T[] {
  if (view === ProfileView.OWNER) return rows;

  const verified = rows.filter(
    (row) => row.status === VerificationStatus.VERIFIED,
  );

  if (view === ProfileView.STAFF)
    return verified.map(({ rejectionReason: _drop, ...rest }) => rest as T);

  return verified.map(
    ({
      rejectionReason: _reason,
      reviewedBy: _by,
      reviewedAt: _at,
      reviewer: _reviewer,
      ...rest
    }) => rest as T,
  );
}

export function projectStudentProfile(
  profile: StudentProfile,
  view: ProfileView,
) {
  return {
    ...profile,
    results: projectReviewable(profile.results, view),
    achievements: projectReviewable(profile.achievements, view),
    certifications: projectReviewable(profile.certifications, view),
  };
}
