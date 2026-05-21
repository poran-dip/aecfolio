import { Card, CardContent } from "~/components/ui/card";
import { Spinner } from "~/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { InlineInput } from "./inline-input";
import { InlineSelect } from "./inline-select";
import type { EditableField, PendingStudent } from "./types";
import { BRANCHES, COURSES } from "./use-pending-users";

interface PendingUsersTableProps {
  students: PendingStudent[];
  selected: Set<string>;
  saving: Record<string, boolean>;
  allSelected: boolean;
  getField: (s: PendingStudent, field: EditableField) => string;
  onEdit: (id: string, field: EditableField, value: string) => void;
  onToggleOne: (id: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
}

export function PendingUsersTable({
  students,
  selected,
  saving,
  allSelected,
  getField,
  onEdit,
  onToggleOne,
  onToggleAll,
}: PendingUsersTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onToggleAll(e.target.checked)}
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
            {students.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-12 text-center text-slate-500"
                >
                  No pending students.
                </TableCell>
              </TableRow>
            ) : (
              students.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={(e) => onToggleOne(s.id, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-slate-900 block">
                      {s.user.name ?? "—"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {s.user.email}
                    </span>
                  </TableCell>
                  <TableCell>
                    <InlineInput
                      value={getField(s, "rollNo")}
                      onChange={(v) => onEdit(s.id, "rollNo", v)}
                    />
                  </TableCell>
                  <TableCell>
                    <InlineSelect
                      value={getField(s, "course")}
                      options={COURSES}
                      onChange={(v) => onEdit(s.id, "course", v)}
                    />
                  </TableCell>
                  <TableCell>
                    <InlineSelect
                      value={getField(s, "branch")}
                      options={BRANCHES}
                      onChange={(v) => onEdit(s.id, "branch", v)}
                    />
                  </TableCell>
                  <TableCell>
                    <InlineInput
                      type="number"
                      value={getField(s, "semester")}
                      onChange={(v) => onEdit(s.id, "semester", v)}
                    />
                  </TableCell>
                  <TableCell>
                    <InlineInput
                      type="number"
                      value={getField(s, "cgpa")}
                      onChange={(v) => onEdit(s.id, "cgpa", v)}
                    />
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs">
                    {new Date(s.user.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>{saving[s.id] && <Spinner />}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
