import { Link } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import type { StudentListDetails } from "./use-dashboard";

interface StudentTableProps {
  students: StudentListDetails[];
  selected: Set<string>;
  onToggleOne: (id: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
}

export function StudentTable({
  students,
  selected,
  onToggleOne,
  onToggleAll,
}: StudentTableProps) {
  const allSelected =
    students.length > 0 && students.every((s) => selected.has(s.id));

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-4">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onToggleAll(e.target.checked)}
                />
              </th>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Course & Sem</th>
              <th className="px-6 py-4 text-center">CGPA</th>
              <th className="px-6 py-4">Pending Verifications</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-slate-500"
                >
                  No students found matching your criteria.
                </td>
              </tr>
            ) : (
              students.map((stu) => (
                <tr key={stu.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selected.has(stu.id)}
                      onChange={(e) => onToggleOne(stu.id, e.target.checked)}
                    />
                  </td>
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
                    <span className="text-slate-600">Sem {stu.semester}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-slate-800">
                      {stu.cgpa ? stu.cgpa.toFixed(2) : "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {stu.unverifiedResults > 0 && (
                        <Badge>{stu.unverifiedResults} Res</Badge>
                      )}
                      {stu.unverifiedAchievements > 0 && (
                        <Badge>{stu.unverifiedAchievements} Achv</Badge>
                      )}
                      {stu.unverifiedResults === 0 &&
                        stu.unverifiedAchievements === 0 && (
                          <Badge variant="secondary">Up to date</Badge>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/faculty/students/${stu.id}`}>
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
  );
}
