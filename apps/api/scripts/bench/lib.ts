import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  achievementsTable,
  certificationsTable,
  db,
  experiencesTable,
  interestsTable,
  projectsTable,
  resultsTable,
  semesterCreditSchemesTable,
  socialsTable,
  studentsTable,
  usersTable,
} from "@aecfolio/db";
import { Role } from "@aecfolio/shared";
import { createId } from "@paralleldrive/cuid2";
import { and, eq } from "drizzle-orm";
import type { Actor, SessionResolver } from "../../src/lib/session";

export const BENCH_DOMAIN = "bench.aecfolio.internal";
const INSERT_CHUNK = 1000;
const STATE_DIR = path.join(import.meta.dirname, ".state");

export type BenchState = {
  runId: string;
  studentCount: number;
  studentIds: string[];
  faculty: Actor;
  seededAt: string;
};

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size)
    out.push(items.slice(i, i + size));
  return out;
}

function statePath(studentCount: number) {
  return path.join(STATE_DIR, `${studentCount}.json`);
}

export function writeState(state: BenchState) {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(statePath(state.studentCount), JSON.stringify(state, null, 2));
}

export function readState(studentCount: number): BenchState | null {
  const file = statePath(studentCount);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8")) as BenchState;
}

export function benchSessionResolver(actor: Actor): SessionResolver {
  return async () => ({ user: actor, sessionId: "bench-session" });
}

async function ensureUser(
  email: string,
  name: string,
  role: Role,
): Promise<Actor> {
  const columns = {
    id: usersTable.id,
    name: usersTable.name,
    email: usersTable.email,
    role: usersTable.role,
  };
  const [existing] = await db
    .select(columns)
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(usersTable)
    .values({ id: createId(), name, email, emailVerified: true, role })
    .returning(columns);
  return created;
}

export const ensureReviewer = () =>
  ensureUser(`reviewer@${BENCH_DOMAIN}`, "Bench Reviewer", Role.MOD);

export const ensureFaculty = () =>
  ensureUser(`faculty@${BENCH_DOMAIN}`, "Bench Faculty", Role.FACULTY);

export async function ensureScheme(): Promise<string> {
  const [existing] = await db
    .select({ id: semesterCreditSchemesTable.id })
    .from(semesterCreditSchemesTable)
    .where(
      and(
        eq(semesterCreditSchemesTable.branch, "CSE"),
        eq(semesterCreditSchemesTable.admissionYear, 2023),
        eq(semesterCreditSchemesTable.semester, 3),
      ),
    )
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(semesterCreditSchemesTable)
    .values({
      branch: "CSE",
      admissionYear: 2023,
      semester: 3,
      totalCredits: 20,
    })
    .returning({ id: semesterCreditSchemesTable.id });
  return created.id;
}

type SeedArgs = {
  studentCount: number;
  runId: string;
  reviewerId: string;
  schemeId: string;
};

export async function seedBenchStudents({
  studentCount,
  runId,
  reviewerId,
  schemeId,
}: SeedArgs): Promise<string[]> {
  const now = new Date();
  const studentIds: string[] = [];

  const users: (typeof usersTable.$inferInsert)[] = [];
  const students: (typeof studentsTable.$inferInsert)[] = [];
  const achievements: (typeof achievementsTable.$inferInsert)[] = [];
  const certifications: (typeof certificationsTable.$inferInsert)[] = [];
  const results: (typeof resultsTable.$inferInsert)[] = [];
  const experiences: (typeof experiencesTable.$inferInsert)[] = [];
  const projects: (typeof projectsTable.$inferInsert)[] = [];
  const interests: (typeof interestsTable.$inferInsert)[] = [];
  const socials: (typeof socialsTable.$inferInsert)[] = [];

  for (let i = 0; i < studentCount; i++) {
    const userId = createId();
    const studentId = createId();
    studentIds.push(studentId);

    users.push({
      id: userId,
      name: `Bench Student ${i + 1}`,
      email: `student.${runId}.${i + 1}@${BENCH_DOMAIN}`,
      emailVerified: true,
      role: Role.STUDENT,
    });

    students.push({
      id: studentId,
      userId,
      rollNo: `BENCH-${runId}-${i + 1}`,
      course: "BTECH",
      branch: "CSE",
      semester: 3,
      admissionYear: 2023,
      status: "ACTIVE",
      bio: "Seeded by the bulk-export benchmark.",
      skills: ["TypeScript", "React", "PostgreSQL"],
    });

    for (const [title, kind] of [
      ["Hackathon winner", "VERIFIED"],
      ["Dean's list", "VERIFIED"],
      ["Paper submission", "PENDING"],
    ] as const) {
      const verified = kind === "VERIFIED";
      achievements.push({
        studentId,
        title,
        description: "Seeded achievement for the bulk-export benchmark.",
        status: kind,
        reviewedBy: verified ? reviewerId : null,
        reviewedAt: verified ? now : null,
      });
    }

    for (const name of ["AWS Certified Developer", "Google Cloud Associate"]) {
      certifications.push({
        studentId,
        name,
        issuer: "Some Institute",
        status: "VERIFIED",
        reviewedBy: reviewerId,
        reviewedAt: now,
      });
    }

    results.push({
      studentId,
      schemeId,
      semester: 3,
      sgpa: 8 + (i % 20) / 10,
      status: "VERIFIED",
      reviewedBy: reviewerId,
      reviewedAt: now,
    });

    experiences.push({
      studentId,
      type: "internship",
      title: "Software Engineering Intern",
      organization: "Some Company",
      description: "Worked on the thing end to end, shipped it, measured it.",
      date: "Summer 2025",
    });
    experiences.push({
      studentId,
      type: "club",
      title: "Coordinator",
      organization: "Coding Club",
      description: "Ran weekly sessions and a hackathon.",
      date: "2024-2025",
    });

    for (let p = 0; p < 3; p++) {
      projects.push({
        studentId,
        title: `Project ${p + 1}`,
        description:
          "Designed and shipped the thing end to end, then measured it in production.",
        link: "https://github.com/example/project",
      });
    }

    interests.push({ studentId, title: "Open source", body: null });
    interests.push({ studentId, title: "Competitive programming", body: null });

    socials.push({
      studentId,
      title: "GitHub",
      url: "https://github.com/example",
    });
    socials.push({
      studentId,
      title: "LinkedIn",
      url: "https://linkedin.com/in/example",
    });
  }

  await db.transaction(async (tx) => {
    for (const batch of chunk(users, INSERT_CHUNK))
      await tx.insert(usersTable).values(batch);
    for (const batch of chunk(students, INSERT_CHUNK))
      await tx.insert(studentsTable).values(batch);
    for (const batch of chunk(achievements, INSERT_CHUNK))
      await tx.insert(achievementsTable).values(batch);
    for (const batch of chunk(certifications, INSERT_CHUNK))
      await tx.insert(certificationsTable).values(batch);
    for (const batch of chunk(results, INSERT_CHUNK))
      await tx.insert(resultsTable).values(batch);
    for (const batch of chunk(experiences, INSERT_CHUNK))
      await tx.insert(experiencesTable).values(batch);
    for (const batch of chunk(projects, INSERT_CHUNK))
      await tx.insert(projectsTable).values(batch);
    for (const batch of chunk(interests, INSERT_CHUNK))
      await tx.insert(interestsTable).values(batch);
    for (const batch of chunk(socials, INSERT_CHUNK))
      await tx.insert(socialsTable).values(batch);
  });

  return studentIds;
}

type PolledJob = {
  id: string;
  status: string;
  completed: number;
  failed: number;
};

export async function pollJobs(
  fetchJobs: () => Promise<PolledJob[]>,
  onTick?: (jobs: PolledJob[]) => void,
  intervalMs = 500,
): Promise<PolledJob[]> {
  for (;;) {
    const jobs = await fetchJobs();
    onTick?.(jobs);
    if (jobs.every((j) => j.status === "SUCCEEDED" || j.status === "FAILED"))
      return jobs;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
