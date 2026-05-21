import { Check } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { TypeIcon } from "./type-icon";
import type { PendingItem } from "./types";

interface VerificationTableProps {
  items: PendingItem[];
  selected: Set<string>;
  allFilteredSelected: boolean;
  onToggleOne: (id: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onApprove: (item: PendingItem) => void;
}

export function VerificationTable({
  items,
  selected,
  allFilteredSelected,
  onToggleOne,
  onToggleAll,
  onApprove,
}: VerificationTableProps) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-4">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={(e) => onToggleAll(e.target.checked)}
                />
              </th>
              <th className="px-6 py-4">Item Details</th>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={(e) => onToggleOne(item.id, e.target.checked)}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                      <TypeIcon type={item.type} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={
                            item.type === "Result" ? "default" : "outline"
                          }
                        >
                          {item.type}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {item.student.branch}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium text-slate-700 block">
                    {item.student.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    {item.student.rollNo}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-slate-600">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onApprove(item)}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                    title="Approve"
                  >
                    <Check size={18} />
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
