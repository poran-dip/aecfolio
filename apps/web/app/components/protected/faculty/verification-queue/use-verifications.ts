import { useEffect, useState } from "react";
import { toast } from "sonner";
import { parseApi } from "~/lib/api";
import { apiClient } from "~/lib/api-client";
import { BATCH_APPROVE, type PendingItem, SINGLE_APPROVE } from "./types";

export function useVerifications() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchVerifying, setBatchVerifying] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState("ALL");

  useEffect(() => {
    apiClient.api.faculty.verifications
      .$get()
      .then((res) => parseApi<{ pending: PendingItem[] }>(res))
      .then((data) => setItems(data.pending))
      .catch((err) =>
        toast.error(
          err instanceof Error ? err.message : "Failed to load pending items",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((item) => {
    const s = search.toLowerCase();
    if (
      s &&
      !(item.student.name ?? "").toLowerCase().includes(s) &&
      !item.student.rollNo.toLowerCase().includes(s)
    )
      return false;
    if (typeFilter !== "ALL" && item.type !== typeFilter) return false;
    if (branchFilter !== "ALL" && item.student.branch !== branchFilter)
      return false;
    return true;
  });

  const branches = Array.from(
    new Set(items.map((i) => i.student.branch)),
  ).sort();

  const handleSingleApprove = async (item: PendingItem) => {
    try {
      const res = await SINGLE_APPROVE[item.type](item.id);
      await parseApi(res);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
      toast.success("Item verified");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    }
  };

  const handleBatchVerify = async () => {
    setBatchVerifying(true);
    try {
      const byType: Record<string, string[]> = {
        Achievement: [],
        Certification: [],
        Result: [],
      };
      for (const id of selected) {
        const item = items.find((i) => i.id === id);
        if (item) byType[item.type].push(id);
      }

      await Promise.all(
        Object.entries(byType)
          .filter(([, ids]) => ids.length > 0)
          .map(([type, ids]) =>
            BATCH_APPROVE[type as keyof typeof BATCH_APPROVE](ids).then((res) =>
              parseApi(res),
            ),
          ),
      );

      setItems((prev) => prev.filter((i) => !selected.has(i.id)));
      setSelected(new Set());
      toast.success(`${selected.size} item(s) verified`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Batch verification failed",
      );
    } finally {
      setBatchVerifying(false);
    }
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean) =>
    setSelected(checked ? new Set(filtered.map((i) => i.id)) : new Set());

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((i) => selected.has(i.id));

  return {
    filtered,
    loading,
    branches,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    branchFilter,
    setBranchFilter,
    selected,
    batchVerifying,
    allFilteredSelected,
    handleSingleApprove,
    handleBatchVerify,
    toggleOne,
    toggleAll,
  };
}
