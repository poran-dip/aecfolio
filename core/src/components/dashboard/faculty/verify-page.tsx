"use client";

import { Award, Check, FileBadge, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

interface PendingItem {
  id: string;
  type: "Result" | "Achievement" | "Certification";
  name: string;
  proofImage: string | null;
  student: { id: string; name: string | null; rollNo: string; branch: string };
  createdAt: string;
}

const BATCH_ENDPOINTS: Record<string, string> = {
  Achievement: "/api/achievement/verify/batch",
  Certification: "/api/certification/verify/batch",
  Result: "/api/result/verify/batch",
};

const SINGLE_ENDPOINTS: Record<string, string> = {
  Achievement: "achievement",
  Certification: "certification",
  Result: "result",
};

const getTypeIcon = (type: string) => {
  if (type === "Result") return <FileText size={18} className="text-blue-500" />;
  if (type === "Achievement") return <Award size={18} className="text-purple-500" />;
  if (type === "Certification") return <FileBadge size={18} className="text-green-500" />;
};

export default function VerificationPage() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchVerifying, setBatchVerifying] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/faculty/verifications")
      .then((r) => r.json())
      .then((data) => setItems(data.pending))
      .catch(() => toast.error("Failed to load pending items"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((item) => {
    const s = search.toLowerCase();
    if (s && !(item.student.name ?? "").toLowerCase().includes(s) && !item.student.rollNo.toLowerCase().includes(s)) return false;
    if (typeFilter !== "ALL" && item.type !== typeFilter) return false;
    if (branchFilter !== "ALL" && item.student.branch !== branchFilter) return false;
    return true;
  });

  const branches = Array.from(new Set(items.map((i) => i.student.branch))).sort();

  const handleSingleApprove = async (item: PendingItem) => {
    const res = await fetch(`/api/${SINGLE_ENDPOINTS[item.type]}/${item.id}/verify`, { method: "PATCH" });
    if (!res.ok) { toast.error("Verification failed"); return; }
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setSelected((prev) => { const next = new Set(prev); next.delete(item.id); return next; });
    toast.success("Item verified");
  };

  const handleBatchVerify = async () => {
    setBatchVerifying(true);
    try {
      // Group selected ids by type
      const byType: Record<string, string[]> = { Achievement: [], Certification: [], Result: [] };
      for (const id of selected) {
        const item = items.find((i) => i.id === id);
        if (item) byType[item.type].push(id);
      }

      await Promise.all(
        Object.entries(byType)
          .filter(([, ids]) => ids.length > 0)
          .map(([type, ids]) =>
            fetch(BATCH_ENDPOINTS[type], {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ids }),
            })
          )
      );

      setItems((prev) => prev.filter((i) => !selected.has(i.id)));
      setSelected(new Set());
      toast.success(`${selected.size} item(s) verified`);
    } catch {
      toast.error("Batch verification failed");
    } finally {
      setBatchVerifying(false);
    }
  };

  if (loading) return <Spinner />;

  const allFilteredSelected = filtered.length > 0 && filtered.every((i) => selected.has(i.id));

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <input
          type="text"
          placeholder="Search by student name or roll no..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 pl-4 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
        />
        <div className="flex items-center gap-3">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="py-2 pl-3 pr-8 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white outline-none">
            <option value="ALL">All Types</option>
            <option value="Result">Results</option>
            <option value="Achievement">Achievements</option>
            <option value="Certification">Certifications</option>
          </select>
          <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}
            className="py-2 pl-3 pr-8 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white outline-none">
            <option value="ALL">All Branches</option>
            {branches.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          {selected.size > 0 && (
            <Button onClick={handleBatchVerify} disabled={batchVerifying} size="sm">
              {batchVerifying ? <Spinner /> : `Verify (${selected.size})`}
            </Button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Check className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
          <h3 className="text-lg font-medium text-slate-900">All caught up!</h3>
          <p className="text-slate-500 mt-2">There are no pending items to verify.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">
                    <input type="checkbox" checked={allFilteredSelected}
                      onChange={(e) => setSelected(e.target.checked ? new Set(filtered.map((i) => i.id)) : new Set())} />
                  </th>
                  <th className="px-6 py-4">Item Details</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <input type="checkbox" checked={selected.has(item.id)}
                        onChange={(e) => setSelected((prev) => {
                          const next = new Set(prev);
                          e.target.checked ? next.add(item.id) : next.delete(item.id);
                          return next;
                        })} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                          {getTypeIcon(item.type)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={item.type === "Result" ? "default" : "outline"}>{item.type}</Badge>
                            <span className="text-xs text-slate-500">{item.student.branch}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-700 block">{item.student.name}</span>
                      <span className="text-xs text-slate-500">{item.student.rollNo}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600">{new Date(item.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button type="button" onClick={() => handleSingleApprove(item)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Approve">
                        <Check size={18} />
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
