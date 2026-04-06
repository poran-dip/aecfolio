"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/dashboard/ui/Badge";
import { Card } from "@/components/dashboard/ui/Card";
import { Navbar } from "@/components/dashboard/ui/Navbar";
import { PageLoader } from "@/components/dashboard/ui/Spinner";

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

const mockStudents: StudentListDetails[] = [
  {
    id: "1",
    name: "Alice Smith",
    rollNo: "CSE23001",
    course: "BTECH",
    batch: "2023",
    semester: 5,
    cgpa: 8.9,
    unverifiedResults: 1,
    unverifiedAchievements: 0,
  },
  {
    id: "2",
    name: "Bob Jones",
    rollNo: "CSE23002",
    course: "BTECH",
    batch: "2023",
    semester: 5,
    cgpa: 7.5,
    unverifiedResults: 0,
    unverifiedAchievements: 2,
  },
  {
    id: "3",
    name: "Charlie Brown",
    rollNo: "ECE22001",
    course: "BTECH",
    batch: "2022",
    semester: 7,
    cgpa: 9.2,
    unverifiedResults: 0,
    unverifiedAchievements: 0,
  },
  {
    id: "4",
    name: "Diana Prince",
    rollNo: "MCA24001",
    course: "MCA",
    batch: "2024",
    semester: 2,
    cgpa: null,
    unverifiedResults: 2,
    unverifiedAchievements: 1,
  },
];

export default function StudentsDirectoryPage() {
  const [data, setData] = useState<StudentListDetails[]>([]);
  const [filtered, setFiltered] = useState<StudentListDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("ALL");
  const [courseFilter, setCourseFilter] = useState("ALL");

  useEffect(() => {
    // Simulated API call
    setTimeout(() => {
      setData(mockStudents);
      setFiltered(mockStudents);
      setLoading(false);
    }, 400);
  }, []);

  useEffect(() => {
    let result = data;

    // Search
    const s = search.toLowerCase();
    if (s) {
      result = result.filter(
        (stu) =>
          (stu.name || "").toLowerCase().includes(s) ||
          (stu.rollNo || "").toLowerCase().includes(s),
      );
    }

    // Filter by Batch
    if (batchFilter !== "ALL") {
      result = result.filter((stu) => stu.batch === batchFilter);
    }

    // Filter by Course
    if (courseFilter !== "ALL") {
      result = result.filter((stu) => stu.course === courseFilter);
    }

    setFiltered(result);
  }, [search, batchFilter, courseFilter, data]);

  if (loading) return <PageLoader />;

  return (
    <div>
      <Navbar
        title="Student Directory"
        subtitle="View and manage all assigned students"
      />

      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Filters and Search Bar */}
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
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
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
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Course & Batch</th>
                  <th className="px-6 py-4 text-center">CGPA</th>
                  <th className="px-6 py-4">Status</th>
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
                          Batch {stu.batch}
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
                            <Badge variant="warning" dot>
                              {stu.unverifiedResults} Res
                            </Badge>
                          )}
                          {stu.unverifiedAchievements > 0 && (
                            <Badge variant="warning" dot>
                              {stu.unverifiedAchievements} Achv
                            </Badge>
                          )}
                          {stu.unverifiedResults === 0 &&
                            stu.unverifiedAchievements === 0 && (
                              <Badge variant="success" icon>
                                Updated
                              </Badge>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/dashboard/students/${stu.id}`}>
                          <button
                            type="button"
                            className="px-4 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition"
                          >
                            View Profile
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
