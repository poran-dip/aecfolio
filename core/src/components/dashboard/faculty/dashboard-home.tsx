"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface StudentListDetails {
  id: string;
  name: string | null;
  rollNo: string;
  course: string;
  batch: string;
  semester: number;
  cgpa: number | null;
  unverifiedResults: number;
  unverifiedAchievements: number;
}

export default function FacultyDashboard() {
  const [data, setData] = useState<StudentListDetails[]>([]);
  const [batchFilter, setBatchFilter] = useState("ALL");
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [filtered, setFiltered] = useState<StudentListDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pendingUsers, setPendingUsers] = useState(0);

  useEffect(() => {
    fetch("/api/faculty/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setData(d.students || []);
        setFiltered(d.students || []);
        setPendingUsers(d.pendingUsers || 0);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = data;
    const s = search.toLowerCase();
    if (s) {
      result = result.filter(
        (stu) =>
          (stu.name || "").toLowerCase().includes(s) ||
          (stu.rollNo || "").toLowerCase().includes(s),
      );
    }
    if (batchFilter !== "ALL")
      result = result.filter((stu) => stu.batch === batchFilter);
    if (courseFilter !== "ALL")
      result = result.filter((stu) => stu.course === courseFilter);
    setFiltered(result);
  }, [search, batchFilter, courseFilter, data]);

  if (loading) return <Spinner />;

  const pendingOverall = data.filter(
    (s) => s.unverifiedResults > 0 || s.unverifiedAchievements > 0,
  ).length;

  return (
    <div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="relative p-4">
            {pendingOverall > 0 && (
              <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            )}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm text-muted-foreground">
                  Pending Verifications
                </p>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold">{pendingOverall}</p>
              <Button variant="secondary" size="sm" asChild>
                <Link href="/faculty/verify">Review & Verify</Link>
              </Button>
            </div>
          </Card>
          <Card className="relative p-4">
            {pendingUsers > 0 && (
              <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm text-muted-foreground">
                  Pending User Approvals
                </p>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold">{pendingUsers}</p>
              <Button variant="secondary" size="sm" asChild>
                <Link href="/faculty/users">Review & Approve</Link>
              </Button>
            </div>
          </Card>
        </div>

        {/* Action / Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search students by name or roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="py-2 pl-3 pr-8 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white outline-none"
            >
              <option value="ALL">All Batches</option>
              <option value="2024">2026</option>
              <option value="2023">2025</option>
              <option value="2022">2024</option>
            </select>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="py-2 pl-3 pr-8 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white outline-none"
            >
              <option value="ALL">All Courses</option>
              <option value="BTECH">BTECH</option>
              <option value="MTECH">MTECH</option>
              <option value="MCA">MCA</option>
            </select>
          </div>
        </div>

        {/* Student List */}
        <Card className="overflow-hidden">
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
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      No students found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((stu) => (
                    <tr
                      key={stu.id}
                      className="hover:bg-slate-50/50 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">
                            {stu.name || "Unknown"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {stu.rollNo}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-700">
                          {stu.course}
                        </span>
                        <span className="text-slate-400 mx-1">·</span>
                        <span className="text-slate-600">
                          Sem {stu.semester}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-slate-800">
                          {stu.cgpa ? stu.cgpa.toFixed(2) : "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {stu.unverifiedResults > 0 && (
                            <Badge>
                              {stu.unverifiedResults} Res
                            </Badge>
                          )}
                          {stu.unverifiedAchievements > 0 && (
                            <Badge>
                              {stu.unverifiedAchievements} Achv
                            </Badge>
                          )}
                          {stu.unverifiedResults === 0 &&
                            stu.unverifiedAchievements === 0 && (
                              <Badge variant="secondary">
                                Up to date
                              </Badge>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/faculty/students/${stu.id}`}>
                          <button
                            type="button"
                            className="px-4 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition"
                          >
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
