import { Branch, Role } from "@aecfolio/shared";
import { Trash2 } from "lucide-react";
import { IconButton } from "~/components/ui/icon-button";
import { ROLE_LABELS } from "~/lib/nav";
import { cn } from "~/lib/utils";

export type StaffDraft = {
  _id: string;
  name: string;
  email: string;
  employeeId: string;
  designation: string;
  department: string;
  role: string;
};

export function emptyStaffRow(department?: string): StaffDraft {
  return {
    _id: `staff-${crypto.randomUUID()}`,
    name: "",
    email: "",
    employeeId: "",
    designation: "",
    department: department ?? "",
    role: Role.FACULTY,
  };
}

type Column = {
  key: keyof Omit<StaffDraft, "_id">;
  label: string;
  width: string;
  kind?: "select";
  options?: readonly string[];
};

const COLUMNS: Column[] = [
  { key: "name", label: "Name", width: "min-w-44" },
  { key: "email", label: "Email", width: "min-w-56" },
  { key: "employeeId", label: "Employee ID", width: "min-w-32" },
  { key: "designation", label: "Designation", width: "min-w-36" },
  {
    key: "department",
    label: "Department",
    width: "min-w-28",
    kind: "select",
    options: ["", ...Object.values(Branch)],
  },
  { key: "role", label: "Role", width: "min-w-32", kind: "select" },
];

/**
 * The same shape as the student import grid, for the same reason: creating a
 * person is a row, never a dialog.
 */
export function StaffGrid({
  rows,
  roles,
  onChange,
  onRemove,
  disabled,
}: {
  rows: StaffDraft[];
  roles: readonly string[];
  onChange: (id: string, field: Column["key"], value: string) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface-raised">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-surface text-left text-xs text-ink-faint">
            {COLUMNS.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="px-2 py-2 font-medium"
              >
                {column.label}
              </th>
            ))}
            <th scope="col" className="w-10 px-2 py-2">
              <span className="sr-only">Remove</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row._id} className="border-b border-line last:border-b-0">
              {COLUMNS.map((column) => (
                <td key={column.key} className="p-0 align-middle">
                  {column.kind === "select" ? (
                    <select
                      value={row[column.key]}
                      disabled={disabled}
                      aria-label={`${column.label}, row ${index + 1}`}
                      onChange={(event) =>
                        onChange(row._id, column.key, event.target.value)
                      }
                      className={cn(
                        "h-9 w-full cursor-pointer bg-transparent px-2 text-sm text-ink outline-none focus:bg-primary-surface/60 disabled:opacity-50",
                        column.width,
                      )}
                    >
                      {(column.options ?? roles).map((option) => (
                        <option key={option || "none"} value={option}>
                          {option
                            ? (ROLE_LABELS[option as Role] ?? option)
                            : "None"}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={row[column.key]}
                      disabled={disabled}
                      aria-label={`${column.label}, row ${index + 1}`}
                      onChange={(event) =>
                        onChange(row._id, column.key, event.target.value)
                      }
                      className={cn(
                        "h-9 w-full bg-transparent px-2 text-sm text-ink outline-none focus:bg-primary-surface/60 focus:inset-ring-2 focus:inset-ring-primary disabled:opacity-50",
                        column.width,
                      )}
                    />
                  )}
                </td>
              ))}

              <td className="px-1 align-middle">
                <IconButton
                  label={`Remove row ${index + 1}`}
                  size="sm"
                  variant="danger"
                  disabled={disabled}
                  onClick={() => onRemove(row._id)}
                >
                  <Trash2 />
                </IconButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
