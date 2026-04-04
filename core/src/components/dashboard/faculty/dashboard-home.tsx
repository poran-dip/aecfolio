"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/dashboard/ui/Navbar";
import { StatCard, Card } from "@/components/dashboard/ui/Card";
import { PageLoader } from "@/components/dashboard/ui/Spinner";
import { Badge, VerificationBadge } from "@/components/dashboard/ui/Badge";
import { Users, AlertTriangle, Search, Filter } from "lucide-react";
import Link from "next/link";
import { formatExpType } from "@/lib/utils";

interface StudentListDetails {
  id: string;
  name: string | null;
  rollNo: string;
  course: string;
  semester: number;
  cgpa: number | null;
  unverifiedResults: number;
  unverifiedAchievements: number;
}

export default function FacultyDashboard() {
  const [data, setData] = useState<StudentListDetails[]>([]);
  const [filtered, setFiltered] = useState<StudentListDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/faculty/students")
      .then((r) => r.json())
      .then((d) => {
        setData(d.students || []);
        setFiltered(d.students || []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const s = search.toLowerCase();
    setFiltered(data.filter((stu) => 
      (stu.name || "").toLowerCase().includes(s) || 
      (stu.rollNo || "").toLowerCase().includes(s)
    ));
  }, [search, data]);

  if (loading) return <PageLoader />;

  const totalStudents = data.length;
  const pendingOverall = data.filter(s => s.unverifiedResults > 0 || s.unverifiedAchievements > 0).length;

  return (
    <div>
      <Navbar title="Faculty Advisor Dashboard" subtitle="Manage assigned students and verify records" />

      <div className="p-6 max-w-6xl mx-auto space-y-6">
        
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard
            label="Assigned Students"
            value={totalStudents}
            icon={<Users size={22} />}
            color="blue"
          />
          <StatCard
            label="Students Pending Verification"
            value={pendingOverall}
            icon={<AlertTriangle size={22} />}
            color={pendingOverall > 0 ? "yellow" : "green"}
          />
        </div>

        {/* Action / Search Bar */}
        <div className="flex gap-4 mb-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search students by name or roll number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
              />
            </div>
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition">
              <Filter size={16}/> Filter
            </button>
        </div>

        {/* Student List */}
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Course & Sem</th>
                  <th className="px-6 py-4 text-center">CGPA</th>
                  <th className="px-6 py-4">Pending Verifications</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No students found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((stu) => (
                    <tr key={stu.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{stu.name || "Unknown"}</span>
                          <span className="text-xs text-slate-500">{stu.rollNo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-700">{stu.course}</span>
                         <span className="text-slate-400 mx-1">·</span>
                        <span className="text-slate-600">Sem {stu.semester}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-slate-800">{stu.cgpa ? stu.cgpa.toFixed(2) : "—"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                           {stu.unverifiedResults > 0 && <Badge variant="warning" dot>{stu.unverifiedResults} Res</Badge>}
                           {stu.unverifiedAchievements > 0 && <Badge variant="warning" dot>{stu.unverifiedAchievements} Achv</Badge>}
                           {stu.unverifiedResults === 0 && stu.unverifiedAchievements === 0 && <Badge variant="success" icon>Up to date</Badge>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/faculty/students/${stu.id}`}>
                           <button className="px-4 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition">
                              Review Profile
                           </button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
    </div>
  );
}
