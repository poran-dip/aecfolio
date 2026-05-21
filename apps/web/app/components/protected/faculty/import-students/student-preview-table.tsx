import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { Card } from "~/components/ui/card";
import { EditableCell } from "./editable-cell";
import { BRANCHES, COURSES } from "./parse-students";
import { SelectCell } from "./select-cell";
import type { ParsedRow } from "./types";

interface StudentPreviewTableProps {
  rows: ParsedRow[];
  onUpdate: (
    id: string,
    field: keyof Omit<ParsedRow, "_id" | "_errors">,
    value: string,
  ) => void;
  onRemove: (id: string) => void;
}

export function StudentPreviewTable({
  rows,
  onUpdate,
  onRemove,
}: StudentPreviewTableProps) {
  return (
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
                    onChange={(v) => onUpdate(row._id, "name", v)}
                  />
                </td>
                <td className="px-4 py-2">
                  <EditableCell
                    value={row.email}
                    onChange={(v) => onUpdate(row._id, "email", v)}
                  />
                </td>
                <td className="px-4 py-2">
                  <EditableCell
                    value={row.rollNo}
                    onChange={(v) => onUpdate(row._id, "rollNo", v)}
                  />
                </td>
                <td className="px-4 py-2">
                  <SelectCell
                    value={row.course}
                    options={COURSES}
                    onChange={(v) => onUpdate(row._id, "course", v)}
                  />
                </td>
                <td className="px-4 py-2">
                  <SelectCell
                    value={row.branch}
                    options={BRANCHES}
                    onChange={(v) => onUpdate(row._id, "branch", v)}
                  />
                </td>
                <td className="px-4 py-2">
                  <SelectCell
                    value={row.semester}
                    options={["1", "2", "3", "4", "5", "6", "7", "8"]}
                    onChange={(v) => onUpdate(row._id, "semester", v)}
                  />
                </td>
                <td className="px-4 py-2">
                  <EditableCell
                    value={row.cgpa}
                    onChange={(v) => onUpdate(row._id, "cgpa", v)}
                  />
                </td>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => onRemove(row._id)}
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
  );
}
