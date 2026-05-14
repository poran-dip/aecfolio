"use client";

import { Award, Check, FileBadge, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

interface PendingItem {
  id: string;
  type: "Result" | "Achievement" | "Certification";
  name: string;
  proofImage: string | null;
  student: {
    id: string;
    name: string | null;
    rollNo: string;
    branch: string;
  };
  createdAt: string;
}

const getTypeIcon = (type: string) => {
  if (type === "Result")
    return <FileText size={18} className="text-blue-500" />;
  if (type === "Achievement")
    return <Award size={18} className="text-purple-500" />;
  if (type === "Certification")
    return <FileBadge size={18} className="text-green-500" />;
};

export default function VerificationPage() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/faculty/verifications")
      .then((r) => r.json())
      .then((data) => setItems(data.pending))
      .catch(() => toast.error("Failed to load pending items"))
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (
    item: PendingItem,
    action: "approve" | "reject",
  ) => {
    if (action === "approve") {
      const resourceMap: Record<string, string> = {
        Result: "result",
        Achievement: "achievement",
        Certification: "certification",
      };
      const res = await fetch(
        `/api/${resourceMap[item.type]}/${item.id}/verify`,
        {
          method: "PATCH",
        },
      );
      if (!res.ok) {
        toast.error("Verification failed");
        return;
      }
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    toast.success(`Item ${action === "approve" ? "verified" : "dismissed"}`);
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      {items.length === 0 ? (
        <Card className="text-center py-12">
          <Check className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
          <h3 className="text-lg font-medium text-slate-900">All caught up!</h3>
          <p className="text-slate-500 mt-2">
            There are no pending items to verify.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-semibold">
                <tr>
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
                      <div className="flex items-start gap-3">
                        <div className="mt-1 bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                          {getTypeIcon(item.type)}
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
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleAction(item, "approve")}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Approve"
                        >
                          <Check size={18} />
                        </button>
                      </div>
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
