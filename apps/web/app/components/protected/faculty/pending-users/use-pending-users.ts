import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { parseApi } from "~/lib/api";
import { apiClient } from "~/lib/api-client";
import type { EditableField, PendingStudent } from "./types";

export const COURSES = ["BTECH", "MTECH", "BCA", "MCA"];
export const BRANCHES = [
  "CSE",
  "ETE",
  "EE",
  "IE",
  "ME",
  "CE",
  "IPE",
  "CHE",
  "CA",
];

export function usePendingUsers() {
  const [students, setStudents] = useState<PendingStudent[]>([]);
  const [edits, setEdits] = useState<
    Record<string, Partial<Record<EditableField, string>>>
  >({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [approving, setApproving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    apiClient.api.students.pending
      .$get()
      .then((res) => parseApi<PendingStudent[]>(res))
      .then((d) => setStudents(d ?? []))
      .catch((err) =>
        toast.error(
          err instanceof Error
            ? err.message
            : "Failed to load pending students",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (s.user.name ?? "").toLowerCase().includes(q) ||
      s.user.email.toLowerCase().includes(q) ||
      s.rollNo.toLowerCase().includes(q)
    );
  });

  const getField = (s: PendingStudent, field: EditableField): string =>
    edits[s.id]?.[field] ??
    String(field === "cgpa" ? (s.cgpa ?? "") : s[field]);

  const handleEdit = (
    studentId: string,
    field: EditableField,
    value: string,
  ) => {
    setEdits((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value },
    }));

    clearTimeout(saveTimers.current[studentId]);
    saveTimers.current[studentId] = setTimeout(async () => {
      setSaving((prev) => ({ ...prev, [studentId]: true }));
      try {
        const res = await apiClient.api.students[":id"].$patch({
          param: { id: studentId },
          json: { ...edits[studentId], [field]: value } as Record<
            string,
            unknown
          >,
        });
        await parseApi(res);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to save changes",
        );
      } finally {
        setSaving((prev) => ({ ...prev, [studentId]: false }));
      }
    }, 800);
  };

  const handleBulkApprove = async () => {
    setApproving(true);
    try {
      const res = await apiClient.api.students.approve.$patch({
        json: { ids: Array.from(selected) },
      });
      await parseApi(res);
      setStudents((prev) => prev.filter((s) => !selected.has(s.id)));
      setSelected(new Set());
      toast.success(`${selected.size} student(s) approved`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setApproving(false);
    }
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean) =>
    setSelected(checked ? new Set(filtered.map((s) => s.id)) : new Set());

  const allSelected =
    filtered.length > 0 && filtered.every((s) => selected.has(s.id));

  return {
    filtered,
    loading,
    search,
    setSearch,
    saving,
    selected,
    approving,
    allSelected,
    getField,
    handleEdit,
    handleBulkApprove,
    toggleOne,
    toggleAll,
  };
}
