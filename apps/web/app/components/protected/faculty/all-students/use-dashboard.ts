import { useEffect, useState } from "react";
import { toast } from "sonner";
import { parseApi } from "~/lib/api";
import { apiClient } from "~/lib/api-client";

export interface StudentListDetails {
  id: string;
  name: string | null;
  rollNo: string;
  course: string;
  branch: string;
  semester: number;
  cgpa: number | null;
  unverifiedResults: number;
  unverifiedAchievements: number;
}

interface DashboardData {
  students: StudentListDetails[];
  pendingUsers: number;
}

export function useDashboard() {
  const [data, setData] = useState<StudentListDetails[]>([]);
  const [filtered, setFiltered] = useState<StudentListDetails[]>([]);
  const [pendingUsers, setPendingUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [minCgpa, setMinCgpa] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiClient.api.dashboard.$get();
        const d = await parseApi<DashboardData>(res);
        setData(d.students ?? []);
        setFiltered(d.students ?? []);
        setPendingUsers(d.pendingUsers ?? 0);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to load dashboard",
        );
      } finally {
        setLoading(false);
      }
    }
    load();
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
    if (branchFilter !== "ALL")
      result = result.filter((stu) => stu.branch === branchFilter);
    if (courseFilter !== "ALL")
      result = result.filter((stu) => stu.course === courseFilter);
    if (minCgpa)
      result = result.filter(
        (stu) =>
          stu.cgpa !== null &&
          parseFloat(String(stu.cgpa)) >= parseFloat(minCgpa),
      );
    setFiltered(result);
  }, [search, branchFilter, courseFilter, data, minCgpa]);

  async function handleExport() {
    setExporting(true);
    try {
      const zipRes = await apiClient.api.cv.generate.bulk.$post({
        json: {
          template: "standard",
          ids: Array.from(selected),
        },
      });
      const blob = await zipRes.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resumes.zip";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(filtered.map((s) => s.id)) : new Set());
  }

  const pendingOverall = data.filter(
    (s) => s.unverifiedResults > 0 || s.unverifiedAchievements > 0,
  ).length;

  return {
    data,
    filtered,
    pendingUsers,
    pendingOverall,
    loading,
    search,
    setSearch,
    branchFilter,
    setBranchFilter,
    courseFilter,
    setCourseFilter,
    minCgpa,
    setMinCgpa,
    selected,
    exporting,
    handleExport,
    toggleOne,
    toggleAll,
  };
}
