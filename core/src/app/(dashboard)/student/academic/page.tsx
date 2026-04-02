"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, VerificationBadge } from "@/components/ui/Badge";
import { PageLoader } from "@/components/ui/Spinner";
import { GraduationCap, Plus, Lock, TrendingUp, Info } from "lucide-react";
import { calculateCGPA } from "@/lib/utils";
import toast from "react-hot-toast";

interface Result {
  id: string;
  semester: number;
  sgpa: number;
  verified: boolean;
  verifiedAt: string | null;
}

export default function AcademicPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newSem, setNewSem] = useState<number>(1);
  const [newSgpa, setNewSgpa] = useState<string>("");

  useEffect(() => {
    fetch("/api/student/results")
      .then((r) => r.json())
      .then((d) => {
        setResults(d.results ?? []);
        // Suggest next semester
        const maxSem = Math.max(0, ...((d.results ?? []) as Result[]).map((r) => r.semester));
        setNewSem(Math.min(maxSem + 1, 8));
      })
      .finally(() => setLoading(false));
  }, []);

  const verifiedSgpas = results.filter((r) => r.verified).map((r) => r.sgpa);
  const allSgpas = results.map((r) => r.sgpa);
  const cgpa = calculateCGPA(allSgpas);
  const verifiedCgpa = calculateCGPA(verifiedSgpas);

  const handleAddResult = async () => {
    const sgpaVal = parseFloat(newSgpa);
    if (isNaN(sgpaVal) || sgpaVal < 0 || sgpaVal > 10) {
      toast.error("SGPA must be between 0 and 10");
      return;
    }
    if (results.find((r) => r.semester === newSem)) {
      toast.error("Result for this semester already exists");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/student/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ semester: newSem, sgpa: sgpaVal }),
      });
      if (res.ok) {
        const newResult = await res.json();
        setResults((prev) => [...prev, newResult.result].sort((a, b) => a.semester - b.semester));
        setNewSgpa("");
        setNewSem((prev) => Math.min(prev + 1, 8));
        toast.success("Semester result added!");
      } else {
        const err = await res.json();
        toast.error(err.error ?? "Failed to add result");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const getSgpaColor = (sgpa: number) => {
    if (sgpa >= 9) return "text-emerald-600";
    if (sgpa >= 7.5) return "text-blue-600";
    if (sgpa >= 6) return "text-amber-600";
    return "text-red-500";
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <Navbar
        title="Academic Records"
        subtitle="Semester-wise SGPA · Faculty verified & locked"
      />

      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* CGPA Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-2 bg-linear-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white shadow-md">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="opacity-70" />
              <p className="text-blue-100 text-sm font-medium">Overall CGPA</p>
            </div>
            <p className="text-4xl font-bold">{cgpa.toFixed(2)}</p>
            <p className="text-blue-200 text-xs mt-1">Based on {results.length} semesters</p>
          </div>
          <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Lock size={16} className="text-slate-400" />
              <p className="text-slate-500 text-sm font-medium">Verified CGPA</p>
            </div>
            <p className="text-4xl font-bold text-slate-900">{verifiedCgpa.toFixed(2)}</p>
            <p className="text-slate-400 text-xs mt-1">
              {verifiedSgpas.length}/{results.length} semesters verified
            </p>
          </div>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700">
            Once a semester result is <strong>Verified & Locked</strong> by your Faculty Advisor, you
            cannot edit it. Contact your advisor if you believe there is an error.
          </p>
        </div>

        {/* Results Table */}
        <Card padding="none">
          <CardHeader
            title="Semester Results"
            icon={<GraduationCap size={18} />}
            description="Enter your SGPA · awaits faculty verification"
          />

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-slate-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Semester
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    SGPA
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Verified At
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-sm">
                      No results added yet. Add your first semester below.
                    </td>
                  </tr>
                ) : (
                  results.map((result) => (
                    <tr
                      key={result.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center">
                            {result.semester}
                          </div>
                          <span className="font-medium text-slate-700">Semester {result.semester}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-2xl font-bold ${getSgpaColor(result.sgpa)}`}>
                          {result.sgpa.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <VerificationBadge verified={result.verified} />
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {result.verifiedAt
                          ? new Date(result.verifiedAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Add new result */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-xl">
            <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">
              Add Semester Result
            </p>
            <div className="flex items-end gap-3">
              <div className="w-40">
                <label className="block text-xs text-slate-500 mb-1.5">Semester</label>
                <select
                  value={newSem}
                  onChange={(e) => setNewSem(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white outline-none focus:border-blue-400"
                >
                  {Array.from({ length: 8 }, (_, i) => i + 1)
                    .filter((s) => !results.find((r) => r.semester === s) || !results.find((r) => r.semester === s)?.verified)
                    .map((s) => (
                      <option key={s} value={s} disabled={!!results.find((r) => r.semester === s && r.verified)}>
                        Semester {s}
                      </option>
                    ))}
                </select>
              </div>
              <div className="w-40">
                <label className="block text-xs text-slate-500 mb-1.5">SGPA (0 – 10)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={newSgpa}
                  onChange={(e) => setNewSgpa(e.target.value)}
                  placeholder="e.g. 8.75"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition"
                  onKeyDown={(e) => e.key === "Enter" && handleAddResult()}
                />
              </div>
              <Button
                onClick={handleAddResult}
                loading={submitting}
                icon={<Plus size={14} />}
              >
                Add Result
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
