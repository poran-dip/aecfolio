import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { seed } from "drizzle-seed";
import { Pool } from "pg";
import * as schema from "./schema";
import {
  achievementsTable,
  certificationsTable,
  experiencesTable,
  facultyTable,
  projectsTable,
  resultsTable,
  socialsTable,
  studentsTable,
  usersTable,
} from "./schema";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL is not set");

const pool = new Pool({ connectionString: dbUrl });
const db = drizzle(pool, { schema });

await seed(db, {
  usersTable,
  studentsTable,
  facultyTable,
  resultsTable,
  experiencesTable,
  projectsTable,
  achievementsTable,
  certificationsTable,
  socialsTable,
}).refine((f) => ({
  usersTable: {
    count: 15,
    columns: {
      name: f.fullName(),
      email: f.email(),
      role: f.valuesFromArray({
        values: [
          "STUDENT",
          "STUDENT",
          "STUDENT",
          "STUDENT",
          "PENDING",
          "PENDING",
          "FACULTY",
        ],
        isUnique: false,
      }),
      emailVerified: f.default({ defaultValue: null }),
      phone: f.default({ defaultValue: null }),
      image: f.default({ defaultValue: null }),
      deletedAt: f.default({ defaultValue: null }),
    },
    with: {
      studentsTable: [
        { weight: 0.6, count: 1 },
        { weight: 0.4, count: 0 },
      ],
      facultyTable: [
        { weight: 0.15, count: 1 },
        { weight: 0.85, count: 0 },
      ],
    },
  },
  studentsTable: {
    columns: {
      rollNo: f.string({ isUnique: true }),
      course: f.valuesFromArray({ values: ["BTECH", "MTECH", "BCA", "MCA"] }),
      branch: f.valuesFromArray({
        values: ["CSE", "ETE", "EE", "IE", "ME", "CE"],
      }),
      semester: f.int({ minValue: 1, maxValue: 8 }),
      cgpa: f.number({ minValue: 5.0, maxValue: 10.0, precision: 100 }),
      bio: f.loremIpsum(),
      skills: f.default({ defaultValue: [] }),
      deletedAt: f.default({ defaultValue: null }),
    },
    with: {
      resultsTable: [
        { weight: 0.7, count: 4 },
        { weight: 0.3, count: 0 },
      ],
      experiencesTable: [
        { weight: 0.5, count: 2 },
        { weight: 0.5, count: 0 },
      ],
      projectsTable: [
        { weight: 0.6, count: 2 },
        { weight: 0.4, count: 0 },
      ],
      achievementsTable: [
        { weight: 0.4, count: 1 },
        { weight: 0.6, count: 0 },
      ],
      certificationsTable: [
        { weight: 0.4, count: 1 },
        { weight: 0.6, count: 0 },
      ],
      socialsTable: [
        { weight: 0.6, count: 2 },
        { weight: 0.4, count: 0 },
      ],
    },
  },
  facultyTable: {
    columns: {
      employeeId: f.string({ isUnique: true }),
      designation: f.valuesFromArray({
        values: [
          "Professor",
          "Associate Professor",
          "Assistant Professor",
          "Lecturer",
        ],
      }),
      department: f.valuesFromArray({
        values: ["CSE", "ETE", "EE", "IE", "ME", "CE"],
      }),
      deletedAt: f.default({ defaultValue: null }),
    },
  },
  resultsTable: {
    columns: {
      semester: f.int({ minValue: 1, maxValue: 8 }),
      sgpa: f.number({ minValue: 5.0, maxValue: 10.0, precision: 100 }),
      pendingSgpa: f.number({ minValue: 5.0, maxValue: 10.0, precision: 100 }),
      verified: f.default({ defaultValue: false }),
      verifiedBy: f.default({ defaultValue: null }),
      verifiedAt: f.default({ defaultValue: null }),
    },
  },
  experiencesTable: {
    columns: {
      type: f.valuesFromArray({
        values: ["INTERNSHIP", "VOLUNTEER", "CLUB", "OTHER"],
      }),
      title: f.jobTitle(),
      organization: f.companyName(),
      description: f.loremIpsum(),
      startDate: f.date({ minDate: "2020-01-01", maxDate: "2023-01-01" }),
      endDate: f.date({ minDate: "2023-01-01", maxDate: "2024-12-01" }),
      deletedAt: f.default({ defaultValue: null }),
    },
  },
  projectsTable: {
    columns: {
      title: f.loremIpsum({ sentencesCount: 1 }),
      description: f.loremIpsum(),
      techStack: f.default({ defaultValue: [] }),
      link: f.default({ defaultValue: null }),
      deletedAt: f.default({ defaultValue: null }),
    },
  },
  achievementsTable: {
    columns: {
      title: f.loremIpsum({ sentencesCount: 1 }),
      description: f.loremIpsum(),
      proofImage: f.default({ defaultValue: null }),
      verified: f.default({ defaultValue: false }),
      verifiedBy: f.default({ defaultValue: null }),
      verifiedAt: f.default({ defaultValue: null }),
      deletedAt: f.default({ defaultValue: null }),
    },
  },
  certificationsTable: {
    columns: {
      name: f.loremIpsum({ sentencesCount: 1 }),
      issuer: f.companyName(),
      issueDate: f.date({ minDate: "2020-01-01", maxDate: "2024-12-01" }),
      proofImage: f.default({ defaultValue: null }),
      verified: f.default({ defaultValue: false }),
      verifiedBy: f.default({ defaultValue: null }),
      verifiedAt: f.default({ defaultValue: null }),
      deletedAt: f.default({ defaultValue: null }),
    },
  },
  socialsTable: {
    columns: {
      type: f.valuesFromArray({
        values: ["LINKEDIN", "GITHUB", "LEETCODE", "CODEFORCES", "OTHER"],
        isUnique: true,
      }),
      url: f.default({ defaultValue: "https://example.com" }),
    },
  },
}));

await pool.end();
console.log("Fake seed complete");
