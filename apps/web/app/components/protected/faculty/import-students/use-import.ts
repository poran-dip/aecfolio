import type { Branch, Course } from "@aecfolio/shared";
import ExcelJS from "exceljs";
import Papa from "papaparse";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { parseApi } from "~/lib/api";
import { apiClient } from "~/lib/api-client";
import { parseRawRows, validateRow } from "./parse-students";
import type { ImportResult, ParsedRow } from "./types";

export function useImport() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
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
            const values = (row.values as ExcelJS.CellValue[]).slice(1);
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
      const res = await apiClient.api.students.import.$post({
        json: {
          students: validRows.map((r) => ({
            name: r.name.trim(),
            email: r.email.trim(),
            rollNo: r.rollNo.trim(),
            course: r.course as Course,
            branch: r.branch as Branch,
            semester: parseInt(r.semester, 10),
            cgpa: r.cgpa ? parseFloat(r.cgpa) : null,
          })),
        },
      });
      const data = await parseApi<ImportResult>(res);
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const clearAll = () => {
    setRows([]);
    setResult(null);
  };

  const errorCount = rows.filter((r) => r._errors.length > 0).length;
  const validCount = rows.filter((r) => r._errors.length === 0).length;

  return {
    rows,
    fileRef,
    importing,
    result,
    errorCount,
    validCount,
    updateRow,
    removeRow,
    handleFile,
    handleDrop,
    handleImport,
    clearAll,
  };
}
