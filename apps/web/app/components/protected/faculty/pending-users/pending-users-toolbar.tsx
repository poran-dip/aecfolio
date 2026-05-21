import { Search } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";

interface PendingUsersToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  selectedCount: number;
  approving: boolean;
  onApprove: () => void;
}

export function PendingUsersToolbar({
  search,
  onSearchChange,
  selectedCount,
  approving,
  onApprove,
}: PendingUsersToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />
        <input
          type="text"
          placeholder="Search by name, email or roll number..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
        />
      </div>
      {selectedCount > 0 && (
        <Button onClick={onApprove} disabled={approving} size="sm">
          {approving ? <Spinner /> : `Approve (${selectedCount})`}
        </Button>
      )}
    </div>
  );
}
