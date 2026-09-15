import {
  Branch,
  Course,
  composeDate,
  StudentStatus,
  VerificationStatus,
} from "@aecfolio/shared";
import type { CvData } from "./types";
import { DEFAULT_INSTITUTION } from "./types";

const now = new Date("2026-09-15T00:00:00.000Z");

const timestamps = { createdAt: now, updatedAt: now, deletedAt: null };

export function makeCvData(overrides: Partial<CvData> = {}): CvData {
  return {
    institution: DEFAULT_INSTITUTION,

    user: {
      id: "u1",
      name: "Ananya **Borah**",
      email: "ananya.borah@aec.ac.in",
      emailVerified: true,
      phone: "+91 98640 00000",
      image: null,
      role: "STUDENT",
      banned: false,
      banReason: null,
      banExpires: null,
      ...timestamps,
    },

    student: {
      id: "s1",
      userId: "u1",
      rollNo: "22CSE001",
      course: Course.BTECH,
      branch: Branch.CSE,
      semester: 7,
      status: StudentStatus.ACTIVE,
      admissionYear: 2022,
      bio: "Final-year CSE student. Interested in **distributed systems** and compilers.\n\n- Maintainer of a small Rust crate\n- Teaching assistant for Data Structures",
      skills: ["TypeScript", "Rust", "PostgreSQL", "Docker"],
      cgpa: 8.74,
      titleSought: "Backend Engineer",
      dob: null,
      gender: null,
      caste: null,
      religion: null,
      spokenLanguages: ["Assamese", "English", "Hindi"],
      motherName: null,
      motherContact: null,
      fatherName: null,
      fatherContact: null,
      location: "Jorhat, Assam, India",
      ...timestamps,
    },

    experiences: [
      {
        id: "e1",
        studentId: "s1",
        type: "Internship",
        title: "Backend Intern",
        organization: "Zeta Systems",
        description:
          "Rewrote the ingestion pipeline.\n\n- Cut p99 latency from 1.8s to 240ms\n- Added `idempotency-key` handling to every write endpoint",
        date: composeDate({ start: { year: 2025, month: 6 }, present: true }),
        ...timestamps,
      },
    ],

    projects: [
      {
        id: "p1",
        studentId: "s1",
        title: "gradebook",
        description:
          "A CGPA calculator that understands *credit schemes*. Written in TypeScript.",
        link: "https://github.com/example/gradebook",
        ...timestamps,
      },
      {
        id: "p2",
        studentId: "s1",
        title: "No link here",
        description: "Deliberately has no `link`, so no external-link arrow.",
        link: null,
        ...timestamps,
      },
    ],

    interests: [
      {
        id: "i1",
        studentId: "s1",
        title: "Field recording",
        body: "Collecting ambient audio around the Brahmaputra.",
        ...timestamps,
      },
    ],

    socials: [
      {
        id: "so1",
        studentId: "s1",
        title: "GitHub",
        url: "https://github.com/ananyab",
        ...timestamps,
      },
      {
        id: "so2",
        studentId: "s1",
        title: "LinkedIn",
        url: "https://linkedin.com/in/ananyab",
        ...timestamps,
      },
      {
        id: "so3",
        studentId: "s1",
        title: "Zulip",
        url: "https://chat.example.org/@ananya",
        ...timestamps,
      },
    ],

    achievements: [
      {
        id: "a1",
        studentId: "s1",
        title: "Smart India Hackathon — finalist",
        description: "Top 6 of 340 teams in the software edition.",
        proofKey: "proof/a1.pdf",
        status: VerificationStatus.VERIFIED,
        rejectionReason: null,
        reviewedBy: "mod-1",
        reviewedAt: now,
        ...timestamps,
        mark: { proofUrl: "https://aecfolio.example/api/proof/proof%2Fa1.pdf" },
      },
      {
        id: "a2",
        studentId: "s1",
        title: "Departmental topper, semester 5",
        description: "Highest SGPA in CSE for the semester.",
        proofKey: null,
        status: VerificationStatus.VERIFIED,
        rejectionReason: null,
        reviewedBy: "mod-1",
        reviewedAt: now,
        ...timestamps,
        mark: { proofUrl: null },
      },
      {
        id: "a3",
        studentId: "s1",
        title: "Inter-college quiz — runner up",
        description: "Submitted last week, not reviewed yet.",
        proofKey: "proof/a3.jpg",
        status: VerificationStatus.PENDING,
        rejectionReason: null,
        reviewedBy: null,
        reviewedAt: null,
        ...timestamps,
        mark: null,
      },
    ],

    certifications: [
      {
        id: "c1",
        studentId: "s1",
        name: "AWS Certified Cloud Practitioner",
        issuer: "Amazon Web Services",
        issueDate: "2025-03",
        credentialLink: "https://verify.example.com/abc123",
        proofKey: "proof/c1.pdf",
        status: VerificationStatus.VERIFIED,
        rejectionReason: null,
        reviewedBy: "mod-2",
        reviewedAt: now,
        ...timestamps,
        mark: { proofUrl: "https://aecfolio.example/api/proof/proof%2Fc1.pdf" },
      },
    ],

    results: [
      {
        id: "r5",
        studentId: "s1",
        semester: 5,
        schemeId: "sch-5",
        sgpa: 8.9,
        pendingSgpa: null,
        status: VerificationStatus.VERIFIED,
        rejectionReason: null,
        reviewedBy: "mod-1",
        reviewedAt: now,
        ...timestamps,
        mark: { proofUrl: null },
      },
      {
        id: "r6",
        studentId: "s1",
        semester: 6,
        schemeId: "sch-6",
        sgpa: 8.58,
        pendingSgpa: null,
        status: VerificationStatus.VERIFIED,
        rejectionReason: null,
        reviewedBy: "mod-1",
        reviewedAt: now,
        ...timestamps,
        mark: { proofUrl: null },
      },
    ],

    customSections: [
      {
        id: "cs1",
        studentId: "s1",
        name: "Publications",
        ...timestamps,
        entries: [
          {
            id: "cse1",
            customSectionId: "cs1",
            title: "*A note on loose date parsing*",
            org: "AEC Technical Review",
            date: "2026",
            body: "Short paper on why a CV date field should be free text.",
            ...timestamps,
          },
        ],
      },
    ],

    cgpaMark: { proofUrl: null },

    ...overrides,
  };
}
