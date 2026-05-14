"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";

interface PendingStudent {
  id: string;
  rollNo: string;
  course: string;
  branch: string;
  semester: number;
  cgpa: number | null;
  user: { id: string; name: string | null; email: string; createdAt: string };
}

type EditableField = "rollNo" | "course" | "branch" | "semester" | "cgpa";

const COURSES = ["BTECH", "MTECH", "BCA", "MCA"];
const BRANCHES = ["CSE", "ETE", "EE", "IE", "ME", "CE", "IPE", "CHE", "CA"];

function InlineSelect({ value, options, onChange }: {
  value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full py-1 px-2 border border-slate-200 rounded text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-none"
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function InlineInput({ value, type = "text", onChange }: {
  value: string; type?: string; onChange: (v: string) => void;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full py-1 px-2 border border-slate-200 rounded text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-none"
    />
  );
}

export default function PendingUsersPage() {
  const [students, setStudents] = useState<PendingStudent[]>([]);
  const [edits, setEdits] = useState<Record<string, Partial<Record<EditableField, string>>>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [approving, setApproving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    fetch("/api/student/pending")
      .then((r) => r.json())
      .then((d) => setStudents(d.students ?? []))
      .catch(() => toast.error("Failed to load pending students"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return !q ||
      (s.user.name ?? "").toLowerCase().includes(q) ||
      s.user.email.toLowerCase().includes(q) ||
      s.rollNo.toLowerCase().includes(q);
  });

  const getField = (s: PendingStudent, field: EditableField): string => {
    return edits[s.id]?.[field] ?? String(field === "cgpa" ? (s.cgpa ?? "") : s[field]);
  };

  const handleEdit = (studentId: string, field: EditableField, value: string) => {
    setEdits((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value },
    }));

    // Debounced save
    clearTimeout(saveTimers.current[studentId]);
    saveTimers.current[studentId] = setTimeout(async () => {
      setSaving((prev) => ({ ...prev, [studentId]: true }));
      try {
        const res = await fetch(`/api/student/${studentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...edits[studentId], [field]: value }),
        });
        if (!res.ok) toast.error("Failed to save changes");
      } finally {
        setSaving((prev) => ({ ...prev, [studentId]: false }));
      }
    }, 800);
  };

  const handleBulkApprove = async () => {
    setApproving(true);
    try {
      const res = await fetch("/api/student/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (!res.ok) { toast.error("Approval failed"); return; }
      setStudents((prev) => prev.filter((s) => !selected.has(s.id)));
      setSelected(new Set());
      toast.success(`${selected.size} student(s) approved`);
    } finally {
      setApproving(false);
    }
  };

  const allSelected = filtered.length > 0 && filtered.every((s) => selected.has(s.id));

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, email or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
          />
        </div>
        {selected.size > 0 && (
          <Button onClick={handleBulkApprove} disabled={approving} size="sm">
            {approving ? <Spinner /> : `Approve (${selected.size})`}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) =>
                      setSelected(e.target.checked ? new Set(filtered.map((s) => s.id)) : new Set())
                    }
                  />
                </TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Sem</TableHead>
                <TableHead>CGPA</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-slate-500">
                    No pending students.
                  </TableCell>
                </TableRow>
              ) : filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={(e) => setSelected((prev) => {
                        const next = new Set(prev);
                        e.target.checked ? next.add(s.id) : next.delete(s.id);
                        return next;
                      })}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-slate-900 block">{s.user.name ?? "—"}</span>
                    <span className="text-xs text-slate-500">{s.user.email}</span>
                  </TableCell>
                  <TableCell>
                    <InlineInput value={getField(s, "rollNo")} onChange={(v) => handleEdit(s.id, "rollNo", v)} />
                  </TableCell>
                  <TableCell>
                    <InlineSelect value={getField(s, "course")} options={COURSES} onChange={(v) => handleEdit(s.id, "course", v)} />
                  </TableCell>
                  <TableCell>
                    <InlineSelect value={getField(s, "branch")} options={BRANCHES} onChange={(v) => handleEdit(s.id, "branch", v)} />
                  </TableCell>
                  <TableCell>
                    <InlineInput type="number" value={getField(s, "semester")} onChange={(v) => handleEdit(s.id, "semester", v)} />
                  </TableCell>
                  <TableCell>
                    <InlineInput type="number" value={getField(s, "cgpa")} onChange={(v) => handleEdit(s.id, "cgpa", v)} />
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs">
                    {new Date(s.user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </TableCell>
                  <TableCell>
                    {saving[s.id] && <Spinner />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
