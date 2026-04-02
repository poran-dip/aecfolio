"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { StatCard } from "@/components/ui/Card";
import { Badge, VerificationBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/Spinner";
import {
  GraduationCap,
  Code2,
  FolderGit2,
  Briefcase,
  Trophy,
  FileText,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  student: {
    rollNo: string;
    course: string;
    branch: string;
    semester: number;
    cgpa: number | null;
    skills: string[];
    bio: string | null;
  } | null;
  counts: {
    verifiedSemesters: number;
    totalSemesters: number;
    projects: number;
    experiences: number;
    achievements: number;
    certifications: number;
  };
  profileCompletion: number;
}

export default function StudentDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/profile")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const { student, counts, profileCompletion } = data ?? {
    student: null,
    counts: {
      verifiedSemesters: 0,
      totalSemesters: 0,
      projects: 0,
      experiences: 0,
      achievements: 0,
      certifications: 0,
    },
    profileCompletion: 0,
  };

  const quickLinks = [
    {
      label: "Update Profile",
      href: "/student/profile",
      icon: <ChevronRight size={16} />,
    },
    {
      label: "Add Semester Results",
      href: "/student/academic",
      icon: <ChevronRight size={16} />,
    },
    {
      label: "Manage Projects",
      href: "/student/projects",
      icon: <ChevronRight size={16} />,
    },
    {
      label: "Generate CV",
      href: "/student/cv",
      icon: <ChevronRight size={16} />,
    },
  ];

  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (profileCompletion / 100) * circumference;

  return (
    <div>
      <Navbar
        title="My Dashboard"
        subtitle={
          student
            ? `${student.course} · ${student.branch} · Sem ${student.semester}`
            : "Complete your profile to get started"
        }
        actions={
          <Link href="/student/cv">
            <Button size="sm" icon={<FileText size={14} />}>
              Generate CV
            </Button>
          </Link>
        }
      />

      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Profile completion banner */}
        {profileCompletion < 80 && (
          <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertCircle size={20} className="text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                Your profile is {profileCompletion}% complete
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                A complete profile helps generate a better CV and improves
                placement visibility.
              </p>
            </div>
            <Link href="/student/profile">
              <Button size="sm" variant="outline">
                Complete Now
              </Button>
            </Link>
          </div>
        )}

        {/* Profile Completion Ring + Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Completion ring */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center shadow-sm">
            <div className="relative w-20 h-20 mb-3">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="6"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s ease" }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-900">
                {profileCompletion}%
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 text-center">
              Profile Complete
            </p>
          </div>

          <StatCard
            label="CGPA"
            value={student?.cgpa?.toFixed(2) ?? "N/A"}
            icon={<GraduationCap size={22} />}
            color="blue"
            trend={`${counts.verifiedSemesters}/${counts.totalSemesters} semesters verified`}
          />
          <StatCard
            label="Skills"
            value={student?.skills?.length ?? 0}
            icon={<Code2 size={22} />}
            color="purple"
            trend="Listed on profile"
          />
          <StatCard
            label="Projects"
            value={counts.projects}
            icon={<FolderGit2 size={22} />}
            color="green"
            trend={`+ ${counts.experiences} experiences`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Links */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">
              Quick Actions
            </h2>
            <div className="space-y-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors group"
                >
                  <span>{link.label}</span>
                  <span className="text-slate-300 group-hover:text-blue-400 transition-colors">
                    {link.icon}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Skills preview */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Skills
              </h2>
              <Link href="/student/skills">
                <button className="text-xs text-blue-600 hover:underline">
                  Edit
                </button>
              </Link>
            </div>
            {student?.skills && student.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {student.skills.slice(0, 10).map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100"
                  >
                    {skill}
                  </span>
                ))}
                {student.skills.length > 10 && (
                  <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-xs font-medium rounded-full border border-slate-100">
                    +{student.skills.length - 10} more
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                No skills added yet.{" "}
                <Link
                  href="/student/skills"
                  className="text-blue-600 hover:underline"
                >
                  Add skills →
                </Link>
              </p>
            )}
          </div>

          {/* Achievements summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Achievements
              </h2>
              <Link href="/student/achievements">
                <button className="text-xs text-blue-600 hover:underline">
                  View All
                </button>
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Trophy size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {counts.achievements} Achievements
                  </p>
                  <p className="text-xs text-slate-400">Listed on profile</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Briefcase size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {counts.certifications} Certifications
                  </p>
                  <p className="text-xs text-slate-400">Listed on profile</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
