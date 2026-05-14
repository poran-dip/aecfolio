"use client";

import ExcelJS from "exceljs";
import { AlertCircle, CheckCircle2, Upload, X } from "lucide-react";
import Papa from "papaparse";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const COURSES = ["BTECH", "MTECH", "BCA", "MCA"] as const;
const BRANCHES = [
  "CSE",
  "ETE",
  "EE",
  "IE",
  "ME",
  "CE",
  "IPE",
  "CHE",
  "CA",
] as const;
type Course = (typeof COURSES)[number];
type Branch = (typeof BRANCHES)[number];

export interface ParsedRow {
  _id: string; // local only for keying
  name: string;
  email: string;
  rollNo: string;
  course: string;
  branch: string;
  semester: string;
  cgpa: string;
  _errors: string[];
}

// ── Fuzzy column mapper ──────────────────────────────────────────────────────

const FIELD_ALIASES: Record<string, string> = {};

const addAliases = (canonical: string, aliases: string[]) => {
  for (const a of aliases)
    FIELD_ALIASES[a.toLowerCase().replace(/[\s_\-.]/g, "")] = canonical;
};

addAliases("name", [
  "name",
  "fullname",
  "full name",
  "studentname",
  "student name",
  "firstname",
  "first name",
  "lastname",
  "last name",
]);
addAliases("email", [
  "email",
  "emailaddress",
  "email address",
  "mail",
  "emailid",
  "email id",
]);
addAliases("rollNo", [
  "rollno",
  "roll no",
  "roll",
  "rollnumber",
  "roll number",
  "enrollment",
  "enrollmentno",
  "enrollment no",
  "regno",
  "reg no",
  "registrationno",
]);
addAliases("course", ["course", "program", "programme", "degree"]);
addAliases("branch", [
  "branch",
  "dept",
  "department",
  "discipline",
  "specialization",
  "stream",
]);
addAliases("semester", [
  "semester",
  "sem",
  "currentsemester",
  "current semester",
  "semno",
  "sem no",
]);
addAliases("cgpa", ["cgpa", "gpa", "cpi", "aggregate", "percentage"]);
addAliases("firstName", [
  "firstname",
  "first name",
  "fname",
  "given name",
  "givenname",
]);
addAliases("lastName", [
  "lastname",
  "last name",
  "lname",
  "surname",
  "family name",
  "familyname",
]);

function normalizeKey(raw: string): string {
  return raw.toLowerCase().replace(/[\s_\-.]/g, "");
}

function mapColumns(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const h of headers) {
    const normalized = normalizeKey(h);
    if (FIELD_ALIASES[normalized]) map[h] = FIELD_ALIASES[normalized];
  }
  return map;
}

function normalizeValue(field: string, raw: string): string {
  const v = raw.trim();
  if (field === "course") {
    const upper = v.toUpperCase();
    if (upper === "B.TECH" || upper === "BE") return "BTECH";
    if (upper === "M.TECH" || upper === "ME") return "MTECH";
    return upper;
  }
  if (field === "branch") return v.toUpperCase();
  return v;
}

function validateRow(row: Omit<ParsedRow, "_errors" | "_id">): string[] {
  const errors: string[] = [];
  if (!row.name.trim()) errors.push("Missing name");
  if (!row.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email))
    errors.push("Invalid email");
  if (!row.rollNo.trim()) errors.push("Missing roll number");
  if (!COURSES.includes(row.course as Course))
    errors.push(`Invalid course: ${row.course || "empty"}`);
  if (!BRANCHES.includes(row.branch as Branch))
    errors.push(`Invalid branch: ${row.branch || "empty"}`);
  const sem = parseInt(row.semester, 10);
  if (Number.isNaN(sem) || sem < 1 || sem > 8)
    errors.push("Semester must be 1–8");
  if (
    row.cgpa &&
    (Number.isNaN(parseFloat(row.cgpa)) ||
      parseFloat(row.cgpa) < 0 ||
      parseFloat(row.cgpa) > 10)
  )
    errors.push("CGPA must be 0–10");
  return errors;
}

function parseRawRows(rawRows: Record<string, string>[]): ParsedRow[] {
  if (rawRows.length === 0) return [];
  const colMap = mapColumns(Object.keys(rawRows[0]));

  return rawRows.map((raw, i) => {
    const get = (field: string) => {
      const header = Object.entries(colMap).find(([, f]) => f === field)?.[0];
      return header ? normalizeValue(field, raw[header] ?? "") : "";
    };

    // Handle split first/last name columns
    let name = get("name");
    if (!name) {
      const first = get("firstName");
      const last = get("lastName");
      name = [first, last].filter(Boolean).join(" ");
    }

    const row = {
      name,
      email: get("email"),
      rollNo: get("rollNo"),
      course: get("course"),
      branch: get("branch"),
      semester: get("semester"),
      cgpa: get("cgpa"),
    };

    return {
      _id: `row-${i}-${Date.now()}`,
      ...row,
      _errors: validateRow(row),
    };
  });
}

// ── Inline cell editors ──────────────────────────────────────────────────────

function EditableCell({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full py-1 px-2 border border-slate-200 rounded text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-none min-w-20"
    />
  );
}

function SelectCell({
  value,
  options,
  onChange,
}: {
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full py-1 px-2 border border-slate-200 rounded text-sm bg-slate-50 focus:bg-white focus:border-blue-500 outline-none"
    >
      <option value="">Select</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function ImportStudentsPage() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    errors: { row: string; reason: string }[];
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const updateRow = (
    id: string,
    field: keyof Omit<ParsedRow, "_id" | "_errors">,
    value: string,
  ) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r._id !== id) return r;
        const updated = { ...r, [field]: value };
        return { ...updated, _errors: validateRow(updated) };
      }),
    );
  };

  const removeRow = (id: string) =>
    setRows((prev) => prev.filter((r) => r._id !== id));

  const handleFile = (file: File) => {
    setResult(null);
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => setRows(parseRawRows(res.data)),
        error: () => toast.error("Failed to parse CSV"),
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(buffer);
          const ws = workbook.worksheets[0];

          const rawRows: Record<string, string>[] = [];
          let headers: string[] = [];

          ws.eachRow((row, rowNumber) => {
            const values = (row.values as ExcelJS.CellValue[]).slice(1); // ExcelJS rows are 1-indexed, index 0 is always null
            if (rowNumber === 1) {
              headers = values.map((v) => String(v ?? ""));
            } else {
              const obj: Record<string, string> = {};
              headers.forEach((h, i) => {
                obj[h] = String(values[i] ?? "");
              });
              rawRows.push(obj);
            }
          });

          setRows(parseRawRows(rawRows));
        } catch {
          toast.error("Failed to parse Excel file");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast.error("Only .csv, .xlsx, and .xls files are supported");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    const validRows = rows.filter((r) => r._errors.length === 0);
    if (validRows.length === 0) {
      toast.error("No valid rows to import");
      return;
    }

    setImporting(true);
    try {
      const res = await fetch("/api/student/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          students: validRows.map((r) => ({
            name: r.name.trim(),
            email: r.email.trim(),
            rollNo: r.rollNo.trim(),
            course: r.course,
            branch: r.branch,
            semester: parseInt(r.semester, 10),
            cgpa: r.cgpa ? parseFloat(r.cgpa) : null,
          })),
        }),
      });

      const data = await res.json();
      setResult(data);
      if (data.created > 0) {
        setRows((prev) => {
          const imported = new Set(validRows.map((r) => r._id));
          return prev.filter((r) => !imported.has(r._id));
        });
        toast.success(`${data.created} student(s) imported`);
      }
      if (data.errors?.length > 0)
        toast.error(`${data.errors.length} row(s) failed`);
    } finally {
      setImporting(false);
    }
  };

  const errorCount = rows.filter((r) => r._errors.length > 0).length;
  const validCount = rows.filter((r) => r._errors.length === 0).length;

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      {rows.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-slate-300 rounded-xl p-16 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition"
        >
          <Upload className="mx-auto mb-3 text-slate-400" size={32} />
          <p className="text-slate-600 font-medium">
            Drop a CSV or Excel file here
          </p>
          <p className="text-slate-400 text-sm mt-1">or click to browse</p>
          <p className="text-slate-400 text-xs mt-3">
            Accepts: name, email, roll no, course, branch, semester, cgpa
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      )}

      {/* Toolbar */}
      {rows.length > 0 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{rows.length} rows</Badge>
            {validCount > 0 && (
              <Badge className="bg-emerald-100 text-emerald-700">
                {validCount} valid
              </Badge>
            )}
            {errorCount > 0 && (
              <Badge className="bg-red-100 text-red-700">
                {errorCount} with errors
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRows([]);
                setResult(null);
              }}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={handleImport}
              disabled={importing || validCount === 0}
            >
              {importing
                ? "Importing..."
                : `Import ${validCount} student${validCount !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      )}

      {/* Result summary */}
      {result && (
        <Card className="p-4 space-y-2">
          {result.created > 0 && (
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 size={16} />
              <span className="text-sm">
                {result.created} student(s) successfully imported
              </span>
            </div>
          )}
          {result.errors.map((e, i) => (
            <div key={i} className="flex items-center gap-2 text-red-600">
              <AlertCircle size={16} />
              <span className="text-sm">{e.reason}</span>
            </div>
          ))}
        </Card>
      )}

      {/* Preview table */}
      {rows.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Roll No</th>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Sem</th>
                  <th className="px-4 py-3">CGPA</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr
                    key={row._id}
                    className={row._errors.length > 0 ? "bg-red-50/40" : ""}
                  >
                    <td className="px-4 py-2">
                      {row._errors.length === 0 ? (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      ) : (
                        <div className="group relative">
                          <AlertCircle
                            size={16}
                            className="text-red-500 cursor-pointer"
                          />
                          <div className="absolute left-6 top-0 z-10 hidden group-hover:block bg-white border border-red-200 rounded-lg shadow-lg p-2 w-48 text-xs text-red-600 space-y-1">
                            {row._errors.map((e, i) => (
                              <div key={i}>{e}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <EditableCell
                        value={row.name}
                        onChange={(v) => updateRow(row._id, "name", v)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <EditableCell
                        value={row.email}
                        onChange={(v) => updateRow(row._id, "email", v)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <EditableCell
                        value={row.rollNo}
                        onChange={(v) => updateRow(row._id, "rollNo", v)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <SelectCell
                        value={row.course}
                        options={COURSES}
                        onChange={(v) => updateRow(row._id, "course", v)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <SelectCell
                        value={row.branch}
                        options={BRANCHES}
                        onChange={(v) => updateRow(row._id, "branch", v)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <SelectCell
                        value={row.semester}
                        options={["1", "2", "3", "4", "5", "6", "7", "8"]}
                        onChange={(v) => updateRow(row._id, "semester", v)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <EditableCell
                        value={row.cgpa}
                        onChange={(v) => updateRow(row._id, "cgpa", v)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => removeRow(row._id)}
                        className="text-slate-400 hover:text-red-500 transition"
                      >
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
