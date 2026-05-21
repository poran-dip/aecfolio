import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";

interface VerificationToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  typeFilter: string;
  onTypeChange: (v: string) => void;
  branchFilter: string;
  onBranchChange: (v: string) => void;
  branches: string[];
  selectedCount: number;
  batchVerifying: boolean;
  onBatchVerify: () => void;
}

export function VerificationToolbar({
  search,
  onSearchChange,
  typeFilter,
  onTypeChange,
  branchFilter,
  onBranchChange,
  branches,
  selectedCount,
  batchVerifying,
  onBatchVerify,
}: VerificationToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <input
        type="text"
        placeholder="Search by student name or roll no..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="flex-1 pl-4 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
      />
      <div className="flex items-center gap-3">
        <select
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value)}
          className="py-2 pl-3 pr-8 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white outline-none"
        >
          <option value="ALL">All Types</option>
          <option value="Result">Results</option>
          <option value="Achievement">Achievements</option>
          <option value="Certification">Certifications</option>
        </select>
        <select
          value={branchFilter}
          onChange={(e) => onBranchChange(e.target.value)}
          className="py-2 pl-3 pr-8 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white outline-none"
        >
          <option value="ALL">All Branches</option>
          {branches.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        {selectedCount > 0 && (
          <Button onClick={onBatchVerify} disabled={batchVerifying} size="sm">
            {batchVerifying ? <Spinner /> : `Verify (${selectedCount})`}
          </Button>
        )}
      </div>
    </div>
  );
}
