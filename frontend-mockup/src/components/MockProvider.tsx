"use client";

import { useEffect } from "react";

const db = {
  profile: {
    student: {
      rollNo: "220101001",
      course: "BTECH",
      branch: "CSE",
      semester: 6,
      cgpa: 8.75,
      skills: ["React", "Next.js", "TypeScript", "Python"],
      bio: "Passionate software engineer building web apps.",
    },
    counts: {
      verifiedSemesters: 4,
      totalSemesters: 5,
      projects: 3,
      experiences: 2,
      achievements: 1,
      certifications: 2,
    },
    profileCompletion: 85,
  },
  results: [
    { id: "1", semester: 1, sgpa: 8.5, verified: true, verifiedBy: "Dr. Smith", verifiedAt: new Date().toISOString() },
    { id: "2", semester: 2, sgpa: 8.8, verified: true, verifiedBy: "Dr. Smith", verifiedAt: new Date().toISOString() },
    { id: "3", semester: 3, sgpa: 8.6, verified: true, verifiedBy: "Dr. Smith", verifiedAt: new Date().toISOString() },
    { id: "4", semester: 4, sgpa: 9.0, verified: true, verifiedBy: "Dr. Smith", verifiedAt: new Date().toISOString() },
    { id: "5", semester: 5, sgpa: 8.9, verified: false },
  ],
  skills: ["React", "Next.js", "TypeScript", "Python", "Tailwind CSS", "Data Structures"],
  projects: [
    { id: "p1", title: "Student Management System", description: "A system to manage students, built with Next.js", techStack: ["Next.js", "Prisma"], link: "https://github.com/test" },
  ],
  experiences: [
    { id: "e1", title: "Frontend Intern", organization: "Tech Corp", type: "INTERNSHIP", description: "Built accessible UI components.", startDate: "2023-05-01", endDate: "2023-08-01" },
  ],
  achievements: [
    { id: "a1", title: "1st Place Hackathon", description: "Won the state level hackathon.", verified: true },
  ],
  certifications: [
    { id: "c1", name: "AWS Developer", issuer: "Amazon", issueDate: "2023-12-01", verified: false },
  ],
  students: [
    {
      id: "u1",
      name: "John Doe",
      email: "john@aecian.ac.in",
      image: "",
      student: { rollNo: "220101001", course: "BTECH", branch: "CSE", semester: 6, cgpa: 8.75 },
    },
    {
      id: "u2",
      name: "Alice Smith",
      email: "alice@aecian.ac.in",
      image: "",
      student: { rollNo: "220101005", course: "BTECH", branch: "CSE", semester: 6, cgpa: 9.20 },
    },
  ],
  query: []
};

function getMockData(url: string, init?: RequestInit) {
  if (init?.method === "POST" || init?.method === "PUT" || init?.method === "DELETE") {
    // Just return success for mutations
    return { success: true };
  }

  if (url.includes("/api/student/profile")) return db.profile;
  if (url.includes("/api/student/results")) return db.results;
  if (url.includes("/api/student/skills")) return db.skills;
  if (url.includes("/api/student/projects")) return db.projects;
  if (url.includes("/api/student/experience")) return db.experiences;
  if (url.includes("/api/student/achievements")) return db.achievements;
  if (url.includes("/api/student/certifications")) return db.certifications;
  if (url.includes("/api/faculty/students")) return db.students;
  if (url.includes("/api/admin/query")) return db.students;

  return {}; // Default
}

export function MockProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const originalFetch = window.fetch;
      window.fetch = async (input, init) => {
        const url = typeof input === "string" ? input : (input instanceof Request ? input.url : String(input));
        
        if (url.includes("/api/")) {
          return new Response(JSON.stringify(getMockData(url, init)), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return originalFetch(input, init);
      };
    }
  }, []);

  return <>{children}</>;
}
